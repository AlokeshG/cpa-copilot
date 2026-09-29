import { describe, expect, it } from "vitest";
import { validateGstHstNumber } from "./gst-hst-rules";

describe("GST/HST number validation", () => {
  it("accepts a syntactically valid GST/HST number", () => {
    const result = validateGstHstNumber("123456789RT0001");

    expect(result.status).toBe("VALID_FORMAT");
  });

  it("rejects an invalid GST/HST number format", () => {
    const result = validateGstHstNumber("12345");

    expect(result.status).toBe("INVALID_FORMAT");
  });

  it("detects a missing GST/HST number", () => {
    const result = validateGstHstNumber(null);

    expect(result.status).toBe("MISSING");
  });

  it("detects an empty GST/HST number", () => {
    const result = validateGstHstNumber("");

    expect(result.status).toBe("MISSING");
  });

  it("does not claim CRA registration from format validation alone", () => {
    const result = validateGstHstNumber("123456789RT0001");

    expect(result.status).toBe("VALID_FORMAT");
    expect(result.registrationVerified).toBe(false);
  });
});