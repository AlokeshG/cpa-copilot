import "server-only";

import {
  createAgentRun,
  updateAgentRunStage,
  completeAgentRun,
  failAgentRun,
} from "@/agent/runtime/agent-run-service";

import { executeToolWithLogging } from "@/agent/runtime/tool-execution-service";

import { createAuditEvent } from "@/domain/audit/audit-service";

import type { AgentState } from "@/agent/state";

export interface RunCpaAgentInput {
  receiptId: string;
  requestId?: string;
  model?: string;
}

export interface RunCpaAgentResult {
  success: boolean;
  state: AgentState;
  agentRunId: string | null;
  error: string | null;
}

function normalizeMoney(value: number | null | undefined): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  return Math.round(value * 100) / 100;
}

export async function runCpaAgent(
  input: RunCpaAgentInput,
): Promise<RunCpaAgentResult> {
  let agentRunId: string | null = null;

  const state: AgentState = {
    selectedReceiptId: input.receiptId,
    processingStatus: "PROCESSING",
    processingStage: "IDLE",
    currentAnalysis: null,
    toolExecution: null,
    pendingApproval: null,
  };

  try {
    const agentRun = await createAgentRun({
      receiptId: input.receiptId,
      requestId: input.requestId,
      model: input.model,
    });

    if (!agentRun) {
      return {
        success: false,
        state: {
          ...state,
          processingStatus: "ERROR",
          processingStage: "ERROR",
        },
        agentRunId: null,
        error: "Receipt was not found.",
      };
    }

    agentRunId = agentRun.id;

    state.processingStage = "READING";

    const receiptResult = await executeToolWithLogging({
      toolName: "get_receipt_details",
      input: {
        receiptId: input.receiptId,
      },
      receiptId: input.receiptId,
      agentRunId,
      actor: "agent",
      model: input.model,
    });

    if (!receiptResult.success) {
      await failAgentRun(
        agentRunId,
        input.receiptId,
        receiptResult.error ?? "Failed to read receipt.",
      );

      return {
        success: false,
        state: {
          ...state,
          processingStatus: "ERROR",
          processingStage: "ERROR",
        },
        agentRunId,
        error: receiptResult.error ?? "Failed to read receipt.",
      };
    }

    const receipt = (
      receiptResult.output as {
        success: boolean;
        receipt: {
          subtotal: number;
          taxAmount: number;
          totalAmount: number;
          taxType: string | null;
          gstHstNumber: string | null;
          commercialUsePercentage: number;
          documentationStatus: string;
          gstHstNumberStatus: string;
          expenseCategory: string | null;
          vendorName: string;
        } | null;
      }
    ).receipt;

    if (!receipt) {
      throw new Error("Receipt details were not returned.");
    }

    await updateAgentRunStage(
      agentRunId,
      input.receiptId,
      "VALIDATING",
    );

    state.processingStage = "VALIDATING";

    const documentationResult = await executeToolWithLogging({
      toolName: "validate_cra_documentation",
      input: {
        amount: receipt.totalAmount,
        receiptAvailable: true,
        gstHstNumberPresent: Boolean(receipt.gstHstNumber),
      },
      receiptId: input.receiptId,
      agentRunId,
      actor: "agent",
      model: input.model,
      ruleVersion: "2026.09.1",
    });

    if (!documentationResult.success) {
      throw new Error(
        documentationResult.error ??
          "CRA documentation validation failed.",
      );
    }

    const documentation = (
      documentationResult.output as {
        result: {
          status: "SUFFICIENT" | "MISSING" | "REVIEW";
        };
      }
    ).result;

    const gstResult = await executeToolWithLogging({
      toolName: "validate_gst_hst_number",
      input: {
        gstHstNumber: receipt.gstHstNumber,
      },
      receiptId: input.receiptId,
      agentRunId,
      actor: "agent",
      model: input.model,
    });

    if (!gstResult.success) {
      throw new Error(
        gstResult.error ?? "GST/HST validation failed.",
      );
    }

    const gstStatus = (
      gstResult.output as {
        result: {
          status: string;
        };
      }
    ).result.status;

    if (
      documentation.status !== "SUFFICIENT" ||
      gstStatus === "MISSING"
    ) {
      await updateAgentRunStage(
        agentRunId,
        input.receiptId,
        "REVIEW",
      );

      const reviewResult = await executeToolWithLogging({
        toolName: "request_human_review",
        input: {
          receiptId: input.receiptId,
          reason:
            "Receipt documentation or GST/HST information requires human review.",
        },
        receiptId: input.receiptId,
        agentRunId,
        actor: "agent",
        model: input.model,
        ruleVersion: "2026.09.1",
      });

      if (!reviewResult.success) {
        throw new Error(
          reviewResult.error ?? "Failed to request human review.",
        );
      }

      await createAuditEvent({
        actor: "agent",
        receiptId: input.receiptId,
        agentRunId,
        action: "agent.review_required",
        input,
        result: reviewResult.output,
        ruleVersion: "2026.09.1",
        model: input.model,
        status: "SUCCESS",
      });

      return {
        success: true,
        state: {
          ...state,
          processingStatus: "REVIEW_REQUIRED",
          processingStage: "REVIEW",
        },
        agentRunId,
        error: null,
      };
    }

    await updateAgentRunStage(
      agentRunId,
      input.receiptId,
      "CATEGORIZING",
    );

    state.processingStage = "CATEGORIZING";

    const classificationResult = await executeToolWithLogging({
      toolName: "classify_expense",
      input: {
        receiptId: input.receiptId,
      },
      receiptId: input.receiptId,
      agentRunId,
      actor: "agent",
      model: input.model,
    });

    if (!classificationResult.success) {
      throw new Error(
        classificationResult.error ?? "Expense classification failed.",
      );
    }

    const classification = (
      classificationResult.output as {
        result: {
          status: string;
          expenseType: string | null;
          category: string | null;
          confidence: "HIGH" | "MEDIUM" | "LOW" | null;
          reason: string;
        };
      }
    ).result;

    if (
      classification.status !== "CLASSIFIED" ||
      classification.expenseType !== "EXPENSE" ||
      !classification.category
    ) {
      await updateAgentRunStage(
        agentRunId,
        input.receiptId,
        "REVIEW",
      );

      const reviewResult = await executeToolWithLogging({
        toolName: "request_human_review",
        input: {
          receiptId: input.receiptId,
          reason:
            classification.reason ??
            "Expense classification requires human review.",
        },
        receiptId: input.receiptId,
        agentRunId,
        actor: "agent",
        model: input.model,
      });

      if (!reviewResult.success) {
        throw new Error(
          reviewResult.error ?? "Failed to request human review.",
        );
      }

      return {
        success: true,
        state: {
          ...state,
          processingStatus: "REVIEW_REQUIRED",
          processingStage: "REVIEW",
          currentAnalysis: {
            expenseCategory: classification.category,
            gifiCode: null,
            gifiDescription: null,
            grossTax: null,
            eligibilityPercentage: null,
            eligibleItc: null,
            itcStatus: null,
            confidence: classification.confidence,
            explanation: classification.reason,
          },
        },
        agentRunId,
        error: null,
      };
    }

    await updateAgentRunStage(
      agentRunId,
      input.receiptId,
      "MAPPING",
    );

    state.processingStage = "MAPPING";

    const proposedGifiCode =
      classification.category.toLowerCase().includes("office")
        ? "8810"
        : classification.category
              .toLowerCase()
              .includes("meal")
          ? "8523"
          : null;

    if (!proposedGifiCode) {
      await updateAgentRunStage(
        agentRunId,
        input.receiptId,
        "REVIEW",
      );

      const reviewResult = await executeToolWithLogging({
        toolName: "request_human_review",
        input: {
          receiptId: input.receiptId,
          reason: "No deterministic GIFI mapping is available.",
        },
        receiptId: input.receiptId,
        agentRunId,
        actor: "agent",
        model: input.model,
      });

      if (!reviewResult.success) {
        throw new Error(
          reviewResult.error ?? "Failed to request human review.",
        );
      }

      return {
        success: true,
        state: {
          ...state,
          processingStatus: "REVIEW_REQUIRED",
          processingStage: "REVIEW",
        },
        agentRunId,
        error: null,
      };
    }

    const gifiResult = await executeToolWithLogging({
      toolName: "assign_gifi_code",
      input: {
        proposedCode: proposedGifiCode,
      },
      receiptId: input.receiptId,
      agentRunId,
      actor: "agent",
      model: input.model,
    });

    if (!gifiResult.success) {
      throw new Error(
        gifiResult.error ?? "GIFI assignment failed.",
      );
    }

    const gifi = (
      gifiResult.output as {
        result: {
          status: string;
          code: string | null;
          description: string | null;
        };
      }
    ).result;

    if (
      gifi.status !== "ASSIGNED" ||
      !gifi.code ||
      !gifi.description
    ) {
      await updateAgentRunStage(
        agentRunId,
        input.receiptId,
        "REVIEW",
      );

      const reviewResult = await executeToolWithLogging({
        toolName: "request_human_review",
        input: {
          receiptId: input.receiptId,
          reason: "GIFI assignment requires human review.",
        },
        receiptId: input.receiptId,
        agentRunId,
        actor: "agent",
        model: input.model,
      });

      if (!reviewResult.success) {
        throw new Error(
          reviewResult.error ?? "Failed to request human review.",
        );
      }

      return {
        success: true,
        state: {
          ...state,
          processingStatus: "REVIEW_REQUIRED",
          processingStage: "REVIEW",
        },
        agentRunId,
        error: null,
      };
    }

    await updateAgentRunStage(
      agentRunId,
      input.receiptId,
      "CALCULATING",
    );

    state.processingStage = "CALCULATING";

    const isMeal = classification.category
      .toLowerCase()
      .includes("meal");

    const itcResult = await executeToolWithLogging({
      toolName: "calculate_eligible_itc",
      input: {
        subtotal: receipt.subtotal,
        taxAmount: receipt.taxAmount,
        taxType:
          receipt.taxType === "GST" || receipt.taxType === "HST"
            ? receipt.taxType
            : null,
        expenseCategory: classification.category,
        commercialUsePercentage:
          receipt.commercialUsePercentage,
        mealEntertainment: isMeal,
        documentationStatus:
          documentation.status === "SUFFICIENT"
            ? "SUFFICIENT"
            : "REVIEW",
      },
      receiptId: input.receiptId,
      agentRunId,
      actor: "agent",
      model: input.model,
      ruleVersion: "2026.09.1",
    });

    if (!itcResult.success) {
      throw new Error(
        itcResult.error ?? "ITC calculation failed.",
      );
    }

    const itc = (
      itcResult.output as {
        result: {
          grossTax: number;
          eligibilityPercentage: number;
          eligibleItc: number;
          status:
            | "ELIGIBLE"
            | "PARTIAL"
            | "INELIGIBLE"
            | "REVIEW";
        };
      }
    ).result;

    const updateResult = await executeToolWithLogging({
      toolName: "update_expense_classification",
      input: {
  receiptId: input.receiptId,
  expenseCategory: classification.category,
  gifiCode: gifi.code,
  gifiDescription: gifi.description,
  grossTax: itc.grossTax,
  eligibilityPercentage: itc.eligibilityPercentage,
  eligibleItc: itc.eligibleItc,
  itcStatus: itc.status,
  itcReasonCode: `ITC_${itc.status}`,
},
      receiptId: input.receiptId,
      agentRunId,
      actor: "agent",
      model: input.model,
    });

    if (!updateResult.success) {
      throw new Error(
        updateResult.error ??
          "Failed to update expense classification.",
      );
    }

    /*
     * SELF-VERIFICATION
     *
     * We intentionally do NOT mark the run COMPLETE before this step.
     * The assessment requires the agent to verify:
     * - category
     * - GIFI
     * - ITC status
     * - eligible ITC
     */

    await updateAgentRunStage(
      agentRunId,
      input.receiptId,
      "REVIEW",
    );

    state.processingStage = "REVIEW";

    const statusResult = await executeToolWithLogging({
      toolName: "get_processing_status",
      input: {
        receiptId: input.receiptId,
      },
      receiptId: input.receiptId,
      agentRunId,
      actor: "agent",
      model: input.model,
    });

    if (!statusResult.success) {
      throw new Error(
        statusResult.error ??
          "Self-verification status lookup failed.",
      );
    }

    const finalStatus = (
      statusResult.output as {
        result: {
          expenseCategory: string | null;
          gifiCode: string | null;
          itcStatus: string | null;
          eligibleItc: number | null;
        };
      }
    ).result;

    const expectedEligibleItc = normalizeMoney(itc.eligibleItc);
    const actualEligibleItc = normalizeMoney(
      finalStatus.eligibleItc,
    );

    const verificationPassed =
      finalStatus.expenseCategory === classification.category &&
      finalStatus.gifiCode === gifi.code &&
      finalStatus.itcStatus === itc.status &&
      actualEligibleItc === expectedEligibleItc;

console.log(
  "SELF-VERIFICATION DEBUG:",
  JSON.stringify(
    {
      expected: {
        expenseCategory: classification.category,
        gifiCode: gifi.code,
        itcStatus: itc.status,
        eligibleItc: expectedEligibleItc,
      },
      actual: {
        expenseCategory: finalStatus.expenseCategory,
        gifiCode: finalStatus.gifiCode,
        itcStatus: finalStatus.itcStatus,
        eligibleItc: actualEligibleItc,
      },
      checks: {
        expenseCategory:
          finalStatus.expenseCategory === classification.category,
        gifiCode:
          finalStatus.gifiCode === gifi.code,
        itcStatus:
          finalStatus.itcStatus === itc.status,
        eligibleItc:
          actualEligibleItc === expectedEligibleItc,
      },
    },
    null,
    2,
  ),
);

    if (!verificationPassed) {
      await failAgentRun(
        agentRunId,
        input.receiptId,
        "Self-verification failed.",
      );

      await createAuditEvent({
        actor: "agent",
        receiptId: input.receiptId,
        agentRunId,
        action: "agent.self_verification_failed",
        input: {
          expected: {
            expenseCategory: classification.category,
            gifiCode: gifi.code,
            itcStatus: itc.status,
            eligibleItc: expectedEligibleItc,
          },
          actual: {
            expenseCategory: finalStatus.expenseCategory,
            gifiCode: finalStatus.gifiCode,
            itcStatus: finalStatus.itcStatus,
            eligibleItc: actualEligibleItc,
          },
        },
        result: {
          verificationPassed: false,
        },
        ruleVersion: "2026.09.1",
        model: input.model,
        status: "FAILURE",
      });

      return {
        success: false,
        state: {
          ...state,
          processingStatus: "ERROR",
          processingStage: "ERROR",
        },
        agentRunId,
        error: "Self-verification failed.",
      };
    }

    await updateAgentRunStage(
      agentRunId,
      input.receiptId,
      "COMPLETE",
    );

    const completed = await completeAgentRun(
      agentRunId,
      input.receiptId,
    );

    if (!completed) {
      throw new Error("Failed to complete agent run.");
    }

    await createAuditEvent({
      actor: "agent",
      receiptId: input.receiptId,
      agentRunId,
      action: "agent.completed",
      input,
      result: {
        expenseCategory: classification.category,
        gifiCode: gifi.code,
        eligibleItc: expectedEligibleItc,
      },
      ruleVersion: "2026.09.1",
      model: input.model,
      status: "SUCCESS",
    });

    return {
      success: true,
      state: {
        ...state,
        processingStatus: "PROCESSED",
        processingStage: "COMPLETE",
        currentAnalysis: {
          expenseCategory: classification.category,
          gifiCode: gifi.code,
          gifiDescription: gifi.description,
          grossTax: itc.grossTax,
          eligibilityPercentage: itc.eligibilityPercentage,
          eligibleItc: expectedEligibleItc,
          itcStatus: itc.status,
          confidence: classification.confidence,
          explanation: classification.reason,
        },
      },
      agentRunId,
      error: null,
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unexpected agent failure.";

    if (agentRunId) {
      await failAgentRun(
        agentRunId,
        input.receiptId,
        message,
      );
    }

    return {
      success: false,
      state: {
        ...state,
        processingStatus: "ERROR",
        processingStage: "ERROR",
      },
      agentRunId,
      error: message,
    };
  }
}