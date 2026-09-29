import { z } from "zod";
import {
  classifyExpense,
  type ExpenseClassificationResult,
} from "@/domain/expenses/classification-service";

export const classifyExpenseInputSchema = z.object({
  receiptId: z.string().min(1),
});

export type ClassifyExpenseInput = z.infer<
  typeof classifyExpenseInputSchema
>;

export interface ClassifyExpenseToolResult {
  success: boolean;
  result: ExpenseClassificationResult | null;
  error: string | null;
}

export async function classifyExpenseTool(
  input: ClassifyExpenseInput,
): Promise<ClassifyExpenseToolResult> {
  const parsed = classifyExpenseInputSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      result: null,
      error: "Invalid classify_expense arguments.",
    };
  }

  try {
    const result = await classifyExpense(parsed.data.receiptId);

    return {
      success: true,
      result,
      error: null,
    };
  } catch {
    return {
      success: false,
      result: null,
      error: "Failed to classify expense.",
    };
  }
}