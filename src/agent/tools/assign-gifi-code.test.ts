import { describe, expect, it } from "vitest";
import { assignGifiCodeTool } from "./assign-gifi-code";

describe("assign_gifi_code tool", () => {
  it("assigns a known office-expense GIFI code", async () => {
    const result = await assignGifiCodeTool({
      proposedCode: "8810",
    });

    expect(result.success).toBe(true);
    expect(result.result?.status).toBe("ASSIGNED");
    expect(result.result?.code).toBe("8810");
    expect(result.result?.description).not.toBeNull();
    expect(result.result?.confidence).not.toBeNull();
  });

  it("assigns the known meals GIFI code", async () => {
    const result = await assignGifiCodeTool({
      proposedCode: "8523",
    });

    expect(result.success).toBe(true);
    expect(result.result?.status).toBe("ASSIGNED");
    expect(result.result?.code).toBe("8523");
  });

  it("requires review for an unknown GIFI code", async () => {
    const result = await assignGifiCodeTool({
      proposedCode: "9998",
    });

    expect(result.success).toBe(true);
    expect(result.result?.status).toBe("REVIEW_REQUIRED");
  });

  it("rejects an invalid GIFI code format", async () => {
    const result = await assignGifiCodeTool({
      proposedCode: "ABC",
    });

    expect(result.success).toBe(true);
    expect(result.result?.status).toBe("REVIEW_REQUIRED");
  });

  it("rejects an empty proposed code", async () => {
    const result = await assignGifiCodeTool({
      proposedCode: "",
    });

    expect(result.success).toBe(false);
    expect(result.result).toBeNull();
  });
});