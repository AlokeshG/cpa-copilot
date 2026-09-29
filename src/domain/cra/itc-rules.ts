export type ItcStatus =
  | "ELIGIBLE"
  | "PARTIAL"
  | "INELIGIBLE"
  | "REVIEW";

export interface CalculateItcInput {
  subtotal: number;
  taxAmount: number;
  taxType: "GST" | "HST" | null;
  expenseCategory: string;
  commercialUsePercentage: number;
  mealEntertainment: boolean;
  documentationStatus:
    | "SUFFICIENT"
    | "INSUFFICIENT"
    | "MISSING"
    | "REVIEW";
  mealEligibilityPercentage?: number;
}

export interface CalculateItcResult {
  grossTax: number;
  eligibilityPercentage: number;
  eligibleItc: number;
  reasonCode: string;
  status: ItcStatus;
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateEligibleItc(
  input: CalculateItcInput,
): CalculateItcResult {
  const {
    taxAmount,
    commercialUsePercentage,
    mealEntertainment,
    documentationStatus,
    mealEligibilityPercentage,
  } = input;

  const grossTax = roundMoney(Math.max(0, taxAmount));

  if (documentationStatus !== "SUFFICIENT") {
  return {
    grossTax,
    eligibilityPercentage: 0,
    eligibleItc: 0,
    reasonCode: "DOCUMENTATION_REQUIRED",
    status: "REVIEW",
  };
}

if (grossTax <= 0 || commercialUsePercentage <= 0) {
  return {
    grossTax,
    eligibilityPercentage: 0,
    eligibleItc: 0,
    reasonCode:
      commercialUsePercentage <= 0
        ? "NO_COMMERCIAL_USE"
        : "NO_TAX_AVAILABLE",
    status: "INELIGIBLE",
  };
}

  const commercialUse = Math.min(
    100,
    Math.max(0, commercialUsePercentage),
  );

  let eligibilityPercentage = commercialUse;

  if (mealEntertainment) {
    const mealPercentage = mealEligibilityPercentage ?? 50;

    eligibilityPercentage = Math.min(
      eligibilityPercentage,
      mealPercentage,
    );
  }

  const eligibleItc = roundMoney(
    grossTax * (eligibilityPercentage / 100),
  );

  let status: ItcStatus;

  if (eligibleItc <= 0) {
    status = "INELIGIBLE";
  } else if (eligibilityPercentage < 100) {
    status = "PARTIAL";
  } else {
    status = "ELIGIBLE";
  }

  return {
    grossTax,
    eligibilityPercentage,
    eligibleItc,
    reasonCode: mealEntertainment
      ? "MEAL_ITC_LIMIT_APPLIED"
      : "COMMERCIAL_USE_PERCENTAGE_APPLIED",
    status,
  };
}