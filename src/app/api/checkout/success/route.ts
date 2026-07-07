import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const listingId = request.nextUrl.searchParams.get("listingId");
  if (!listingId) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { data: listing } = await supabase
    .from("listings")
    .select("id, user_id")
    .eq("id", listingId)
    .single();

  if (!listing || listing.user_id !== user.id) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + 1);

  const { error: listingError } = await supabase
    .from("listings")
    .update({ status: "pending", expires_at: expiresAt.toISOString() })
    .eq("id", listingId)
    .eq("user_id", user.id);

  const { error: paymentError } = await supabase
    .from("payments")
    .update({ status: "completed" })
    .eq("listing_id", listingId)
    .eq("user_id", user.id);

  if (listingError || paymentError) {
    console.error("[checkout success]", listingError?.message, paymentError?.message);
    return NextResponse.redirect(
      new URL(`/dashboard/listings/${listingId}/pay?error=db`, request.url)
    );
  }

  return NextResponse.redirect(new URL("/dashboard?submitted=true", request.url));
}
