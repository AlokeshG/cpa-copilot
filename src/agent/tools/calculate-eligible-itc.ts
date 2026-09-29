import { z } from "zod";
import {
  calculateEligibleItc,
  type CalculateItcInput,
  type CalculateItcResult,
} from "@/domain/cra/itc-rules";

export const calculateEligibleItcInputSchema = z.object({
  subtotal: z.number().finite().nonnegative(),
  taxAmount: z.number().finite().nonnegative(),
  taxType: z.enum(["GST", "HST"]).nullable(),
  expenseCategory: z.string().min(1),
  commercialUsePercentage: z.number().finite().min(0).max(100),
  mealEntertainment: z.boolean(),
  documentationStatus: z.enum([
    "SUFFICIENT",
    "INSUFFICIENT",
    "MISSING",
    "REVIEW",
  ]),
  mealEligibilityPercentage: z
    .number()
    .finite()
    .min(0)
    .max(100)
    .optional(),
});

export type CalculateEligibleItcToolInput = z.infer<
  typeof calculateEligibleItcInputSchema
>;

export interface CalculateEligibleItcToolResult {
  success: boolean;
  result: CalculateItcResult | null;
  error: string | null;
}

export function calculateEligibleItcTool(
  input: CalculateEligibleItcToolInput,
): CalculateEligibleItcToolResult {
  const parsed = calculateEligibleItcInputSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      result: null,
      error: "Invalid calculate_eligible_itc arguments.",
    };
  }

  try {
    const calculationInput: CalculateItcInput = parsed.data;

    const result = calculateEligibleItc(calculationInput);

    return {
      success: true,
      result,
      error: null,
    };
  } catch {
    return {
      success: false,
      result: null,
      error: "Failed to calculate eligible ITC.",
    };
  }
}