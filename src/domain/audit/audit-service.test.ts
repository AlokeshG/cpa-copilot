import { describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { createAuditEvent } from "./audit-service";

describe("audit service", () => {
  it("creates a successful audit event", async () => {
    const receipt = await prisma.receipt.findFirst({
      where: {
        vendorName: "Staples Canada",
      },
    });

    expect(receipt).not.toBeNull();

    const result = await createAuditEvent({
      actor: "test-agent",
      receiptId: receipt!.id,
      action: "test_tool_execution",
      input: {
        receiptId: receipt!.id,
        value: "test",
      },
      result: {
        success: true,
      },
      ruleVersion: "2026.09.1",
      model: "test-model",
      status: "SUCCESS",
      details: {
        test: true,
      },
    });

    expect(result.eventId).toBeDefined();
    expect(result.timestamp).toBeInstanceOf(Date);
    expect(result.actor).toBe("test-agent");
    expect(result.receiptId).toBe(receipt!.id);
    expect(result.action).toBe("test_tool_execution");
    expect(result.inputHash).toHaveLength(64);
    expect(result.resultHash).toHaveLength(64);
    expect(result.ruleVersion).toBe("2026.09.1");
    expect(result.model).toBe("test-model");
    expect(result.status).toBe("SUCCESS");

    const storedEvent = await prisma.auditEvent.findUnique({
      where: {
        eventId: result.eventId,
      },
    });

    expect(storedEvent).not.toBeNull();
    expect(storedEvent?.actor).toBe("test-agent");
    expect(storedEvent?.action).toBe("test_tool_execution");
    expect(storedEvent?.status).toBe("SUCCESS");
  });

  it("creates a failure audit event", async () => {
    const result = await createAuditEvent({
      actor: "test-agent",
      action: "test_failed_tool",
      input: {
        receiptId: "missing",
      },
      result: {
        success: false,
        error: "Receipt was not found.",
      },
      status: "FAILURE",
    });

    expect(result.eventId).toBeDefined();
    expect(result.inputHash).toHaveLength(64);
    expect(result.resultHash).toHaveLength(64);
    expect(result.status).toBe("FAILURE");

    const storedEvent = await prisma.auditEvent.findUnique({
      where: {
        eventId: result.eventId,
      },
    });

    expect(storedEvent).not.toBeNull();
    expect(storedEvent?.status).toBe("FAILURE");
  });

  it("produces deterministic hashes for the same input and result", async () => {
    const input = {
      receiptId: "receipt-test",
      amount: 100,
    };

    const result = {
      success: true,
      value: 5,
    };

    const first = await createAuditEvent({
      actor: "test-agent",
      action: "hash_test",
      input,
      result,
      status: "SUCCESS",
    });

    const second = await createAuditEvent({
      actor: "test-agent",
      action: "hash_test",
      input,
      result,
      status: "SUCCESS",
    });

    expect(first.inputHash).toBe(second.inputHash);
    expect(first.resultHash).toBe(second.resultHash);
  });

  it("stores agent run and receipt references", async () => {
    const receipt = await prisma.receipt.findFirst({
      where: {
        vendorName: "Staples Canada",
      },
    });

    expect(receipt).not.toBeNull();

    const agentRun = await prisma.agentRun.create({
      data: {
        receiptId: receipt!.id,
        requestId: `audit-test-${Date.now()}`,
        model: "test-model",
        status: "RUNNING",
        currentStage: "READING",
      },
    });

    const result = await createAuditEvent({
      actor: "agent",
      receiptId: receipt!.id,
      agentRunId: agentRun.id,
      action: "agent_started",
      input: {
        receiptId: receipt!.id,
      },
      result: {
        stage: "READING",
      },
      model: "test-model",
      status: "SUCCESS",
    });

    expect(result.receiptId).toBe(receipt!.id);
    expect(result.agentRunId).toBe(agentRun.id);

    const storedEvent = await prisma.auditEvent.findUnique({
      where: {
        eventId: result.eventId,
      },
    });

    expect(storedEvent?.receiptId).toBe(receipt!.id);
    expect(storedEvent?.agentRunId).toBe(agentRun.id);
  });
});