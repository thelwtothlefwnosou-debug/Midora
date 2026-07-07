import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET || !sig) {
    return NextResponse.json({ error: "Not configured" }, { status: 400 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const listingId = session.metadata?.listingId;

    if (listingId) {
      const supabase = createServiceClient();
      if (!supabase) {
        return NextResponse.json({ error: "No db" }, { status: 500 });
      }

      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1);

      const { error: listingError } = await supabase
        .from("listings")
        .update({ status: "pending", expires_at: expiresAt.toISOString() })
        .eq("id", listingId);

      const { error: paymentError } = await supabase
        .from("payments")
        .update({ status: "completed" })
        .eq("stripe_session_id", session.id);

      if (listingError || paymentError) {
        console.error("[stripe webhook]", listingError?.message, paymentError?.message);
        return NextResponse.json({ error: "DB update failed" }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ received: true });
}
