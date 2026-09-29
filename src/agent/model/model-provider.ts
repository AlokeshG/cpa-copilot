import { createOpenAI } from "@ai-sdk/openai";

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  throw new Error("OPENAI_API_KEY is not configured.");
}

const openai = createOpenAI({
  apiKey,
});

export const DEFAULT_MODEL = "gpt-4o-mini";

export const copilotModel = openai(DEFAULT_MODEL);