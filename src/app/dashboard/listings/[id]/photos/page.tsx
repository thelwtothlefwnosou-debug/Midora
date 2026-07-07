import { UploadPhotosForm } from "./UploadPhotosForm";
import { createClient } from "@/lib/supabase/server";
import { requireDashboardContext } from "@/lib/dashboard-context";
import { redirect, notFound } from "next/navigation";

export default async function UploadPhotosPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { profile, email } = await requireDashboardContext("/dashboard/listings");
  const { id } = await params;
  const supabase = await createClient();
  if (!supabase) redirect("/login");

  const { data: listing } = await supabase
    .from("listings")
    .select("user_id, listing_images(*)")
    .eq("id", id)
    .single();

  if (!listing || listing.user_id !== profile.id) notFound();

  const images = (listing.listing_images ?? []).sort(
    (a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order
  );

  const isFree = process.env.NEXT_PUBLIC_FREE_LISTINGS === "true";

  return (
    <UploadPhotosForm
      listingId={id}
      existingImages={images}
      isFree={isFree}
      profile={profile}
      email={email}
    />
  );
}
