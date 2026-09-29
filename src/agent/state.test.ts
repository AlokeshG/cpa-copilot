import { describe, expect, it } from "vitest";
import {
  agentStateSchema,
  initialAgentState,
  processingStageSchema,
} from "./state";

describe("agent state", () => {
  it("has the expected initial state", () => {
    expect(initialAgentState.selectedReceiptId).toBeNull();
    expect(initialAgentState.processingStatus).toBe("PENDING");
    expect(initialAgentState.processingStage).toBe("IDLE");
    expect(initialAgentState.currentAnalysis).toBeNull();
    expect(initialAgentState.toolExecution).toBeNull();
    expect(initialAgentState.pendingApproval).toBeNull();
  });

  it("accepts every processing stage", () => {
    const stages = [
      "IDLE",
      "READING",
      "VALIDATING",
      "CATEGORIZING",
      "CALCULATING",
      "MAPPING",
      "REVIEW",
      "COMPLETE",
      "ERROR",
    ] as const;

    for (const stage of stages) {
      expect(processingStageSchema.safeParse(stage).success).toBe(true);
    }
  });

  it("validates a complete agent state", () => {
    const result = agentStateSchema.safeParse({
      selectedReceiptId: "receipt-123",
      processingStatus: "PROCESSING",
      processingStage: "CALCULATING",
      currentAnalysis: {
        expenseCategory: "Office expenses",
        gifiCode: "8810",
        gifiDescription: "Office expenses",
        grossTax: 4.1,
        eligibilityPercentage: 100,
        eligibleItc: 4.1,
        itcStatus: "ELIGIBLE",
        confidence: "HIGH",
        explanation: "Office purchase with sufficient documentation.",
      },
      toolExecution: {
        toolName: "calculate_eligible_itc",
        status: "SUCCESS",
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        error: null,
      },
      pendingApproval: null,
    });

    expect(result.success).toBe(true);
  });

  it("rejects an invalid processing stage", () => {
    const result = processingStageSchema.safeParse("UNKNOWN_STAGE");

    expect(result.success).toBe(false);
  });
});