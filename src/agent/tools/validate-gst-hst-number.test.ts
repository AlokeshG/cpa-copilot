import { describe, expect, it } from "vitest";
import { validateGstHstNumberTool } from "./validate-gst-hst-number";

describe("validate_gst_hst_number tool", () => {
  it("accepts a valid GST/HST number format", () => {
    const result = validateGstHstNumberTool({
      gstHstNumber: "123456789RT0001",
    });

    expect(result.success).toBe(true);
    expect(result.result?.status).toBe("VALID_FORMAT");
    expect(result.result?.registrationVerified).toBe(false);
  });

  it("returns missing when no number is provided", () => {
    const result = validateGstHstNumberTool({
      gstHstNumber: null,
    });

    expect(result.success).toBe(true);
    expect(result.result?.status).toBe("MISSING");
  });

  it("rejects an invalid format", () => {
    const result = validateGstHstNumberTool({
      gstHstNumber: "12345",
    });

    expect(result.success).toBe(true);
    expect(result.result?.status).toBe("INVALID_FORMAT");
  });

  it("normalizes whitespace and casing", () => {
    const result = validateGstHstNumberTool({
      gstHstNumber: " 123456789 rt 0001 ",
    });

    expect(result.success).toBe(true);
    expect(result.result?.status).toBe("VALID_FORMAT");
    expect(result.result?.normalizedNumber).toBe("123456789RT0001");
  });

  it("rejects invalid tool arguments", () => {
    const result = validateGstHstNumberTool({
      gstHstNumber: 123 as unknown as string,
    });

    expect(result.success).toBe(false);
    expect(result.result).toBeNull();
  });
});