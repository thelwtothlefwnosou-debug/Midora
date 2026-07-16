import { NextResponse } from "next/server";
import { generateAssistantReply } from "@/lib/assistant/responder";
import type { AssistantChatMessage } from "@/lib/assistant/responder";
import { enforceRateLimit, rateLimitedResponse } from "@/lib/api/rate-limit-response";
import { resolvePageType } from "@/lib/assistant/support-context";
import { getCurrentProfile } from "@/lib/supabase/server";

/** @deprecated Use POST /api/assistant/chat — kept for backward compatibility. */
export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "ai-assistant", 25, 60_000);
  if (!limited.ok) return rateLimitedResponse(limited);

  try {
    const body = (await request.json()) as {
      message?: string;
      history?: AssistantChatMessage[];
      context?: { page?: string; listingId?: string; ownerListingId?: string };
    };

    const message = body.message?.trim();
    if (!message) {
      return NextResponse.json({ error: "Missing message" }, { status: 400 });
    }

    const route = body.context?.page ?? "/";
    const profile = await getCurrentProfile();

    const result = await generateAssistantReply(message, body.history ?? [], {
      currentRoute: route,
      pageType: resolvePageType(route),
      userRole: profile ? "logged_in_user" : "guest",
      listingId: body.context?.listingId ?? body.context?.ownerListingId,
      locale: "el",
    });

    return NextResponse.json({
      reply: result.answer,
      matches: [],
      category: result.category,
      actions: result.actions,
    });
  } catch (error) {
    console.error("[ai/assistant]", error);
    return NextResponse.json(
      { error: "Δεν ήταν δυνατή η απάντηση. Δοκίμασε ξανά." },
      { status: 500 }
    );
  }
}
