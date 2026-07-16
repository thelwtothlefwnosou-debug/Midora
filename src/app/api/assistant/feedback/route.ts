import { NextResponse } from "next/server";
import { enforceRateLimit, rateLimitedResponse } from "@/lib/api/rate-limit-response";

type FeedbackRequest = {
  conversationId?: string;
  messageId?: string;
  helpful?: boolean;
  comment?: string;
  question?: string;
  category?: string;
  route?: string;
};

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "assistant-feedback", 20, 60_000);
  if (!limited.ok) return rateLimitedResponse(limited);

  try {
    const body = (await request.json()) as FeedbackRequest;

    if (body.helpful === undefined) {
      return NextResponse.json({ error: "Missing helpful flag" }, { status: 400 });
    }

    const entry = {
      type: "assistant_feedback",
      helpful: body.helpful,
      comment: body.comment?.trim() || null,
      question: body.question?.trim() || null,
      category: body.category || null,
      route: body.route || null,
      conversationId: body.conversationId || null,
      timestamp: new Date().toISOString(),
    };

    console.info("[assistant/feedback]", JSON.stringify(entry));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[assistant/feedback]", error);
    return NextResponse.json({ error: "Failed to record feedback" }, { status: 500 });
  }
}
