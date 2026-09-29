import { z } from "zod";
import {
  getProcessingStatus,
  type ProcessingStatusResult,
} from "@/domain/processing/processing-status-service";

export const getProcessingStatusInputSchema = z.object({
  receiptId: z.string().min(1),
});

export type GetProcessingStatusInput = z.infer<
  typeof getProcessingStatusInputSchema
>;

export interface GetProcessingStatusToolResult {
  success: boolean;
  result: ProcessingStatusResult | null;
  error: string | null;
}

export async function getProcessingStatusTool(
  input: GetProcessingStatusInput,
): Promise<GetProcessingStatusToolResult> {
  const parsed = getProcessingStatusInputSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      result: null,
      error: "Invalid get_processing_status arguments.",
    };
  }

  try {
    const result = await getProcessingStatus(parsed.data.receiptId);

    if (!result) {
      return {
        success: false,
        result: null,
        error: "Receipt was not found.",
      };
    }

    return {
      success: true,
      result,
      error: null,
    };
  } catch {
    return {
      success: false,
      result: null,
      error: "Failed to retrieve processing status.",
    };
  }
}