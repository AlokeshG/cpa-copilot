import { describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { classifyExpenseTool } from "./classify-expense";

describe("classify_expense tool", () => {
  it("classifies Staples Canada as an office expense", async () => {
    const receipt = await prisma.receipt.findFirst({
      where: {
        vendorName: "Staples Canada",
      },
    });

    expect(receipt).not.toBeNull();

    if (!receipt) {
      return;
    }

    const result = await classifyExpenseTool({
      receiptId: receipt.id,
    });

    expect(result.success).toBe(true);
    expect(result.result?.status).toBe("CLASSIFIED");
    expect(result.result?.expenseType).toBe("EXPENSE");
    expect(result.result?.category).toBe("Office expenses");
    expect(result.result?.confidence).toBe("HIGH");
  });

  it("returns review for an unknown receipt", async () => {
    const result = await classifyExpenseTool({
      receiptId: "does-not-exist",
    });

    expect(result.success).toBe(true);
    expect(result.result?.status).toBe("REVIEW_REQUIRED");
    expect(result.result?.expenseType).toBeNull();
  });

  it("rejects an empty receipt ID", async () => {
    const result = await classifyExpenseTool({
      receiptId: "",
    });

    expect(result.success).toBe(false);
    expect(result.result).toBeNull();
    expect(result.error).toBe(
      "Invalid classify_expense arguments.",
    );
  });
});