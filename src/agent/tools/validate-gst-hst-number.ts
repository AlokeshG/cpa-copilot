import { z } from "zod";
import {
  validateGstHstNumber,
  type GstHstValidationResult,
} from "@/domain/cra/gst-hst-rules";

export const validateGstHstNumberInputSchema = z.object({
  gstHstNumber: z.string().nullable().optional(),
});

export type ValidateGstHstNumberInput = z.infer<
  typeof validateGstHstNumberInputSchema
>;

export interface ValidateGstHstNumberResult {
  success: boolean;
  result: GstHstValidationResult | null;
  error: string | null;
}

export function validateGstHstNumberTool(
  input: ValidateGstHstNumberInput,
): ValidateGstHstNumberResult {
  const parsed = validateGstHstNumberInputSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      result: null,
      error: "Invalid validate_gst_hst_number arguments.",
    };
  }

  try {
    const result = validateGstHstNumber(parsed.data.gstHstNumber);

    return {
      success: true,
      result,
      error: null,
    };
  } catch {
    return {
      success: false,
      result: null,
      error: "Failed to validate GST/HST number.",
    };
  }
}