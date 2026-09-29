import { describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { getReceiptDetailsTool } from "./get-receipt-details";

describe("get_receipt_details tool", () => {
  it("gets complete Staples Canada receipt details", async () => {
    const receipt = await prisma.receipt.findFirst({
      where: {
        vendorName: "Staples Canada",
      },
    });

    expect(receipt).not.toBeNull();

    if (!receipt) {
      return;
    }

    const result = await getReceiptDetailsTool({
      receiptId: receipt.id,
    });

    expect(result.success).toBe(true);
    expect(result.receipt).not.toBeNull();

    expect(result.receipt?.vendorName).toBe("Staples Canada");
    expect(result.receipt?.subtotal).toBe(82);
    expect(result.receipt?.taxAmount).toBe(4.1);
    expect(result.receipt?.totalAmount).toBe(86.1);
    expect(result.receipt?.gstHstNumber).not.toBeNull();
    expect(result.receipt?.commercialUsePercentage).toBe(100);
  });

  it("returns an error for an unknown receipt", async () => {
    const result = await getReceiptDetailsTool({
      receiptId: "does-not-exist",
    });

    expect(result.success).toBe(false);
    expect(result.receipt).toBeNull();
  });

  it("rejects an empty receipt ID", async () => {
    const result = await getReceiptDetailsTool({
      receiptId: "",
    });

    expect(result.success).toBe(false);
    expect(result.receipt).toBeNull();
    expect(result.error).toBe(
      "Invalid get_receipt_details arguments.",
    );
  });
});