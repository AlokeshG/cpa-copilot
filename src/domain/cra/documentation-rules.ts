export const CRA_RULESET_VERSION = "2026.09.1";

export type DocumentationTier = 1 | 2 | 3;

export function getDocumentationTier(
  amount: number,
): DocumentationTier {
  if (amount < 30) {
    return 1;
  }

  if (amount < 150) {
    return 2;
  }

  return 3;
}

export interface DocumentationValidationInput {
  amount: number;
  receiptAvailable: boolean;
  gstHstNumberPresent: boolean;
}

export interface DocumentationValidationResult {
  tier: DocumentationTier;
  status: "SUFFICIENT" | "MISSING" | "REVIEW";
  reason: string;
  ruleVersion: string;
}

export function validateDocumentation(
  input: DocumentationValidationInput,
): DocumentationValidationResult {
  const tier = getDocumentationTier(input.amount);

  if (!input.receiptAvailable) {
    return {
      tier,
      status: "MISSING",
      reason: "Receipt documentation is missing.",
      ruleVersion: CRA_RULESET_VERSION,
    };
  }

  if (!input.gstHstNumberPresent) {
    return {
      tier,
      status: "REVIEW",
      reason: "GST/HST number documentation requires review.",
      ruleVersion: CRA_RULESET_VERSION,
    };
  }

  return {
    tier,
    status: "SUFFICIENT",
    reason: "Required receipt documentation is present for validation.",
    ruleVersion: CRA_RULESET_VERSION,
  };
}