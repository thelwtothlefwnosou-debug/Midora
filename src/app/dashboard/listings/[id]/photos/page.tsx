import { UploadPhotosForm } from "./UploadPhotosForm";
import { createClient } from "@/lib/supabase/server";
import { requireDashboardContext } from "@/lib/dashboard-context";
import { getOwnerSleepingArrangements } from "@/lib/listing-sleeping-arrangements";
import { notFound, redirect } from "next/navigation";

export default async function UploadPhotosPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { profile } = await requireDashboardContext("/dashboard/listings");
  const { id } = await params;
  const supabase = await createClient();
  if (!supabase) redirect("/login");

  const { data: listing } = await supabase
    .from("listings")
    .select("*, listing_images(*)")
    .eq("id", id)
    .eq("user_id", profile.id)
    .single();

  if (!listing) notFound();

  const images = (listing.listing_images ?? []).sort(
    (a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order
  );
  const sleepingArrangements = await getOwnerSleepingArrangements(id);

  return (
    <UploadPhotosForm
      listing={listing}
      existingImages={images}
      sleepingArrangements={sleepingArrangements}
    />
  );
}
