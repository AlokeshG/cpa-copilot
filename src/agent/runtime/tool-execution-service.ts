import "server-only";
import { prisma } from "@/lib/prisma";
import { executeTool, isAllowedTool, type ToolName } from "@/agent/tool-registry";
import { createAuditEvent } from "@/domain/audit/audit-service";

export interface ExecuteToolWithLoggingInput {
  toolName: string;
  input: unknown;
  receiptId?: string;
  agentRunId?: string;
  actor?: string;
  model?: string;
  ruleVersion?: string;
}

export interface ExecuteToolWithLoggingResult {
  success: boolean;
  toolCallId: string | null;
  output: unknown;
  error: string | null;
}

export async function executeToolWithLogging(
  input: ExecuteToolWithLoggingInput,
): Promise<ExecuteToolWithLoggingResult> {
  if (!isAllowedTool(input.toolName)) {
    return {
      success: false,
      toolCallId: null,
      output: null,
      error: `Tool '${input.toolName}' is not allowlisted.`,
    };
  }

  const toolName = input.toolName as ToolName;

  const toolCall = await prisma.toolCall.create({
    data: {
      agentRunId: input.agentRunId,
      receiptId: input.receiptId,
      toolName,
      inputJson: input.input as never,
      status: "RUNNING",
    },
  });

  try {
    const output = await executeTool(toolName, input.input);

    const outputRecord =
      typeof output === "object" &&
      output !== null &&
      "success" in output
        ? (output as { success?: unknown; error?: unknown })
        : null;

    const success = outputRecord?.success === true;
    const error =
      !success && typeof outputRecord?.error === "string"
        ? outputRecord.error
        : null;

    await prisma.toolCall.update({
      where: {
        id: toolCall.id,
      },
      data: {
        outputJson: output as never,
        status: success ? "SUCCESS" : "ERROR",
        errorMessage: error,
        completedAt: new Date(),
      },
    });

    await createAuditEvent({
      actor: input.actor ?? "agent",
      receiptId: input.receiptId,
      agentRunId: input.agentRunId,
      action: `tool.${toolName}`,
      input: input.input,
      result: output,
      ruleVersion: input.ruleVersion,
      model: input.model,
      status: success ? "SUCCESS" : "FAILURE",
    });

    return {
      success,
      toolCallId: toolCall.id,
      output,
      error,
    };
  } catch {
    const errorMessage = `Tool '${toolName}' execution failed.`;

    await prisma.toolCall.update({
      where: {
        id: toolCall.id,
      },
      data: {
        status: "ERROR",
        errorMessage,
        completedAt: new Date(),
      },
    });

    await createAuditEvent({
      actor: input.actor ?? "agent",
      receiptId: input.receiptId,
      agentRunId: input.agentRunId,
      action: `tool.${toolName}`,
      input: input.input,
      result: {
        success: false,
        error: errorMessage,
      },
      ruleVersion: input.ruleVersion,
      model: input.model,
      status: "FAILURE",
    });

    return {
      success: false,
      toolCallId: toolCall.id,
      output: null,
      error: errorMessage,
    };
  }
}