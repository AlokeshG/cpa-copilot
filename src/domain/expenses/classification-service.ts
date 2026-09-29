import "server-only";

import { getReceiptDetails } from "@/domain/receipts/receipt-service";

export type ExpenseClassificationStatus =
  | "CLASSIFIED"
  | "REVIEW_REQUIRED";

export interface ExpenseClassificationResult {
  status: ExpenseClassificationStatus;
  expenseType: "EXPENSE" | "NOT_AN_EXPENSE" | null;
  category: string | null;
  description: string;
  confidence: "HIGH" | "MEDIUM" | "LOW" | null;
  reason: string;
}

export async function classifyExpense(
  receiptId: string,
): Promise<ExpenseClassificationResult> {
  const receipt = await getReceiptDetails(receiptId);

  if (!receipt) {
    return {
      status: "REVIEW_REQUIRED",
      expenseType: null,
      category: null,
      description: "Receipt could not be found.",
      confidence: null,
      reason: "Receipt does not exist in the database.",
    };
  }

  const vendor = receipt.vendorName.toLowerCase();
  const description = receipt.description?.toLowerCase() ?? "";
  const existingCategory =
    receipt.expenseCategory?.toLowerCase() ?? "";

  if (vendor.includes("cash") || description.includes("not an expense")) {
    return {
      status: "CLASSIFIED",
      expenseType: "NOT_AN_EXPENSE",
      category: null,
      description: "Cash deposit is not an expense.",
      confidence: "HIGH",
      reason: "Receipt record identifies this transaction as a cash deposit.",
    };
  }

  if (
    vendor.includes("staples") ||
    existingCategory.includes("office")
  ) {
    return {
      status: "CLASSIFIED",
      expenseType: "EXPENSE",
      category: "Office expenses",
      description: "Office supplies and expenses.",
      confidence: "HIGH",
      reason: "Vendor and receipt category indicate an office-related purchase.",
    };
  }

  if (
    vendor.includes("restaurant") ||
    existingCategory.includes("meal") ||
    existingCategory.includes("entertainment")
  ) {
    return {
      status: "CLASSIFIED",
      expenseType: "EXPENSE",
      category: "Meals and entertainment",
      description: "Business meal expense.",
      confidence: "HIGH",
      reason: "Vendor and receipt category indicate a business meal.",
    };
  }

  return {
    status: "REVIEW_REQUIRED",
    expenseType: null,
    category: null,
    description: "Expense category could not be determined safely.",
    confidence: "LOW",
    reason:
      "Available receipt information is insufficient for a deterministic classification.",
  };
}