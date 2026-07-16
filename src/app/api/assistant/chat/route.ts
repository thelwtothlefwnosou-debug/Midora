import { NextResponse } from "next/server";
import { enforceRateLimit, rateLimitedResponse } from "@/lib/api/rate-limit-response";
import { generateAssistantReply } from "@/lib/assistant/responder";
import {
  resolvePageType,
  type AssistantContext,
  type AssistantUserRole,
} from "@/lib/assistant/support-context";
import { getCurrentProfile } from "@/lib/supabase/server";
import { resolveListingWorkspaceTab } from "@/lib/listing-workspace-nav";

type ChatRequest = {
  messages?: { role: "user" | "assistant"; content: string }[];
  context?: Partial<AssistantContext> & {
    page?: string;
    ownerListingId?: string;
  };
  conversationId?: string;
};

function resolveUserRole(
  profile: Awaited<ReturnType<typeof getCurrentProfile>>,
  pathname: string
): AssistantUserRole {
  if (!profile) return "guest";
  if (profile.role === "admin") return "admin";
  if (pathname.startsWith("/dashboard")) return "owner";
  return "logged_in_user";
}

function buildContext(
  body: ChatRequest,
  profile: Awaited<ReturnType<typeof getCurrentProfile>>
): AssistantContext {
  const route = body.context?.currentRoute ?? body.context?.page ?? "/";
  const listingMatch = route.match(/\/listings\/([^/]+)/);
  const ownerMatch = route.match(/\/dashboard\/listings\/([^/]+)/);
  const listingId =
    body.context?.listingId ??
    (ownerMatch && !["new", "edit", "photos", "pay"].includes(ownerMatch[1])
      ? ownerMatch[1]
      : listingMatch && listingMatch[1] !== "new"
        ? listingMatch[1]
        : body.context?.ownerListingId);

  const activeTab =
    body.context?.activeTab ??
    (listingId && route.includes("/dashboard/listings/")
      ? resolveListingWorkspaceTab(route, listingId)
      : undefined);

  const rentalType = body.context?.searchParams?.rentalType;
  const rentalMode =
    body.context?.rentalMode ??
    (rentalType === "short_term" || rentalType === "monthly" ? rentalType : "unknown");

  return {
    currentRoute: route,
    pageType: body.context?.pageType ?? resolvePageType(route),
    userRole: body.context?.userRole ?? resolveUserRole(profile, route),
    rentalMode,
    listingId,
    listingTitle: body.context?.listingTitle,
    listingStatus: body.context?.listingStatus,
    activeTab,
    searchParams: body.context?.searchParams,
    selectedDates: body.context?.selectedDates,
    guests: body.context?.guests,
    pets: body.context?.pets,
    browserUrl: body.context?.browserUrl,
    locale: body.context?.locale ?? "el",
  };
}

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "assistant-chat", 30, 60_000);
  if (!limited.ok) return rateLimitedResponse(limited);

  try {
    const body = (await request.json()) as ChatRequest;
    const messages = body.messages ?? [];
    const lastUser = [...messages].reverse().find((m) => m.role === "user");

    if (!lastUser?.content?.trim()) {
      return NextResponse.json({ error: "Missing message" }, { status: 400 });
    }

    const profile = await getCurrentProfile();
    const context = buildContext(body, profile);
    const history = messages.slice(0, -1);

    const result = await generateAssistantReply(
      lastUser.content.trim(),
      history,
      context
    );

    return NextResponse.json({
      answer: result.answer,
      actions: result.actions,
      category: result.category,
      confidence: result.confidence,
      needsEscalation: result.needsEscalation,
      sources: result.sources,
      conversationId: body.conversationId ?? null,
    });
  } catch (error) {
    console.error("[assistant/chat]", error);
    return NextResponse.json(
      {
        answer:
          "Δεν μπόρεσα να απαντήσω αυτή τη στιγμή. Δοκίμασε ξανά ή στείλε μήνυμα στην υποστήριξη.",
        error: true,
      },
      { status: 500 }
    );
  }
}
