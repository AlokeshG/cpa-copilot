import { z } from "zod";

export const processingStageSchema = z.enum([
  "IDLE",
  "READING",
  "VALIDATING",
  "CATEGORIZING",
  "CALCULATING",
  "MAPPING",
  "REVIEW",
  "COMPLETE",
  "ERROR",
]);

export type ProcessingStage = z.infer<typeof processingStageSchema>;

export const processingStatusSchema = z.enum([
  "PENDING",
  "PROCESSING",
  "PROCESSED",
  "REVIEW_REQUIRED",
  "ERROR",
]);

export type ProcessingStatus = z.infer<typeof processingStatusSchema>;

export const toolExecutionSchema = z.object({
  toolName: z.string().min(1),
  status: z.enum(["RUNNING", "SUCCESS", "ERROR"]),
  startedAt: z.string(),
  completedAt: z.string().nullable(),
  error: z.string().nullable(),
});

export type ToolExecution = z.infer<typeof toolExecutionSchema>;

export const currentAnalysisSchema = z.object({
  expenseCategory: z.string().nullable(),
  gifiCode: z.string().nullable(),
  gifiDescription: z.string().nullable(),
  grossTax: z.number().nullable(),
  eligibilityPercentage: z.number().nullable(),
  eligibleItc: z.number().nullable(),
  itcStatus: z
    .enum(["ELIGIBLE", "PARTIAL", "INELIGIBLE", "REVIEW"])
    .nullable(),
  confidence: z.enum(["HIGH", "MEDIUM", "LOW"]).nullable(),
  explanation: z.string().nullable(),
});

export type CurrentAnalysis = z.infer<typeof currentAnalysisSchema>;

export const pendingApprovalSchema = z.object({
  approvalId: z.string().min(1),
  receiptId: z.string().min(1),
  reason: z.string().min(1),
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "EDITED"]),
});

export type PendingApproval = z.infer<typeof pendingApprovalSchema>;

export const agentStateSchema = z.object({
  selectedReceiptId: z.string().nullable(),

  processingStatus: processingStatusSchema,

  processingStage: processingStageSchema,

  currentAnalysis: currentAnalysisSchema.nullable(),

  toolExecution: toolExecutionSchema.nullable(),

  pendingApproval: pendingApprovalSchema.nullable(),
});

export type AgentState = z.infer<typeof agentStateSchema>;

export const initialAgentState: AgentState = {
  selectedReceiptId: null,

  processingStatus: "PENDING",

  processingStage: "IDLE",

  currentAnalysis: null,

  toolExecution: null,

  pendingApproval: null,
};