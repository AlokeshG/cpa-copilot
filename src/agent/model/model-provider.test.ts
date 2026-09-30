import { describe, expect, it } from "vitest";

describe("model provider", () => {
  it("has a Gemini API key configured", () => {
    expect(process.env.GEMINI_API_KEY).toBeTruthy();
  });
});