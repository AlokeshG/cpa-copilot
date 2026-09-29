import { describe, expect, it } from "vitest";
import { calculateEligibleItc } from "./itc-rules";

describe("ITC calculation rules", () => {
  it("calculates 100% ITC for a normal business expense", () => {
    const result = calculateEligibleItc({
      subtotal: 82,
      taxAmount: 4.1,
      taxType: "GST",
      expenseCategory: "Office supplies",
      commercialUsePercentage: 100,
      mealEntertainment: false,
      documentationStatus: "SUFFICIENT",
    });

    expect(result.grossTax).toBe(4.1);
    expect(result.eligibilityPercentage).toBe(100);
    expect(result.eligibleItc).toBe(4.1);
    expect(result.status).toBe("ELIGIBLE");
  });

  it("calculates 50% ITC for a standard business meal", () => {
    const result = calculateEligibleItc({
      subtotal: 240,
      taxAmount: 12,
      taxType: "GST",
      expenseCategory: "Business meal",
      commercialUsePercentage: 100,
      mealEntertainment: true,
      documentationStatus: "SUFFICIENT",
    });

    expect(result.grossTax).toBe(12);
    expect(result.eligibilityPercentage).toBe(50);
    expect(result.eligibleItc).toBe(6);
    expect(result.status).toBe("PARTIAL");
  });

  it("applies commercial use percentage", () => {
    const result = calculateEligibleItc({
      subtotal: 100,
      taxAmount: 5,
      taxType: "GST",
      expenseCategory: "Office supplies",
      commercialUsePercentage: 50,
      mealEntertainment: false,
      documentationStatus: "SUFFICIENT",
    });

    expect(result.grossTax).toBe(5);
    expect(result.eligibilityPercentage).toBe(50);
    expect(result.eligibleItc).toBe(2.5);
  });

  it("returns zero ITC for zero commercial use", () => {
    const result = calculateEligibleItc({
      subtotal: 100,
      taxAmount: 5,
      taxType: "GST",
      expenseCategory: "Office supplies",
      commercialUsePercentage: 0,
      mealEntertainment: false,
      documentationStatus: "SUFFICIENT",
    });

    expect(result.eligibleItc).toBe(0);
    expect(result.status).toBe("INELIGIBLE");
  });

  it("does not allow ITC when documentation is insufficient", () => {
    const result = calculateEligibleItc({
      subtotal: 1200,
      taxAmount: 60,
      taxType: "GST",
      expenseCategory: "Unknown expense",
      commercialUsePercentage: 100,
      mealEntertainment: false,
      documentationStatus: "MISSING",
    });

    expect(result.eligibleItc).toBe(0);
    expect(result.status).toBe("REVIEW");
  });
});