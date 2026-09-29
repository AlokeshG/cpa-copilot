import { describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { getCurrentReceiptTool } from "./get-current-receipt";

describe("get_current_receipt tool", () => {
  it("gets the Staples Canada receipt by its actual database ID", async () => {
    const staplesReceipt = await prisma.receipt.findFirst({
      where: {
        vendorName: "Staples Canada",
      },
    });

    expect(staplesReceipt).not.toBeNull();

    if (!staplesReceipt) {
      return;
    }

    const result = await getCurrentReceiptTool({
      receiptId: staplesReceipt.id,
    });

    expect(result.success).toBe(true);
    expect(result.receipt).not.toBeNull();
    expect(result.receipt?.vendorName).toBe("Staples Canada");
  });

  it("returns an error for an unknown receipt", async () => {
    const result = await getCurrentReceiptTool({
      receiptId: "does-not-exist",
    });

    expect(result.success).toBe(false);
    expect(result.receipt).toBeNull();
  });

  it("gets the current receipt when no ID is supplied", async () => {
    const result = await getCurrentReceiptTool({});

    expect(result.success).toBe(true);
    expect(result.receipt).not.toBeNull();
  });
});