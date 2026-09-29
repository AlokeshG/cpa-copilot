import { z } from "zod";
import {
  assignGifiCode,
  type AssignGifiResult,
} from "@/domain/gifi/assign-gifi";

export const assignGifiCodeInputSchema = z.object({
  proposedCode: z.string().min(1),
});

export type AssignGifiCodeInput = z.infer<
  typeof assignGifiCodeInputSchema
>;

export interface AssignGifiCodeToolResult {
  success: boolean;
  result: AssignGifiResult | null;
  error: string | null;
}

export async function assignGifiCodeTool(
  input: AssignGifiCodeInput,
): Promise<AssignGifiCodeToolResult> {
  const parsed = assignGifiCodeInputSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      result: null,
      error: "Invalid assign_gifi_code arguments.",
    };
  }

  try {
    const result = await assignGifiCode(parsed.data.proposedCode);

    return {
      success: true,
      result,
      error: null,
    };
  } catch {
    return {
      success: false,
      result: null,
      error: "Failed to assign GIFI code.",
    };
  }
}