import { describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { getProcessingStatusTool } from "./get-processing-status";

describe("getProcessingStatusTool", () => {
  it("returns processing status for a valid receipt", async () => {
    const receipt = await prisma.receipt.findFirst({
      where: {
        vendorName: "Staples Canada",
      },
    });

    expect(receipt).not.toBeNull();

    const result = await getProcessingStatusTool({
      receiptId: receipt!.id,
    });

    expect(result.success).toBe(true);
    expect(result.result).not.toBeNull();

    expect(result.result?.receiptId).toBe(receipt!.id);
    expect(result.result?.receiptStatus).toBeDefined();
    expect(result.result?.processingStage).toBeDefined();
    expect(result.result?.documentationStatus).toBeDefined();
    expect(result.result?.gstHstNumberStatus).toBeDefined();
  });

  it("returns classification and ITC information when available", async () => {
    const receipt = await prisma.receipt.findFirst({
      where: {
        vendorName: "Staples Canada",
      },
      include: {
        expense: true,
      },
    });

    expect(receipt).not.toBeNull();

    const result = await getProcessingStatusTool({
      receiptId: receipt!.id,
    });

    expect(result.success).toBe(true);
    expect(result.result?.expenseCategory).toBe(
      receipt!.expense?.category ?? null,
    );
    expect(result.result?.gifiCode).toBe(
      receipt!.expense?.gifiCode ?? null,
    );
  });

  it("returns pending approval information when review is pending", async () => {
    const receipt = await prisma.receipt.findFirst({
      where: {
        vendorName: "Unknown Vendor",
      },
    });

    expect(receipt).not.toBeNull();

    const approval = await prisma.approval.findFirst({
      where: {
        receiptId: receipt!.id,
        status: "PENDING",
      },
      orderBy: {
        requestedAt: "desc",
      },
    });

    expect(approval).not.toBeNull();

    const result = await getProcessingStatusTool({
      receiptId: receipt!.id,
    });

    expect(result.success).toBe(true);
    expect(result.result?.pendingApprovalId).toBe(approval!.id);
  });

  it("returns an error for a missing receipt", async () => {
    const result = await getProcessingStatusTool({
      receiptId: "missing-receipt-id",
    });

    expect(result.success).toBe(false);
    expect(result.result).toBeNull();
    expect(result.error).toBe("Receipt was not found.");
  });

  it("rejects an empty receipt ID", async () => {
    const result = await getProcessingStatusTool({
      receiptId: "",
    });

    expect(result.success).toBe(false);
    expect(result.result).toBeNull();
    expect(result.error).toBe(
      "Invalid get_processing_status arguments.",
    );
  });
});