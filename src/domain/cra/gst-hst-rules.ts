export type GstHstNumberStatus =
  | "VALID_FORMAT"
  | "INVALID_FORMAT"
  | "MISSING"
  | "MALFORMED"
  | "SUSPICIOUS"
  | "UNKNOWN";

export interface GstHstValidationResult {
  status: GstHstNumberStatus;
  normalizedNumber: string | null;
  registrationVerified: boolean;
  reason: string;
}

export function validateGstHstNumber(
  value: string | null | undefined,
): GstHstValidationResult {
  if (value === null || value === undefined || value.trim() === "") {
    return {
      status: "MISSING",
      normalizedNumber: null,
      registrationVerified: false,
      reason: "GST/HST number is missing.",
    };
  }

  const normalizedNumber = value
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");

  if (!/^\d{9}RT\d{4}$/.test(normalizedNumber)) {
    return {
      status: "INVALID_FORMAT",
      normalizedNumber,
      registrationVerified: false,
      reason: "GST/HST number does not match the expected format.",
    };
  }

  return {
    status: "VALID_FORMAT",
    normalizedNumber,
    registrationVerified: false,
    reason:
      "GST/HST number has a valid syntactic format. CRA registration has not been verified.",
  };
}