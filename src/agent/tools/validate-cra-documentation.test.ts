import { describe, expect, it } from "vitest";
import { validateCraDocumentationTool } from "./validate-cra-documentation";

describe("validate_cra_documentation tool", () => {
  it("validates documentation for a Tier 1 receipt", () => {
    const result = validateCraDocumentationTool({
      amount: 29.99,
      receiptAvailable: true,
      gstHstNumberPresent: true,
    });

    expect(result.success).toBe(true);
    expect(result.result?.tier).toBe(1);
    expect(result.result?.status).toBe("SUFFICIENT");
  });

  it("uses Tier 2 at exactly $30", () => {
    const result = validateCraDocumentationTool({
      amount: 30,
      receiptAvailable: true,
      gstHstNumberPresent: true,
    });

    expect(result.success).toBe(true);
    expect(result.result?.tier).toBe(2);
  });

  it("uses Tier 3 at exactly $150", () => {
    const result = validateCraDocumentationTool({
      amount: 150,
      receiptAvailable: true,
      gstHstNumberPresent: true,
    });

    expect(result.success).toBe(true);
    expect(result.result?.tier).toBe(3);
  });

  it("returns missing when the receipt is unavailable", () => {
    const result = validateCraDocumentationTool({
      amount: 82,
      receiptAvailable: false,
      gstHstNumberPresent: true,
    });

    expect(result.success).toBe(true);
    expect(result.result?.status).toBe("MISSING");
  });

  it("returns review when the GST/HST number is missing", () => {
    const result = validateCraDocumentationTool({
      amount: 1200,
      receiptAvailable: true,
      gstHstNumberPresent: false,
    });

    expect(result.success).toBe(true);
    expect(result.result?.status).toBe("REVIEW");
  });

  it("rejects invalid arguments", () => {
    const result = validateCraDocumentationTool({
      amount: -10,
      receiptAvailable: true,
      gstHstNumberPresent: true,
    });

    expect(result.success).toBe(false);
    expect(result.result).toBeNull();
  });
});