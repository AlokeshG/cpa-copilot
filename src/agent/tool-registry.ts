import { getCurrentReceiptTool } from "@/agent/tools/get-current-receipt";
import { getReceiptDetailsTool } from "@/agent/tools/get-receipt-details";
import { validateCraDocumentationTool } from "@/agent/tools/validate-cra-documentation";
import { validateGstHstNumberTool } from "@/agent/tools/validate-gst-hst-number";
import { calculateEligibleItcTool } from "@/agent/tools/calculate-eligible-itc";
import { classifyExpenseTool } from "@/agent/tools/classify-expense";
import { assignGifiCodeTool } from "@/agent/tools/assign-gifi-code";
import { updateExpenseClassificationTool } from "@/agent/tools/update-expense-classification";
import { requestHumanReviewTool } from "@/agent/tools/request-human-review";
import { getProcessingStatusTool } from "@/agent/tools/get-processing-status";

export const TOOL_NAMES = [
  "get_current_receipt",
  "get_receipt_details",
  "validate_cra_documentation",
  "validate_gst_hst_number",
  "calculate_eligible_itc",
  "classify_expense",
  "assign_gifi_code",
  "update_expense_classification",
  "request_human_review",
  "get_processing_status",
] as const;

export type ToolName = (typeof TOOL_NAMES)[number];

export const toolRegistry = {
  get_current_receipt: getCurrentReceiptTool,
  get_receipt_details: getReceiptDetailsTool,
  validate_cra_documentation: validateCraDocumentationTool,
  validate_gst_hst_number: validateGstHstNumberTool,
  calculate_eligible_itc: calculateEligibleItcTool,
  classify_expense: classifyExpenseTool,
  assign_gifi_code: assignGifiCodeTool,
  update_expense_classification: updateExpenseClassificationTool,
  request_human_review: requestHumanReviewTool,
  get_processing_status: getProcessingStatusTool,
} as const;

export function isAllowedTool(name: string): name is ToolName {
  return TOOL_NAMES.includes(name as ToolName);
}

export async function executeTool(
  name: string,
  input: unknown,
): Promise<unknown> {
  if (!isAllowedTool(name)) {
    return {
      success: false,
      result: null,
      error: `Tool '${name}' is not allowlisted.`,
    };
  }

  const tool = toolRegistry[name];

  return tool(input as never);
}