import { describe, expect, it } from "vitest";
import { classifyExpense } from "./classification-service";

describe("Expense classification service", () => {
  it("classifies Staples as office expenses", async () => {
    const result = await classifyExpense(
      "receipt-staples-2026-09-18",
    );

    expect(result.status).toBe("CLASSIFIED");
    expect(result.expenseType).toBe("EXPENSE");
    expect(result.category).toBe("Office expenses");
    expect(result.confidence).toBe("HIGH");
  });

  it("classifies Restaurant ABC as meals and entertainment", async () => {
    const result = await classifyExpense(
      "receipt-restaurant-abc-2026-09",
    );

    expect(result.status).toBe("CLASSIFIED");
    expect(result.expenseType).toBe("EXPENSE");
    expect(result.category).toBe("Meals and entertainment");
  });

  it("identifies cash deposit as not an expense", async () => {
    const result = await classifyExpense(
      "receipt-cash-deposit-2026-09",
    );

    expect(result.status).toBe("CLASSIFIED");
    expect(result.expenseType).toBe("NOT_AN_EXPENSE");
    expect(result.category).toBeNull();
  });

  it("requires review for an unknown vendor", async () => {
    const result = await classifyExpense(
      "receipt-unknown-vendor-2026-09",
    );

    expect(result.status).toBe("REVIEW_REQUIRED");
  });

  it("requires review for a missing receipt", async () => {
    const result = await classifyExpense(
      "receipt-does-not-exist",
    );

    expect(result.status).toBe("REVIEW_REQUIRED");
  });
});