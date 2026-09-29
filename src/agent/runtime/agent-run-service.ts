import "server-only";
import { prisma } from "@/lib/prisma";
import type { ProcessingStage, ProcessingStatus } from "@/agent/state";

export interface CreateAgentRunInput {
  receiptId: string;
  requestId?: string;
  model?: string;
}

export interface AgentRunResult {
  id: string;
  receiptId: string;
  requestId: string | null;
  model: string | null;
  status: string;
  currentStage: ProcessingStage;
}

export async function createAgentRun(
  input: CreateAgentRunInput,
): Promise<AgentRunResult | null> {
  const receipt = await prisma.receipt.findUnique({
    where: {
      id: input.receiptId,
    },
  });

  if (!receipt) {
    return null;
  }

  const run = await prisma.agentRun.create({
    data: {
      receiptId: input.receiptId,
      requestId: input.requestId,
      model: input.model,
      status: "RUNNING",
      currentStage: "READING",
    },
  });

  await prisma.receipt.update({
    where: {
      id: input.receiptId,
    },
    data: {
      status: "PROCESSING",
      processingStage: "READING",
    },
  });

  return {
    id: run.id,
    receiptId: run.receiptId!,
    requestId: run.requestId,
    model: run.model,
    status: run.status,
    currentStage: run.currentStage,
  };
}

export async function updateAgentRunStage(
  agentRunId: string,
  receiptId: string,
  stage: ProcessingStage,
): Promise<boolean> {
  const stageMap: Record<
    ProcessingStage,
    {
      receiptStatus: ProcessingStatus;
      processingStage:
        | "IDLE"
        | "READING"
        | "VALIDATING"
        | "CATEGORIZING"
        | "CALCULATING"
        | "MAPPING"
        | "REVIEW"
        | "COMPLETE"
        | "ERROR";
    }
  > = {
    IDLE: {
      receiptStatus: "PENDING",
      processingStage: "IDLE",
    },
    READING: {
      receiptStatus: "PROCESSING",
      processingStage: "READING",
    },
    VALIDATING: {
      receiptStatus: "PROCESSING",
      processingStage: "VALIDATING",
    },
    CATEGORIZING: {
      receiptStatus: "PROCESSING",
      processingStage: "CATEGORIZING",
    },
    CALCULATING: {
      receiptStatus: "PROCESSING",
      processingStage: "CALCULATING",
    },
    MAPPING: {
      receiptStatus: "PROCESSING",
      processingStage: "MAPPING",
    },
    REVIEW: {
      receiptStatus: "REVIEW_REQUIRED",
      processingStage: "REVIEW",
    },
    COMPLETE: {
      receiptStatus: "PROCESSED",
      processingStage: "COMPLETE",
    },
    ERROR: {
      receiptStatus: "ERROR",
      processingStage: "ERROR",
    },
  };

  const mapped = stageMap[stage];

  try {
    await prisma.$transaction([
      prisma.agentRun.update({
        where: {
          id: agentRunId,
        },
        data: {
          currentStage: mapped.processingStage,
        },
      }),
      prisma.receipt.update({
        where: {
          id: receiptId,
        },
        data: {
          status: mapped.receiptStatus,
          processingStage: mapped.processingStage,
        },
      }),
    ]);

    return true;
  } catch {
    return false;
  }
}

export async function completeAgentRun(
  agentRunId: string,
  receiptId: string,
): Promise<boolean> {
  try {
    await prisma.$transaction([
      prisma.agentRun.update({
        where: {
          id: agentRunId,
        },
        data: {
          status: "COMPLETE",
          currentStage: "COMPLETE",
          completedAt: new Date(),
        },
      }),
      prisma.receipt.update({
        where: {
          id: receiptId,
        },
        data: {
          status: "PROCESSED",
          processingStage: "COMPLETE",
        },
      }),
    ]);

    return true;
  } catch {
    return false;
  }
}

export async function failAgentRun(
  agentRunId: string,
  receiptId: string,
  errorMessage: string,
): Promise<boolean> {
  try {
    await prisma.$transaction([
      prisma.agentRun.update({
        where: {
          id: agentRunId,
        },
        data: {
          status: "ERROR",
          currentStage: "ERROR",
          completedAt: new Date(),
          errorMessage,
        },
      }),
      prisma.receipt.update({
        where: {
          id: receiptId,
        },
        data: {
          status: "ERROR",
          processingStage: "ERROR",
        },
      }),
    ]);

    return true;
  } catch {
    return false;
  }
}