import "server-only";
import { prisma } from "@/lib/prisma";

export interface RequestHumanReviewInput {
  receiptId: string;
  reason: string;
}

export interface RequestHumanReviewResult {
  status: "REVIEW_REQUESTED" | "REVIEW_REQUIRED";
  approvalId: string | null;
  receiptId: string;
  reason: string;
}

export async function requestHumanReview(
  input: RequestHumanReviewInput,
): Promise<RequestHumanReviewResult> {
  const receipt = await prisma.receipt.findUnique({
    where: {
      id: input.receiptId,
    },
  });

  if (!receipt) {
    return {
      status: "REVIEW_REQUIRED",
      approvalId: null,
      receiptId: input.receiptId,
      reason: "Receipt was not found.",
    };
  }

  const existingPendingApproval = await prisma.approval.findFirst({
    where: {
      receiptId: input.receiptId,
      status: "PENDING",
    },
    orderBy: {
      requestedAt: "desc",
    },
  });

  if (existingPendingApproval) {
    return {
      status: "REVIEW_REQUESTED",
      approvalId: existingPendingApproval.id,
      receiptId: input.receiptId,
      reason: "A pending human review already exists for this receipt.",
    };
  }

  const approval = await prisma.approval.create({
    data: {
      receiptId: input.receiptId,
      status: "PENDING",
      reason: input.reason,
    },
  });

  await prisma.receipt.update({
    where: {
      id: input.receiptId,
    },
    data: {
      status: "REVIEW_REQUIRED",
      processingStage: "REVIEW",
    },
  });

  return {
    status: "REVIEW_REQUESTED",
    approvalId: approval.id,
    receiptId: input.receiptId,
    reason: input.reason,
  };
}