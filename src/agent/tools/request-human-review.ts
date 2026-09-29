import { z } from "zod";
import {
  requestHumanReview,
  type RequestHumanReviewResult,
} from "@/domain/approvals/approval-service";

export const requestHumanReviewInputSchema = z.object({
  receiptId: z.string().min(1),
  reason: z.string().min(1),
});

export type RequestHumanReviewInput = z.infer<
  typeof requestHumanReviewInputSchema
>;

export interface RequestHumanReviewToolResult {
  success: boolean;
  result: RequestHumanReviewResult | null;
  error: string | null;
}

export async function requestHumanReviewTool(
  input: RequestHumanReviewInput,
): Promise<RequestHumanReviewToolResult> {
  const parsed = requestHumanReviewInputSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      result: null,
      error: "Invalid request_human_review arguments.",
    };
  }

  try {
    const result = await requestHumanReview(parsed.data);

    return {
      success: true,
      result,
      error: null,
    };
  } catch {
    return {
      success: false,
      result: null,
      error: "Failed to request human review.",
    };
  }
}