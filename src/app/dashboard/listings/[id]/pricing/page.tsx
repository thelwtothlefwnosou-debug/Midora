import { notFound, redirect } from "next/navigation";
import { requireDashboardContext } from "@/lib/dashboard-context";
import { createClient } from "@/lib/supabase/server";
import { getListingPriceRules } from "@/lib/listing-price-rules";
import { resolveSupportsShortTerm } from "@/lib/listing-rental-modes";
import { ListingPricingForm } from "./ListingPricingForm";

export default async function ListingPricingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { profile, email } = await requireDashboardContext("/dashboard/listings");
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
    redirect(`/dashboard/listings/${id}/edit#availability-calendar`);
  }

  const rulesResult = await getListingPriceRules(id);
  const rules = "rules" in rulesResult ? rulesResult.rules ?? [] : [];

  return (
    <ListingPricingForm
      listing={listing}
      rules={rules}
      profile={profile}
      email={email}
    />
  );
}
