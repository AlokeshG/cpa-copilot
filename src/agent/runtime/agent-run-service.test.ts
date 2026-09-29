import { describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  completeAgentRun,
  createAgentRun,
  failAgentRun,
  updateAgentRunStage,
} from "./agent-run-service";

describe("agent run service", () => {
  it("creates an agent run and moves the receipt to READING", async () => {
    const receipt = await prisma.receipt.findFirst({
      where: {
        vendorName: "Staples Canada",
      },
    });

    expect(receipt).not.toBeNull();

    const result = await createAgentRun({
      receiptId: receipt!.id,
      requestId: `test-${Date.now()}`,
      model: "test-model",
    });

    expect(result).not.toBeNull();
    expect(result!.receiptId).toBe(receipt!.id);
    expect(result!.status).toBe("RUNNING");
    expect(result!.currentStage).toBe("READING");

    const updatedReceipt = await prisma.receipt.findUnique({
      where: {
        id: receipt!.id,
      },
    });

    expect(updatedReceipt?.status).toBe("PROCESSING");
    expect(updatedReceipt?.processingStage).toBe("READING");
  });

  it("updates the agent and receipt processing stage together", async () => {
    const receipt = await prisma.receipt.findFirst({
      where: {
        vendorName: "Staples Canada",
      },
    });

    expect(receipt).not.toBeNull();

    const run = await createAgentRun({
      receiptId: receipt!.id,
      requestId: `test-stage-${Date.now()}`,
    });

    expect(run).not.toBeNull();

    const updated = await updateAgentRunStage(
      run!.id,
      receipt!.id,
      "CALCULATING",
    );

    expect(updated).toBe(true);

    const agentRun = await prisma.agentRun.findUnique({
      where: {
        id: run!.id,
      },
    });

    const updatedReceipt = await prisma.receipt.findUnique({
      where: {
        id: receipt!.id,
      },
    });

    expect(agentRun?.currentStage).toBe("CALCULATING");
    expect(updatedReceipt?.processingStage).toBe("CALCULATING");
    expect(updatedReceipt?.status).toBe("PROCESSING");
  });

  it("completes an agent run", async () => {
    const receipt = await prisma.receipt.findFirst({
      where: {
        vendorName: "Staples Canada",
      },
    });

    expect(receipt).not.toBeNull();

    const run = await createAgentRun({
      receiptId: receipt!.id,
      requestId: `test-complete-${Date.now()}`,
    });

    expect(run).not.toBeNull();

    const completed = await completeAgentRun(run!.id, receipt!.id);

    expect(completed).toBe(true);

    const agentRun = await prisma.agentRun.findUnique({
      where: {
        id: run!.id,
      },
    });

    const updatedReceipt = await prisma.receipt.findUnique({
      where: {
        id: receipt!.id,
      },
    });

    expect(agentRun?.status).toBe("COMPLETE");
    expect(agentRun?.currentStage).toBe("COMPLETE");
    expect(agentRun?.completedAt).not.toBeNull();

    expect(updatedReceipt?.status).toBe("PROCESSED");
    expect(updatedReceipt?.processingStage).toBe("COMPLETE");
  });

  it("fails an agent run and records the error", async () => {
    const receipt = await prisma.receipt.findFirst({
      where: {
        vendorName: "Staples Canada",
      },
    });

    expect(receipt).not.toBeNull();

    const run = await createAgentRun({
      receiptId: receipt!.id,
      requestId: `test-error-${Date.now()}`,
    });

    expect(run).not.toBeNull();

    const failed = await failAgentRun(
      run!.id,
      receipt!.id,
      "Test processing failure.",
    );

    expect(failed).toBe(true);

    const agentRun = await prisma.agentRun.findUnique({
      where: {
        id: run!.id,
      },
    });

    const updatedReceipt = await prisma.receipt.findUnique({
      where: {
        id: receipt!.id,
      },
    });

    expect(agentRun?.status).toBe("ERROR");
    expect(agentRun?.currentStage).toBe("ERROR");
    expect(agentRun?.errorMessage).toBe("Test processing failure.");

    expect(updatedReceipt?.status).toBe("ERROR");
    expect(updatedReceipt?.processingStage).toBe("ERROR");
  });
});