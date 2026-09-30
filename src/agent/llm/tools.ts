import { tool } from "ai";
import { z } from "zod";

import { executeTool } from "@/agent/tool-registry";

export const copilotTools = {
  get_current_receipt: tool({
    description:
      "Get the receipt currently selected in the CPA Copilot application.",
    inputSchema: z.object({}),
    execute: async () => {
      return executeTool("get_current_receipt", {});
    },
  }),

  get_receipt_details: tool({
    description:
      "Retrieve complete details for a receipt, including vendor, date, subtotal, tax, total, GST/HST number, commercial use, and description.",
    inputSchema: z.object({
      receiptId: z.string().min(1),
    }),
    execute: async ({ receiptId }) => {
      return executeTool("get_receipt_details", {
        receiptId,
      });
    },
  }),

  validate_cra_documentation: tool({
    description:
      "Validate whether the receipt documentation satisfies the applicable CRA documentation requirements.",
    inputSchema: z.object({
      receiptId: z.string().min(1),
    }),
    execute: async ({ receiptId }) => {
      return executeTool("validate_cra_documentation", {
        receiptId,
      });
    },
  }),

  validate_gst_hst_number: tool({
    description:
      "Validate the GST/HST number format on a receipt. This only validates the syntactic format and does not prove CRA registration.",
    inputSchema: z.object({
      receiptId: z.string().min(1),
    }),
    execute: async ({ receiptId }) => {
      return executeTool("validate_gst_hst_number", {
        receiptId,
      });
    },
  }),

  classify_expense: tool({
    description:
      "Classify a receipt into an appropriate bookkeeping expense category based on its contents.",
    inputSchema: z.object({
      receiptId: z.string().min(1),
    }),
    execute: async ({ receiptId }) => {
      return executeTool("classify_expense", {
        receiptId,
      });
    },
  }),

  assign_gifi_code: tool({
    description:
      "Assign a verified GIFI code to the classified expense. The backend controls the valid GIFI catalogue.",
    inputSchema: z.object({
      receiptId: z.string().min(1),
      category: z.string().min(1),
    }),
    execute: async ({ receiptId, category }) => {
      return executeTool("assign_gifi_code", {
        receiptId,
        category,
      });
    },
  }),

  calculate_eligible_itc: tool({
    description:
      "Calculate the eligible GST/HST input tax credit using deterministic CRA rules. Never perform the arithmetic yourself.",
    inputSchema: z.object({
      receiptId: z.string().min(1),
    }),
    execute: async ({ receiptId }) => {
      return executeTool("calculate_eligible_itc", {
        receiptId,
      });
    },
  }),

  update_expense_classification: tool({
    description:
      "Persist the final expense classification, GIFI mapping, and deterministic ITC calculation to the database.",
    inputSchema: z.object({
      receiptId: z.string().min(1),
      expenseCategory: z.string().min(1),
      gifiCode: z.string().min(1),
      gifiDescription: z.string().min(1),
      grossTax: z.number().nonnegative(),
      eligibilityPercentage: z.number().min(0).max(100),
      eligibleItc: z.number().nonnegative(),
      itcStatus: z.enum([
        "ELIGIBLE",
        "PARTIAL",
        "INELIGIBLE",
        "REVIEW",
      ]),
      itcReasonCode: z.string().min(1),
      classificationReason: z.string().min(1),
      classificationConfidence: z.number().min(0).max(1),
    }),
    execute: async (input) => {
      return executeTool("update_expense_classification", input);
    },
  }),

  request_human_review: tool({
    description:
      "Request human review when documentation, classification, GIFI mapping, ITC eligibility, or other compliance conditions require review.",
    inputSchema: z.object({
      receiptId: z.string().min(1),
      reason: z.string().min(1),
    }),
    execute: async ({ receiptId, reason }) => {
      return executeTool("request_human_review", {
        receiptId,
        reason,
      });
    },
  }),

  get_processing_status: tool({
    description:
      "Retrieve the current processing state of a receipt so the agent can verify that its work was persisted correctly.",
    inputSchema: z.object({
      receiptId: z.string().min(1),
    }),
    execute: async ({ receiptId }) => {
      return executeTool("get_processing_status", {
        receiptId,
      });
    },
  }),
};