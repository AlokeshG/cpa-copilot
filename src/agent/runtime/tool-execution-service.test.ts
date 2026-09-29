import { describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { executeToolWithLogging } from "./tool-execution-service";

describe("tool execution service", () => {
  it("executes a tool and persists the tool call and audit event", async () => {
    const receipt = await prisma.receipt.findFirst({
      where: {
        vendorName: "Staples Canada",
      },
    });

    expect(receipt).not.toBeNull();

    const result = await executeToolWithLogging({
      toolName: "validate_gst_hst_number",
      input: {
        gstHstNumber: receipt!.gstHstNumber,
      },
      receiptId: receipt!.id,
      actor: "test-agent",
      model: "test-model",
      ruleVersion: "2026.09.1",
    });

    expect(result.success).toBe(true);
    expect(result.toolCallId).not.toBeNull();
    expect(result.output).not.toBeNull();
    expect(result.error).toBeNull();

    const toolCall = await prisma.toolCall.findUnique({
      where: {
        id: result.toolCallId!,
      },
    });

    expect(toolCall).not.toBeNull();
    expect(toolCall?.toolName).toBe("validate_gst_hst_number");
    expect(toolCall?.status).toBe("SUCCESS");
    expect(toolCall?.receiptId).toBe(receipt!.id);
    expect(toolCall?.outputJson).not.toBeNull();
    expect(toolCall?.completedAt).not.toBeNull();

    const auditEvent = await prisma.auditEvent.findFirst({
      where: {
        action: "tool.validate_gst_hst_number",
        receiptId: receipt!.id,
      },
      orderBy: {
        timestamp: "desc",
      },
    });

    expect(auditEvent).not.toBeNull();
    expect(auditEvent?.status).toBe("SUCCESS");
    expect(auditEvent?.actor).toBe("test-agent");
  });

  it("rejects a non-allowlisted tool without creating a tool call", async () => {
    const before = await prisma.toolCall.count();

    const result = await executeToolWithLogging({
      toolName: "execute_shell",
      input: {
        command: "dir",
      },
      actor: "test-agent",
    });

    const after = await prisma.toolCall.count();

    expect(result.success).toBe(false);
    expect(result.toolCallId).toBeNull();
    expect(result.output).toBeNull();
    expect(result.error).toBe(
      "Tool 'execute_shell' is not allowlisted.",
    );

    expect(after).toBe(before);
  });

  it("records tool failures when the tool returns an error", async () => {
    const result = await executeToolWithLogging({
      toolName: "get_receipt_details",
      input: {
        receiptId: "missing-receipt-id",
      },
      actor: "test-agent",
    });

    expect(result.success).toBe(false);
    expect(result.toolCallId).not.toBeNull();
    expect(result.output).not.toBeNull();
    expect(result.error).toBe("Receipt was not found.");

    const toolCall = await prisma.toolCall.findUnique({
      where: {
        id: result.toolCallId!,
      },
    });

    expect(toolCall).not.toBeNull();
    expect(toolCall?.status).toBe("ERROR");
    expect(toolCall?.errorMessage).toBe("Receipt was not found.");
    expect(toolCall?.completedAt).not.toBeNull();
  });

  it("stores the agent run reference when provided", async () => {
    const receipt = await prisma.receipt.findFirst({
      where: {
        vendorName: "Staples Canada",
      },
    });

    expect(receipt).not.toBeNull();

    const agentRun = await prisma.agentRun.create({
      data: {
        receiptId: receipt!.id,
        requestId: `tool-execution-${Date.now()}`,
        model: "test-model",
        status: "RUNNING",
        currentStage: "READING",
      },
    });

    const result = await executeToolWithLogging({
      toolName: "validate_gst_hst_number",
      input: {
        gstHstNumber: receipt!.gstHstNumber,
      },
      receiptId: receipt!.id,
      agentRunId: agentRun.id,
      actor: "agent",
      model: "test-model",
    });

    expect(result.success).toBe(true);

    const toolCall = await prisma.toolCall.findUnique({
      where: {
        id: result.toolCallId!,
      },
    });

    expect(toolCall?.agentRunId).toBe(agentRun.id);

    const auditEvent = await prisma.auditEvent.findFirst({
      where: {
        agentRunId: agentRun.id,
        action: "tool.validate_gst_hst_number",
      },
      orderBy: {
        timestamp: "desc",
      },
    });

    expect(auditEvent).not.toBeNull();
    expect(auditEvent?.agentRunId).toBe(agentRun.id);
  });
});