import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const listingId = request.nextUrl.searchParams.get("listingId");
  if (!listingId) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.redirect(
      new URL(`/dashboard/listings/${listingId}/pay?error=stripe`, request.url)
    );
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const t = await getTranslations("Owner.checkout");

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "eur",
          product_data: {
            name: t("listingPublishProduct"),
          },
          unit_amount: 100,
        },
        quantity: 1,
      },
    ],
    metadata: { listingId, userId: user.id },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/checkout/success?listingId=${listingId}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/listings/${listingId}/pay`,
  });

  await supabase.from("payments").insert({
    listing_id: listingId,
    user_id: user.id,
    stripe_session_id: session.id,
    status: "pending",
  });

  return NextResponse.redirect(session.url!);
}
