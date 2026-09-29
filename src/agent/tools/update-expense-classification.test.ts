import { describe, expect, it } from "vitest";

import { prisma } from "@/lib/prisma";
import { updateExpenseClassificationTool } from "./update-expense-classification";

describe("updateExpenseClassificationTool", () => {
  it("updates an existing expense with valid classification and ITC data", async () => {
    const receipt = await prisma.receipt.findUnique({
      where: {
        id: "receipt-staples-2026-09-18",
      },
    });

    const gifi = await prisma.gifiCode.findUnique({
      where: {
        code: "8810",
      },
    });

    const result = await updateExpenseClassificationTool({
      receiptId: receipt!.id,
      expenseCategory: "Office expenses",
      gifiCode: "8810",
      gifiDescription: gifi!.description,
      grossTax: 4.1,
      eligibilityPercentage: 100,
      eligibleItc: 4.1,
      itcStatus: "ELIGIBLE",
      itcReasonCode: "ITC_ELIGIBLE",
    });

    expect(result.success).toBe(true);
    expect(result.result?.status).toBe("UPDATED");
    expect(result.result?.expenseCategory).toBe("Office expenses");
    expect(result.result?.gifiCode).toBe("8810");
    expect(result.result?.eligibleItc).toBe(4.1);
  });

  it("rejects an unknown GIFI code", async () => {
    const receipt = await prisma.receipt.findUnique({
      where: {
        id: "receipt-staples-2026-09-18",
      },
    });

    const result = await updateExpenseClassificationTool({
      receiptId: receipt!.id,
      expenseCategory: "Office expenses",
      gifiCode: "9999",
      gifiDescription: "Unknown GIFI code",
      grossTax: 0,
      eligibilityPercentage: 0,
      eligibleItc: 0,
      itcStatus: "REVIEW",
      itcReasonCode: "ITC_REVIEW",
    });

    expect(result.success).toBe(true);
    expect(result.result?.status).toBe("REVIEW_REQUIRED");
    expect(result.result?.gifiCode).toBe("9999");
  });

  it("rejects a mismatched GIFI description", async () => {
    const receipt = await prisma.receipt.findUnique({
      where: {
        id: "receipt-staples-2026-09-18",
      },
    });

    const result = await updateExpenseClassificationTool({
      receiptId: receipt!.id,
      expenseCategory: "Office expenses",
      gifiCode: "8810",
      gifiDescription: "Incorrect description",
      grossTax: 0,
      eligibilityPercentage: 0,
      eligibleItc: 0,
      itcStatus: "REVIEW",
      itcReasonCode: "ITC_REVIEW",
    });

    expect(result.success).toBe(true);
    expect(result.result?.status).toBe("REVIEW_REQUIRED");
  });

  it("handles a missing receipt", async () => {
    const result = await updateExpenseClassificationTool({
      receiptId: "missing-receipt-id",
      expenseCategory: "Office expenses",
      gifiCode: "8810",
      gifiDescription: "Office expenses",
      grossTax: 0,
      eligibilityPercentage: 0,
      eligibleItc: 0,
      itcStatus: "REVIEW",
      itcReasonCode: "ITC_REVIEW",
    });

    expect(result.success).toBe(true);
    expect(result.result?.status).toBe("REVIEW_REQUIRED");
  });

  it("rejects invalid arguments", async () => {
    const result = await updateExpenseClassificationTool({
      receiptId: "some-receipt",
      expenseCategory: "Office expenses",
      gifiCode: "invalid",
      gifiDescription: "Office expenses",
      grossTax: 0,
      eligibilityPercentage: 0,
      eligibleItc: 0,
      itcStatus: "REVIEW",
      itcReasonCode: "ITC_REVIEW",
    });

    expect(result.success).toBe(false);
    expect(result.result).toBeNull();
    expect(result.error).toBe(
      "Invalid update_expense_classification arguments.",
    );
  });
});