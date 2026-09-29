import { describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { requestHumanReviewTool } from "./request-human-review";

describe("requestHumanReviewTool", () => {
  it("creates a pending approval for a valid receipt", async () => {
    const receipt = await prisma.receipt.findFirst({
      where: {
        vendorName: "Unknown Vendor",
      },
    });

    expect(receipt).not.toBeNull();

    await prisma.approval.deleteMany({
      where: {
        receiptId: receipt!.id,
      },
    });

    const result = await requestHumanReviewTool({
      receiptId: receipt!.id,
      reason: "GST/HST number is missing and requires human review.",
    });

    expect(result.success).toBe(true);
    expect(result.result?.status).toBe("REVIEW_REQUESTED");
    expect(result.result?.receiptId).toBe(receipt!.id);
    expect(result.result?.approvalId).not.toBeNull();

    const approval = await prisma.approval.findUnique({
      where: {
        id: result.result!.approvalId!,
      },
    });

    expect(approval).not.toBeNull();
    expect(approval!.status).toBe("PENDING");
    expect(approval!.reason).toBe(
      "GST/HST number is missing and requires human review.",
    );

    const updatedReceipt = await prisma.receipt.findUnique({
      where: {
        id: receipt!.id,
      },
    });

    expect(updatedReceipt?.status).toBe("REVIEW_REQUIRED");
    expect(updatedReceipt?.processingStage).toBe("REVIEW");
  });

  it("does not create duplicate pending approvals", async () => {
    const receipt = await prisma.receipt.findFirst({
      where: {
        vendorName: "Unknown Vendor",
      },
    });

    expect(receipt).not.toBeNull();

    await prisma.approval.deleteMany({
      where: {
        receiptId: receipt!.id,
      },
    });

    const first = await requestHumanReviewTool({
      receiptId: receipt!.id,
      reason: "Missing GST/HST number.",
    });

    const second = await requestHumanReviewTool({
      receiptId: receipt!.id,
      reason: "Missing GST/HST number.",
    });

    expect(first.success).toBe(true);
    expect(second.success).toBe(true);

    expect(first.result?.approvalId).toBe(second.result?.approvalId);

    const approvals = await prisma.approval.findMany({
      where: {
        receiptId: receipt!.id,
        status: "PENDING",
      },
    });

    expect(approvals).toHaveLength(1);
  });

  it("returns review required for a missing receipt", async () => {
    const result = await requestHumanReviewTool({
      receiptId: "missing-receipt-id",
      reason: "Receipt requires manual review.",
    });

    expect(result.success).toBe(true);
    expect(result.result?.status).toBe("REVIEW_REQUIRED");
    expect(result.result?.approvalId).toBeNull();
  });

  it("rejects an empty receipt ID", async () => {
    const result = await requestHumanReviewTool({
      receiptId: "",
      reason: "Manual review required.",
    });

    expect(result.success).toBe(false);
    expect(result.result).toBeNull();
    expect(result.error).toBe(
      "Invalid request_human_review arguments.",
    );
  });

  it("rejects an empty review reason", async () => {
    const result = await requestHumanReviewTool({
      receiptId: "some-receipt",
      reason: "",
    });

    expect(result.success).toBe(false);
    expect(result.result).toBeNull();
    expect(result.error).toBe(
      "Invalid request_human_review arguments.",
    );
  });
});