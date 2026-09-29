import { describe, expect, it } from "vitest";

describe("model provider", () => {
  it("has an OpenAI API key configured", () => {
    expect(process.env.OPENAI_API_KEY).toBeTruthy();
  });
});