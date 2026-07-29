import { notFound, redirect } from "next/navigation";
import { requireDashboardContext } from "@/lib/dashboard-context";
import { createClient } from "@/lib/supabase/server";
import { resolveSupportsShortTerm } from "@/lib/listing-rental-modes";
import { MonthlyListingPricingPanel } from "@/components/dashboard/listing-workspace/MonthlyListingPricingPanel";

export default async function ListingPricingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { profile } = await requireDashboardContext("/dashboard/listings");
  const { id } = await params;
  const supabase = await createClient();
  if (!supabase) notFound();

  const { data: listing } = await supabase
    .from("listings")
    .select("*")
    .eq("id", id)
    .eq("user_id", profile.id)
    .single();

  if (!listing) notFound();

  if (resolveSupportsShortTerm(listing)) {
    // Short-term pricing is managed in the calendar hub. Old /pricing bookmarks
    // land on availability (shown as “Ημερολόγιο & τιμές”); the pricing tab is hidden.
    redirect(`/dashboard/listings/${id}/availability`);
  }

  return <MonthlyListingPricingPanel listing={listing} />;
}
