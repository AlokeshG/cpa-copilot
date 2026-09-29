import { describe, expect, it } from "vitest";
import { getDocumentationTier } from "./documentation-rules";

describe("CRA documentation tiers", () => {
  it("uses Tier 1 for amounts below $30", () => {
    expect(getDocumentationTier(29.99)).toBe(1);
  });

  it("uses Tier 2 at exactly $30", () => {
    expect(getDocumentationTier(30)).toBe(2);
  });

  it("uses Tier 2 for amounts below $150", () => {
    expect(getDocumentationTier(149.99)).toBe(2);
  });

  it("uses Tier 3 at exactly $150", () => {
    expect(getDocumentationTier(150)).toBe(3);
  });

  it("uses Tier 3 above $150", () => {
    expect(getDocumentationTier(150.01)).toBe(3);
  });
});