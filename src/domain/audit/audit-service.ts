import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";

export interface CreateAuditEventInput {
  actor: string;
  receiptId?: string;
  agentRunId?: string;
  action: string;
  input: unknown;
  result: unknown;
  ruleVersion?: string;
  model?: string;
  status: "SUCCESS" | "FAILURE";
  details?: unknown;
}

export interface AuditEventResult {
  eventId: string;
  timestamp: Date;
  actor: string;
  receiptId: string | null;
  agentRunId: string | null;
  action: string;
  inputHash: string;
  resultHash: string;
  ruleVersion: string | null;
  model: string | null;
  status: "SUCCESS" | "FAILURE";
}

function hashValue(value: unknown): string {
  const serialized = JSON.stringify(value);

  return createHash("sha256")
    .update(serialized)
    .digest("hex");
}

export async function createAuditEvent(
  input: CreateAuditEventInput,
): Promise<AuditEventResult> {
  const eventId = randomUUID();
  const timestamp = new Date();

  const inputHash = hashValue(input.input);
  const resultHash = hashValue(input.result);

  const event = await prisma.auditEvent.create({
    data: {
      eventId,
      timestamp,
      actor: input.actor,
      receiptId: input.receiptId,
      agentRunId: input.agentRunId,
      action: input.action,
      inputHash,
      resultHash,
      ruleVersion: input.ruleVersion,
      model: input.model,
      status: input.status,
      details: input.details as never,
    },
  });

  return {
    eventId: event.eventId,
    timestamp: event.timestamp,
    actor: event.actor,
    receiptId: event.receiptId,
    agentRunId: event.agentRunId,
    action: event.action,
    inputHash: event.inputHash ?? "",
    resultHash: event.resultHash ?? "",
    ruleVersion: event.ruleVersion,
    model: event.model,
    status: event.status,
  };
}