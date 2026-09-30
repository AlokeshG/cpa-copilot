import "server-only";

import { createGoogleGenerativeAI } from "@ai-sdk/google";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not configured.");
}

const google = createGoogleGenerativeAI({
  apiKey,
});

export const DEFAULT_MODEL = "gemini-3.5-flash-lite";

export const copilotModel = google(DEFAULT_MODEL);