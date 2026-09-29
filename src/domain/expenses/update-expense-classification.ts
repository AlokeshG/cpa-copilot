import "server-only";

import { prisma } from "@/lib/prisma";

export interface UpdateExpenseClassificationInput {
  receiptId: string;
  expenseCategory: string;
  gifiCode: string;
  gifiDescription: string;

  grossTax: number;
  eligibilityPercentage: number;
  eligibleItc: number;
  itcStatus: "ELIGIBLE" | "PARTIAL" | "INELIGIBLE" | "REVIEW";
  itcReasonCode: string;
}

export interface UpdateExpenseClassificationResult {
  status: "UPDATED" | "REVIEW_REQUIRED";
  receiptId: string;
  expenseCategory: string | null;
  gifiCode: string | null;
  grossTax: number | null;
  eligibilityPercentage: number | null;
  eligibleItc: number | null;
  itcStatus: "ELIGIBLE" | "PARTIAL" | "INELIGIBLE" | "REVIEW" | null;
  reason: string;
}

export async function updateExpenseClassification(
  input: UpdateExpenseClassificationInput,
): Promise<UpdateExpenseClassificationResult> {
  const receipt = await prisma.receipt.findUnique({
    where: {
      id: input.receiptId,
    },
  });

  if (!receipt) {
    return {
      status: "REVIEW_REQUIRED",
      receiptId: input.receiptId,
      expenseCategory: null,
      gifiCode: null,
      grossTax: null,
      eligibilityPercentage: null,
      eligibleItc: null,
      itcStatus: null,
      reason: "Receipt was not found.",
    };
  }

  const gifi = await prisma.gifiCode.findUnique({
    where: {
      code: input.gifiCode,
    },
  });

  if (!gifi) {
    return {
      status: "REVIEW_REQUIRED",
      receiptId: input.receiptId,
      expenseCategory: null,
      gifiCode: input.gifiCode,
      grossTax: null,
      eligibilityPercentage: null,
      eligibleItc: null,
      itcStatus: null,
      reason: "GIFI code does not exist in the controlled catalogue.",
    };
  }

  if (gifi.description !== input.gifiDescription) {
    return {
      status: "REVIEW_REQUIRED",
      receiptId: input.receiptId,
      expenseCategory: null,
      gifiCode: null,
      grossTax: null,
      eligibilityPercentage: null,
      eligibleItc: null,
      itcStatus: null,
      reason:
        "GIFI description does not match the controlled catalogue.",
    };
  }

  const existingExpense = await prisma.expense.findUnique({
    where: {
      receiptId: input.receiptId,
    },
  });

  if (existingExpense) {
    const updatedExpense = await prisma.expense.update({
      where: {
        receiptId: input.receiptId,
      },
      data: {
        category: input.expenseCategory,
        gifiCode: gifi.code,
        gifiDescription: gifi.description,
        grossTax: input.grossTax,
        eligibilityPercentage: input.eligibilityPercentage,
        eligibleItc: input.eligibleItc,
        itcStatus: input.itcStatus,
        itcReasonCode: input.itcReasonCode,
      },
    });

    return {
      status: "UPDATED",
      receiptId: receipt.id,
      expenseCategory: updatedExpense.category,
      gifiCode: updatedExpense.gifiCode,
      grossTax: Number(updatedExpense.grossTax),
      eligibilityPercentage: Number(
        updatedExpense.eligibilityPercentage,
      ),
      eligibleItc: Number(updatedExpense.eligibleItc),
      itcStatus: updatedExpense.itcStatus,
      reason:
        "Existing expense classification and ITC calculation were updated after validation.",
    };
  }

  const createdExpense = await prisma.expense.create({
    data: {
      receiptId: input.receiptId,
      category: input.expenseCategory,
      gifiCode: gifi.code,
      gifiDescription: gifi.description,
      grossTax: input.grossTax,
      eligibilityPercentage: input.eligibilityPercentage,
      eligibleItc: input.eligibleItc,
      itcStatus: input.itcStatus,
      itcReasonCode: input.itcReasonCode,
    },
  });

  return {
    status: "UPDATED",
    receiptId: receipt.id,
    expenseCategory: createdExpense.category,
    gifiCode: createdExpense.gifiCode,
    grossTax: Number(createdExpense.grossTax),
    eligibilityPercentage: Number(
      createdExpense.eligibilityPercentage,
    ),
    eligibleItc: Number(createdExpense.eligibleItc),
    itcStatus: createdExpense.itcStatus,
    reason:
      "Expense classification and ITC calculation were persisted after validation.",
  };
}