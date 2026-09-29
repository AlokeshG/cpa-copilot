import { describe, expect, it } from "vitest";
import { lookupGifiCode } from "./gifi-service";

describe("GIFI service", () => {
  it("finds a known GIFI code", async () => {
    const result = await lookupGifiCode("8810");

    expect(result.status).toBe("FOUND");
    expect(result.code).toBe("8810");
    expect(result.description).toBe("Office expenses");
  });

  it("finds the meals GIFI code", async () => {
    const result = await lookupGifiCode("8523");

    expect(result.status).toBe("FOUND");
    expect(result.code).toBe("8523");
  });

  it("returns review for an unknown GIFI code", async () => {
    const result = await lookupGifiCode("9999");

    expect(result.status).toBe("REVIEW_REQUIRED");
  });

  it("rejects an invalid GIFI format", async () => {
    const result = await lookupGifiCode("ABC");

    expect(result.status).toBe("REVIEW_REQUIRED");
  });
});