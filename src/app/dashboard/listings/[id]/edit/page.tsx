import { requireDashboardContext } from "@/lib/dashboard-context";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { EditListingForm } from "./EditListingForm";
import { getOwnerUnavailablePeriods } from "@/lib/unavailable-periods-db";
import { getListingPriceRules } from "@/lib/listing-price-rules";
import { getOwnerSleepingArrangements } from "@/lib/listing-sleeping-arrangements";
import { getOwnerListingExternalLinks } from "@/lib/listing-external-links-db";
import { getOwnerListingAmenities } from "@/lib/listing-amenities";

export default async function EditListingPage({
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
    .select("*, listing_images(*)")
    .eq("id", id)
    .eq("user_id", profile.id)
    .single();

  if (!listing) notFound();

  const unavailablePeriods = await getOwnerUnavailablePeriods(id, profile.id);
  const priceRulesResult = await getListingPriceRules(id);
  const priceRules = "rules" in priceRulesResult ? priceRulesResult.rules ?? [] : [];
  const sleepingArrangements = await getOwnerSleepingArrangements(id);
  const externalLinks = await getOwnerListingExternalLinks(id, profile.id);
  const amenities = await getOwnerListingAmenities(id);

  return (
    <EditListingForm
      listing={listing}
      profile={profile}
      email={email}
      unavailablePeriods={unavailablePeriods}
      priceRules={priceRules}
      sleepingArrangements={sleepingArrangements}
      externalLinks={externalLinks}
      amenities={amenities}
    />
  );
}
