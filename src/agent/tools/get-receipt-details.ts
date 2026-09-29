import { z } from "zod";
import { getReceiptDetails } from "@/domain/receipts/receipt-service";

export const getReceiptDetailsInputSchema = z.object({
  receiptId: z.string().min(1),
});

export type GetReceiptDetailsInput = z.infer<
  typeof getReceiptDetailsInputSchema
>;

export interface GetReceiptDetailsResult {
  success: boolean;
  receipt: Awaited<ReturnType<typeof getReceiptDetails>> | null;
  error: string | null;
}

export async function getReceiptDetailsTool(
  input: GetReceiptDetailsInput,
): Promise<GetReceiptDetailsResult> {
  const parsed = getReceiptDetailsInputSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      receipt: null,
      error: "Invalid get_receipt_details arguments.",
    };
  }

  try {
    const receipt = await getReceiptDetails(parsed.data.receiptId);

    if (!receipt) {
      return {
        success: false,
        receipt: null,
        error: "Receipt was not found.",
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
      error: "Failed to retrieve receipt details.",
    };
  }
}