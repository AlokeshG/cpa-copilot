import { describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { runCpaAgent } from "./cpa-agent";

describe("CPA agent", () => {
  it("processes Staples Canada successfully", async () => {
    const receipt = await prisma.receipt.findFirst({
      where: {
        vendorName: "Staples Canada",
      },
    });

    expect(receipt).not.toBeNull();

    const result = await runCpaAgent({
      receiptId: receipt!.id,
      requestId: `cpa-staples-${Date.now()}`,
      model: "test-model",
    });

    console.log(
      "STAPLES RESULT:",
      JSON.stringify(result, null, 2),
    );

    expect(result.success).toBe(true);
    expect(result.error).toBeNull();
    expect(result.agentRunId).not.toBeNull();

    expect(result.state.processingStatus).toBe("PROCESSED");
    expect(result.state.processingStage).toBe("COMPLETE");

    expect(result.state.currentAnalysis?.expenseCategory).toBe(
      "Office expenses",
    );

    expect(result.state.currentAnalysis?.gifiCode).toBe("8810");

    expect(result.state.currentAnalysis?.eligibleItc).toBe(4.1);

    expect(result.state.currentAnalysis?.itcStatus).toBe("ELIGIBLE");
  });

  it("processes Restaurant ABC with partial meal ITC", async () => {
    const receipt = await prisma.receipt.findFirst({
      where: {
        vendorName: "Restaurant ABC",
      },
    });

    expect(receipt).not.toBeNull();

    const result = await runCpaAgent({
      receiptId: receipt!.id,
      requestId: `cpa-restaurant-${Date.now()}`,
      model: "test-model",
    });

    console.log(
      "RESTAURANT RESULT:",
      JSON.stringify(result, null, 2),
    );

    expect(result.success).toBe(true);
    expect(result.error).toBeNull();

    expect(result.state.processingStatus).toBe("PROCESSED");
    expect(result.state.processingStage).toBe("COMPLETE");

    expect(result.state.currentAnalysis?.expenseCategory).toBe(
      "Meals and entertainment",
    );

    expect(result.state.currentAnalysis?.gifiCode).toBe("8523");

    expect(result.state.currentAnalysis?.grossTax).toBe(12);

    expect(result.state.currentAnalysis?.eligibilityPercentage).toBe(50);

    expect(result.state.currentAnalysis?.eligibleItc).toBe(6);

    expect(result.state.currentAnalysis?.itcStatus).toBe("PARTIAL");
  });

  it("routes Unknown Vendor to human review", async () => {
    const receipt = await prisma.receipt.findFirst({
      where: {
        vendorName: "Unknown Vendor",
      },
    });

    expect(receipt).not.toBeNull();

    const result = await runCpaAgent({
      receiptId: receipt!.id,
      requestId: `cpa-unknown-${Date.now()}`,
      model: "test-model",
    });

    console.log(
      "UNKNOWN VENDOR RESULT:",
      JSON.stringify(result, null, 2),
    );

    expect(result.success).toBe(true);
    expect(result.error).toBeNull();

    expect(result.state.processingStatus).toBe("REVIEW_REQUIRED");
    expect(result.state.processingStage).toBe("REVIEW");

    const approval = await prisma.approval.findFirst({
      where: {
        receiptId: receipt!.id,
        status: "PENDING",
      },
      orderBy: {
        requestedAt: "desc",
      },
    });

    expect(approval).not.toBeNull();
  });

  it("does not treat the cash deposit as an ordinary expense", async () => {
    const receipt = await prisma.receipt.findFirst({
      where: {
        vendorName: "Cash Deposit",
      },
    });

    expect(receipt).not.toBeNull();

    const result = await runCpaAgent({
      receiptId: receipt!.id,
      requestId: `cpa-cash-${Date.now()}`,
      model: "test-model",
    });

    console.log(
      "CASH DEPOSIT RESULT:",
      JSON.stringify(result, null, 2),
    );

    expect(result.success).toBe(true);

    expect(
      ["REVIEW_REQUIRED", "PROCESSED"].includes(
        result.state.processingStatus,
      ),
    ).toBe(true);

    expect(
      result.state.currentAnalysis?.expenseCategory ?? null,
    ).not.toBe("Office expenses");
  });
});