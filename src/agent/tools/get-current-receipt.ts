import { z } from "zod";
import { getCurrentReceipt } from "@/domain/receipts/receipt-service";

export const getCurrentReceiptInputSchema = z.object({
  receiptId: z.string().optional(),
});

export type GetCurrentReceiptInput = z.infer<
  typeof getCurrentReceiptInputSchema
>;

export interface GetCurrentReceiptResult {
  success: boolean;
  receipt: Awaited<ReturnType<typeof getCurrentReceipt>> | null;
  error: string | null;
}

export async function getCurrentReceiptTool(
  input: GetCurrentReceiptInput,
): Promise<GetCurrentReceiptResult> {
  const parsed = getCurrentReceiptInputSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      receipt: null,
      error: "Invalid get_current_receipt arguments.",
    };
  }

  try {
    const receipt = await getCurrentReceipt(parsed.data.receiptId);

    if (!receipt) {
      return {
        success: false,
        receipt: null,
        error: "No receipt was found.",
      };
    }

    return {
      success: true,
      receipt,
      error: null,
    };
  } catch {
    return {
      success: false,
      receipt: null,
      error: "Failed to retrieve the current receipt.",
    };
  }
}