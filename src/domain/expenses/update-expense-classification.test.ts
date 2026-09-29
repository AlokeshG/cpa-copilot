import { describe, expect, it } from "vitest";

import { updateExpenseClassification } from "./update-expense-classification";

describe("updateExpenseClassification", () => {
  it("updates Receipt A with a valid GIFI code", async () => {
    const result = await updateExpenseClassification({
      receiptId: "receipt-staples-2026-09-18",
      expenseCategory: "Office expenses",
      gifiCode: "8810",
      gifiDescription: "Office expenses",
      grossTax: 4.1,
      eligibilityPercentage: 100,
      eligibleItc: 4.1,
      itcStatus: "ELIGIBLE",
      itcReasonCode: "ITC_ELIGIBLE",
    });

    expect(result.status).toBe("UPDATED");
    expect(result.expenseCategory).toBe("Office expenses");
    expect(result.gifiCode).toBe("8810");
    expect(result.grossTax).toBe(4.1);
    expect(result.eligibilityPercentage).toBe(100);
    expect(result.eligibleItc).toBe(4.1);
    expect(result.itcStatus).toBe("ELIGIBLE");
  });

  it("updates Receipt B with GIFI 8523", async () => {
    const result = await updateExpenseClassification({
      receiptId: "receipt-restaurant-abc-2026-09",
      expenseCategory: "Meals and entertainment",
      gifiCode: "8523",
      gifiDescription: "Meals and entertainment",
      grossTax: 12,
      eligibilityPercentage: 50,
      eligibleItc: 6,
      itcStatus: "PARTIAL",
      itcReasonCode: "ITC_PARTIAL",
    });

    expect(result.status).toBe("UPDATED");
    expect(result.expenseCategory).toBe("Meals and entertainment");
    expect(result.gifiCode).toBe("8523");
    expect(result.grossTax).toBe(12);
    expect(result.eligibilityPercentage).toBe(50);
    expect(result.eligibleItc).toBe(6);
    expect(result.itcStatus).toBe("PARTIAL");
  });

  it("rejects an unknown GIFI code", async () => {
    const result = await updateExpenseClassification({
      receiptId: "receipt-staples-2026-09-18",
      expenseCategory: "Office expenses",
      gifiCode: "9999",
      gifiDescription: "Unknown",
      grossTax: 0,
      eligibilityPercentage: 0,
      eligibleItc: 0,
      itcStatus: "REVIEW",
      itcReasonCode: "ITC_REVIEW",
    });

    expect(result.status).toBe("REVIEW_REQUIRED");
    expect(result.gifiCode).toBe("9999");
  });

  it("rejects a mismatched GIFI description", async () => {
    const result = await updateExpenseClassification({
      receiptId: "receipt-staples-2026-09-18",
      expenseCategory: "Office expenses",
      gifiCode: "8810",
      gifiDescription: "Wrong description",
      grossTax: 0,
      eligibilityPercentage: 0,
      eligibleItc: 0,
      itcStatus: "REVIEW",
      itcReasonCode: "ITC_REVIEW",
    });

    expect(result.status).toBe("REVIEW_REQUIRED");
  });

  it("requires review for a missing receipt", async () => {
    const result = await updateExpenseClassification({
      receiptId: "does-not-exist",
      expenseCategory: "Office expenses",
      gifiCode: "8810",
      gifiDescription: "Office expenses",
      grossTax: 0,
      eligibilityPercentage: 0,
      eligibleItc: 0,
      itcStatus: "REVIEW",
      itcReasonCode: "ITC_REVIEW",
    });

    expect(result.status).toBe("REVIEW_REQUIRED");
  });
});