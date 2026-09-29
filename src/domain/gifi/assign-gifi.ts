import "server-only";

import { lookupGifiCode } from "@/domain/gifi/gifi-service";

export interface AssignGifiResult {
  status: "ASSIGNED" | "REVIEW_REQUIRED";
  code: string | null;
  description: string | null;
  category: string | null;
  confidence: "HIGH" | "MEDIUM" | "LOW" | null;
  reason: string;
}

export async function assignGifiCode(
  proposedCode: string,
): Promise<AssignGifiResult> {
  const result = await lookupGifiCode(proposedCode);

  if (result.status === "REVIEW_REQUIRED") {
    return {
      status: "REVIEW_REQUIRED",
      code: result.code,
      description: null,
      category: null,
      confidence: null,
      reason: result.reason,
    };
  }

  return {
    status: "ASSIGNED",
    code: result.code,
    description: result.description,
    category: result.category,
    confidence: result.confidence,
    reason: "Proposed GIFI code was verified against the controlled catalogue.",
  };
}