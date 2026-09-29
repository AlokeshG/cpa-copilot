import { z } from "zod";
import {
  validateDocumentation,
  type DocumentationValidationResult,
} from "@/domain/cra/documentation-rules";

export const validateCraDocumentationInputSchema = z.object({
  amount: z.number().finite().nonnegative(),
  receiptAvailable: z.boolean(),
  gstHstNumberPresent: z.boolean(),
});

export type ValidateCraDocumentationInput = z.infer<
  typeof validateCraDocumentationInputSchema
>;

export interface ValidateCraDocumentationResult {
  success: boolean;
  result: DocumentationValidationResult | null;
  error: string | null;
}

export function validateCraDocumentationTool(
  input: ValidateCraDocumentationInput,
): ValidateCraDocumentationResult {
  const parsed = validateCraDocumentationInputSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      result: null,
      error: "Invalid validate_cra_documentation arguments.",
    };
  }

  try {
    const result = validateDocumentation(parsed.data);

    return {
      success: true,
      result,
      error: null,
    };
  } catch {
    return {
      success: false,
      result: null,
      error: "Failed to validate CRA documentation.",
    };
  }
}