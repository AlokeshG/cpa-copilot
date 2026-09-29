import "server-only";
import { prisma } from "@/lib/prisma";

export interface ProcessingStatusResult {
  receiptId: string;
  receiptStatus: string;
  processingStage: string;
  documentationStatus: string;
  gstHstNumberStatus: string;
  expenseCategory: string | null;
  gifiCode: string | null;
  itcStatus: string | null;
  eligibleItc: number | null;
  pendingApprovalId: string | null;
  agentRunStatus: string | null;
}

export async function getProcessingStatus(
  receiptId: string,
): Promise<ProcessingStatusResult | null> {
  const receipt = await prisma.receipt.findUnique({
    where: {
      id: receiptId,
    },
    include: {
      expense: true,
      approvals: {
        where: {
          status: "PENDING",
        },
        orderBy: {
          requestedAt: "desc",
        },
        take: 1,
      },
      agentRuns: {
        orderBy: {
          startedAt: "desc",
        },
        take: 1,
      },
    },
  });

  if (!receipt) {
    return null;
  }

  return {
    receiptId: receipt.id,
    receiptStatus: receipt.status,
    processingStage: receipt.processingStage,
    documentationStatus: receipt.documentationStatus,
    gstHstNumberStatus: receipt.gstNumberStatus,
    expenseCategory: receipt.expense?.category ?? null,
    gifiCode: receipt.expense?.gifiCode ?? null,
    itcStatus: receipt.expense?.itcStatus ?? null,
    eligibleItc:
      receipt.expense?.eligibleItc !== undefined &&
      receipt.expense?.eligibleItc !== null
        ? Number(receipt.expense.eligibleItc)
        : null,
    pendingApprovalId: receipt.approvals[0]?.id ?? null,
    agentRunStatus: receipt.agentRuns[0]?.status ?? null,
  };
}