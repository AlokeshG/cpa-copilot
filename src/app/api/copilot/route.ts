import { NextResponse } from "next/server";

import { runCopilot } from "@/agent/runtime/llm-cpa-agent";

interface CopilotRequest {
  message?: string;
  receiptId?: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CopilotRequest;

    if (!body.message || body.message.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Message is required.",
        },
        { status: 400 },
      );
    }

    if (body.message.length > 4000) {
      return NextResponse.json(
        {
          success: false,
          error: "Message is too long.",
        },
        { status: 400 },
      );
    }

    const result = await runCopilot({
      message: body.message,
      receiptId: body.receiptId,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Copilot API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "The Copilot request could not be completed.",
      },
      { status: 500 },
    );
  }
}