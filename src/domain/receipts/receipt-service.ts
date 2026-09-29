import "server-only";
import { prisma } from "@/lib/prisma";

export interface ReceiptSummary {
  id: string;
  vendorName: string;
  receiptDate: Date;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  taxType: string | null;
  expenseCategory: string | null;
  status: string;
  processingStage: string;
}

export interface ReceiptDetails extends ReceiptSummary {
  gstHstNumber: string | null;
  commercialUsePercentage: number;
  description: string | null;
  documentationStatus: string;
  gstHstNumberStatus: string;
}

function mapReceipt(receipt: {
  id: string;
  vendorName: string;
  receiptDate: Date;
  subtotal: { toString(): string };
  taxAmount: { toString(): string };
  totalAmount: { toString(): string };
  taxType: string | null;
  gstHstNumber: string | null;
  commercialUsePercent: { toString(): string };
  description: string | null;
  status: string;
  processingStage: string;
  documentationStatus: string;
  gstNumberStatus: string;
  expense: {
    category: string | null;
  } | null;
}): ReceiptSummary {
  return {
    id: receipt.id,
    vendorName: receipt.vendorName,
    receiptDate: receipt.receiptDate,
    subtotal: Number(receipt.subtotal),
    taxAmount: Number(receipt.taxAmount),
    totalAmount: Number(receipt.totalAmount),
    taxType: receipt.taxType,
    expenseCategory: receipt.expense?.category ?? null,
    status: receipt.status,
    processingStage: receipt.processingStage,
  };
}

export async function getCurrentReceipt(
  receiptId?: string,
): Promise<ReceiptSummary | null> {
  const receipt = receiptId
    ? await prisma.receipt.findUnique({
        where: {
          id: receiptId,
        },
        include: {
          expense: true,
        },
      })
    : await prisma.receipt.findFirst({
        orderBy: {
          receiptDate: "desc",
        },
        include: {
          expense: true,
        },
      });

  if (!receipt) {
    return null;
  }

  return mapReceipt(receipt);
}

export async function getReceiptDetails(
  receiptId: string,
): Promise<ReceiptDetails | null> {
  const receipt = await prisma.receipt.findUnique({
    where: {
      id: receiptId,
    },
    include: {
      expense: true,
    },
  });

  if (!receipt) {
    return null;
  }

  const summary = mapReceipt(receipt);

  return {
    ...summary,
    gstHstNumber: receipt.gstHstNumber,
    commercialUsePercentage: Number(receipt.commercialUsePercent),
    description: receipt.description,
    documentationStatus: receipt.documentationStatus,
    gstHstNumberStatus: receipt.gstNumberStatus,
  };
}