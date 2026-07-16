import { NextResponse } from "next/server";
import { enforceRateLimit, rateLimitedResponse } from "@/lib/api/rate-limit-response";
import { getCurrentProfile } from "@/lib/supabase/server";

type SupportRequest = {
  description?: string;
  email?: string;
  pageUrl?: string;
  listingId?: string;
  category?: string;
  conversationSummary?: string;
  priority?: "low" | "normal" | "high";
};

function generateTicketId(): string {
  const slice = crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
  return `MID-${slice}`;
}

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "assistant-support", 10, 60_000);
  if (!limited.ok) return rateLimitedResponse(limited);

  try {
    const body = (await request.json()) as SupportRequest;
    const description = body.description?.trim();

    if (!description || description.length < 10) {
      return NextResponse.json(
        { error: "Περιγράψε το πρόβλημα (τουλάχιστον 10 χαρακτήρες)." },
        { status: 400 }
      );
    }

    const profile = await getCurrentProfile();
    const ticketId = generateTicketId();
    const createdAt = new Date().toISOString();

    const ticket = {
      id: ticketId,
      userId: profile?.id ?? null,
      email: body.email?.trim() || profile?.email || null,
      role: profile?.role ?? "guest",
      pageUrl: body.pageUrl?.trim() || null,
      listingId: body.listingId?.trim() || null,
      category: body.category || "midora_troubleshooting",
      priority: body.priority || "normal",
      message: description,
      conversationSummary: body.conversationSummary?.trim() || null,
      createdAt,
      status: "open" as const,
    };

    console.info("[assistant/support] ticket created:", JSON.stringify(ticket));

    const supportEmail = process.env.SUPPORT_EMAIL?.trim();
    if (supportEmail) {
      console.info(
        `[assistant/support] would notify ${supportEmail} for ticket ${ticketId}`
      );
    }

    return NextResponse.json({
      ticketId,
      status: "open",
      message: "Το έστειλα στην υποστήριξη του Midora. Θα σε ενημερώσουμε μόλις υπάρχει απάντηση.",
      createdAt,
    });
  } catch (error) {
    console.error("[assistant/support]", error);
    return NextResponse.json(
      { error: "Δεν ήταν δυνατή η αποστολή. Δοκίμασε ξανά." },
      { status: 500 }
    );
  }
}
