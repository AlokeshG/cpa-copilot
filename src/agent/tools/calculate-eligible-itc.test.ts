import { describe, expect, it } from "vitest";
import { calculateEligibleItcTool } from "./calculate-eligible-itc";

describe("calculate_eligible_itc tool", () => {
  it("calculates 100% ITC for a fully eligible expense", () => {
    const result = calculateEligibleItcTool({
      subtotal: 82,
      taxAmount: 4.1,
      taxType: "GST",
      expenseCategory: "Office Expenses",
      commercialUsePercentage: 100,
      mealEntertainment: false,
      documentationStatus: "SUFFICIENT",
    });

    expect(result.success).toBe(true);
    expect(result.result?.grossTax).toBe(4.1);
    expect(result.result?.eligibilityPercentage).toBe(100);
    expect(result.result?.eligibleItc).toBe(4.1);
    expect(result.result?.status).toBe("ELIGIBLE");
  });

  it("calculates 50% ITC for a business meal", () => {
    const result = calculateEligibleItcTool({
      subtotal: 240,
      taxAmount: 12,
      taxType: "GST",
      expenseCategory: "Meals and Entertainment",
      commercialUsePercentage: 100,
      mealEntertainment: true,
      documentationStatus: "SUFFICIENT",
    });

    expect(result.success).toBe(true);
    expect(result.result?.grossTax).toBe(12);
    expect(result.result?.eligibilityPercentage).toBe(50);
    expect(result.result?.eligibleItc).toBe(6);
    expect(result.result?.status).toBe("PARTIAL");
  });

  it("reduces ITC based on commercial use", () => {
    const result = calculateEligibleItcTool({
      subtotal: 100,
      taxAmount: 5,
      taxType: "GST",
      expenseCategory: "Office Expenses",
      commercialUsePercentage: 50,
      mealEntertainment: false,
      documentationStatus: "SUFFICIENT",
    });

    expect(result.success).toBe(true);
    expect(result.result?.eligibilityPercentage).toBe(50);
    expect(result.result?.eligibleItc).toBe(2.5);
  });

  it("returns review when documentation requires review", () => {
    const result = calculateEligibleItcTool({
      subtotal: 1200,
      taxAmount: 60,
      taxType: "GST",
      expenseCategory: "Other",
      commercialUsePercentage: 100,
      mealEntertainment: false,
      documentationStatus: "REVIEW",
    });

    expect(result.success).toBe(true);
    expect(result.result?.status).toBe("REVIEW");
  });

  it("rejects commercial use above 100", () => {
    const result = calculateEligibleItcTool({
      subtotal: 100,
      taxAmount: 5,
      taxType: "GST",
      expenseCategory: "Office Expenses",
      commercialUsePercentage: 120,
      mealEntertainment: false,
      documentationStatus: "SUFFICIENT",
    });

    expect(result.success).toBe(false);
    expect(result.result).toBeNull();
  });
});