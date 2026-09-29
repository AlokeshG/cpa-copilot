import "server-only";
import { prisma } from "@/lib/prisma";

export interface GifiLookupResult {
  status: "FOUND" | "REVIEW_REQUIRED";
  code: string | null;
  description: string | null;
  category: string | null;
  confidence: "HIGH" | "MEDIUM" | "LOW" | null;
  reason: string;
}

function mapConfidence(
  confidence: unknown,
): "HIGH" | "MEDIUM" | "LOW" | null {
  if (confidence === null || confidence === undefined) {
    return null;
  }

  const value = Number(confidence);

  if (Number.isNaN(value)) {
    return null;
  }

  if (value >= 0.9) {
    return "HIGH";
  }

  if (value >= 0.7) {
    return "MEDIUM";
  }

  return "LOW";
}

export async function lookupGifiCode(
  code: string,
): Promise<GifiLookupResult> {
  const normalizedCode = code.trim();

  if (!/^\d{4}$/.test(normalizedCode)) {
    return {
      status: "REVIEW_REQUIRED",
      code: null,
      description: null,
      category: null,
      confidence: null,
      reason: "GIFI code must contain exactly four digits.",
    };
  }

  const gifi = await prisma.gifiCode.findUnique({
    where: {
      code: normalizedCode,
    },
  });

  if (!gifi) {
    return {
      status: "REVIEW_REQUIRED",
      code: normalizedCode,
      description: null,
      category: null,
      confidence: null,
      reason: "GIFI code does not exist in the controlled catalogue.",
    };
  }

  return {
    status: "FOUND",
    code: gifi.code,
    description: gifi.description,
    category: gifi.category,
    confidence: mapConfidence(gifi.confidence),
    reason: "GIFI code exists in the controlled catalogue.",
  };
}