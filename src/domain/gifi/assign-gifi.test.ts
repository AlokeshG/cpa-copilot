import { describe, expect, it } from "vitest";
import { assignGifiCode } from "./assign-gifi";

describe("GIFI assignment", () => {
  it("assigns GIFI 8810 for office expenses", async () => {
    const result = await assignGifiCode("8810");

    expect(result.status).toBe("ASSIGNED");
    expect(result.code).toBe("8810");
    expect(result.description).toBe("Office expenses");
  });

  it("assigns GIFI 8523 for meals and entertainment", async () => {
    const result = await assignGifiCode("8523");

    expect(result.status).toBe("ASSIGNED");
    expect(result.code).toBe("8523");
    expect(result.description).toBe("Meals and entertainment");
  });

  it("assigns GIFI 1001 for cash", async () => {
    const result = await assignGifiCode("1001");

    expect(result.status).toBe("ASSIGNED");
    expect(result.code).toBe("1001");
  });

  it("requires review for an unknown code", async () => {
    const result = await assignGifiCode("9999");

    expect(result.status).toBe("REVIEW_REQUIRED");
  });
});