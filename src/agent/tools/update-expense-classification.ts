import { z } from "zod";
import {
  updateExpenseClassification,
  type UpdateExpenseClassificationResult,
} from "@/domain/expenses/update-expense-classification";

export const updateExpenseClassificationInputSchema = z.object({
  receiptId: z.string().min(1),
  expenseCategory: z.string().min(1),
  gifiCode: z.string().regex(/^\d{4}$/),
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
});

export type UpdateExpenseClassificationToolInput = z.infer<
  typeof updateExpenseClassificationInputSchema
>;

export interface UpdateExpenseClassificationToolResult {
  success: boolean;
  result: UpdateExpenseClassificationResult | null;
  error: string | null;
}

export async function updateExpenseClassificationTool(
  input: UpdateExpenseClassificationToolInput,
): Promise<UpdateExpenseClassificationToolResult> {
  const parsed =
    updateExpenseClassificationInputSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      result: null,
      error: "Invalid update_expense_classification arguments.",
    };
  }

  try {
    const result = await updateExpenseClassification(parsed.data);

    return {
      success: true,
      result,
      error: null,
    };
  } catch {
    return {
      success: false,
      result: null,
      error: "Failed to update expense classification.",
    };
  }
}