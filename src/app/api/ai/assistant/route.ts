import { NextResponse } from "next/server";
import { getApprovedListings, getListingById } from "@/lib/listings";
import { enforceRateLimit, rateLimitedResponse } from "@/lib/api/rate-limit-response";
import { chatCompletion, isAiConfigured } from "@/lib/ai/openai";
import {
  analyzeListingQuality,
  buildAreaStats,
  listingToAiContext,
  listingsToMatchContext,
  scoreListingMatch,
} from "@/lib/ai/listing-context";
import {
  ASSISTANT_SYSTEM_RULES,
  buildContextualFallbackReply,
  filterListingsByPrefs,
  parseQueryIntent,
  sortListingsForIntent,
} from "@/lib/ai/assistant-prompt";
import { getListingPublicId } from "@/lib/utils";
import type { ListingWithImages } from "@/lib/types";

type AssistantRequest = {
  message?: string;
  history?: { role: "user" | "assistant"; content: string }[];
  context?: {
    page?: string;
    listingId?: string;
    compareListingIds?: string[];
    ownerListingId?: string;
  };
};

function resolveSearchPool(
  allListings: ListingWithImages[],
  intent: ReturnType<typeof parseQueryIntent>
) {
  let pool = filterListingsByPrefs(allListings, intent.prefs);
  if (pool.length === 0 && intent.prefs.city) {
    pool = allListings.filter((l) =>
      l.city.toLowerCase().includes(intent.prefs.city!.toLowerCase())
    );
  }
  if (pool.length === 0) pool = allListings;

  pool = sortListingsForIntent(pool, intent.sortBy);

  const ranked = pool
    .map((listing) => ({ listing, score: scoreListingMatch(listing, intent.prefs) }))
    .sort((a, b) => {
      if (intent.sortBy === "price_asc") {
        return a.listing.price_monthly - b.listing.price_monthly;
      }
      if (b.score !== a.score) return b.score - a.score;
      return 0;
    });

  const limit = intent.pickOne ? 1 : 5;
  return ranked.slice(0, limit);
}

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "ai-assistant", 25, 60_000);
  if (!limited.ok) return rateLimitedResponse(limited);

  try {
    const body = (await request.json()) as AssistantRequest;
    const message = body.message?.trim();

    if (!message) {
      return NextResponse.json({ error: "Missing message" }, { status: 400 });
    }

    const history = (body.history ?? []).slice(-10);
    const intent = parseQueryIntent(message, history);
    const allListings = await getApprovedListings({}, 150);
    const searchResults = resolveSearchPool(allListings, intent);

    let focusListing: ListingWithImages | null = null;
    let focusBlock = "";
    const listingId = body.context?.listingId;
    if (listingId) {
      focusListing = (await getListingById(listingId)) ?? null;
      if (focusListing) {
        focusBlock = `\n\nΤΡΕΧΟΝ LISTING (σελίδα λεπτομέρειας):\n${listingToAiContext(focusListing)}`;
      }
    }

    const compareIds = body.context?.compareListingIds ?? [];
    if (compareIds.length > 0) {
      const compared = await Promise.all(compareIds.map((id) => getListingById(id)));
      focusBlock += `\n\nLISTINGS ΓΙΑ ΣΥΓΚΡΙΣΗ:\n${compared
        .filter(Boolean)
        .map((l) => listingToAiContext(l!))
        .join("\n---\n")}`;
    }

    const ownerId = body.context?.ownerListingId;
    if (ownerId) {
      const ownerListing = await getListingById(ownerId);
      if (ownerListing) {
        focusBlock += `\n\nΑΓΓΕΛΙΑ ΙΔΙΟΚΤΗΤΗ (ποιότητα):\n${listingToAiContext(ownerListing)}\n${analyzeListingQuality(ownerListing)}`;
      }
    }

    const matches = searchResults.map(({ listing, score }) => ({
      publicId: getListingPublicId(listing),
      title: listing.title,
      city: listing.city,
      area: listing.area,
      price: listing.price_monthly,
      bedrooms: listing.bedrooms,
      hasParking: listing.has_parking,
      petsAllowed: listing.pets_allowed,
      score,
    }));

    const fallbackReply = buildContextualFallbackReply(message, intent, allListings, {
      focusListing,
      page: body.context?.page,
    });

    if (intent.offTopic) {
      return NextResponse.json({ reply: fallbackReply, matches: [] });
    }

    const conversationSummary =
      history.length > 0
        ? `\n\nΙΣΤΟΡΙΚΟ ΣΥΝΟΜΙΛΙΑΣ (τελευταία μηνύματα):\n${history
            .map((m) => `${m.role}: ${m.content}`)
            .join("\n")}`
        : "";

    const dataBlock = `
ΣΤΑΤΙΣΤΙΚΑ ΠΕΡΙΟΧΩΝ (από πραγματικά listings):
${buildAreaStats(allListings) || "Δεν υπάρχουν διαθέσιμες πληροφορίες."}

ΚΑΤΑΛΟΓΟΣ LISTINGS (σχετικά με την ΤΡΕΧΟΥΣΑ ερώτηση):
${listingsToMatchContext(searchResults.map((r) => r.listing)) || "Κανένα listing."}
${focusBlock}
${conversationSummary}

ΤΕΛΕΥΤΑΙΑ ΕΡΩΤΗΣΗ ΧΡΗΣΤΗ: ${message}
`;

    if (!isAiConfigured()) {
      return NextResponse.json({ reply: fallbackReply, matches });
    }

    try {
      const reply = await chatCompletion([
        {
          role: "system",
          content: `${ASSISTANT_SYSTEM_RULES}\n\nΔΕΔΟΜΕΝΑ ΠΛΑΤΦΟΡΜΑΣ:${dataBlock}`,
        },
        ...history.map((m) => ({ role: m.role, content: m.content })),
        { role: "user", content: message },
      ]);

      return NextResponse.json({
        reply: reply?.trim() || fallbackReply,
        matches,
      });
    } catch (aiError) {
      console.error("[ai/assistant] OpenAI failed, using fallback:", aiError);
      return NextResponse.json({ reply: fallbackReply, matches });
    }
  } catch (error) {
    console.error("[ai/assistant]", error);
    return NextResponse.json(
      { error: "Δεν ήταν δυνατή η απάντηση. Δοκίμασε ξανά." },
      { status: 500 }
    );
  }
}
