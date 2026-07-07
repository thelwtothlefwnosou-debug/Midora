import { NextResponse } from "next/server";
import { incrementStoredListingView } from "@/lib/listing-views-storage";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { enforceRateLimit, rateLimitedResponse } from "@/lib/api/rate-limit-response";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const limited = enforceRateLimit(request, `listing-view:${id}`, 40, 60_000);
  if (!limited.ok) return rateLimitedResponse(limited);

  if (!id?.trim() || !isSupabaseConfigured()) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  const { error } = await supabase.rpc("increment_listing_view", {
    p_listing_id: id,
  });

  if (error) {
    // Column/RPC missing — store in Supabase Storage until migration runs
    if (
      error.message.includes("increment_listing_view") ||
      error.message.includes("view_count")
    ) {
      const stored = await incrementStoredListingView(id);
      return NextResponse.json({ ok: stored, stored: true });
    }
    console.error("[listing-view]", error.message);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
