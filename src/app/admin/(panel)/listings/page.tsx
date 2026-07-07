import { Suspense } from "react";
import { AdminListingCard } from "@/components/admin/AdminListingCard";
import { AdminListingsFilters } from "@/components/admin/AdminListingsFilters";
import { getAdminAllListings } from "@/lib/admin/queries";

export default async function AdminListingsPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    rentalType?: string;
    search?: string;
    registry?: string;
    filter?: string;
    quick?: string;
  }>;
}) {
  const params = await searchParams;
  const listings = await getAdminAllListings({
    status: params.status,
    rentalType: params.rentalType,
    search: params.search,
    registry: params.registry as "with" | "without" | undefined,
    filter: params.filter as "location" | "incomplete" | undefined,
    quick: params.quick as
      | "needs_review"
      | "high_priority"
      | "no_photos"
      | "unverified_phone"
      | "with_reports"
      | "needs_changes"
      | undefined,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-charcoal">Αγγελίες</h1>
        <p className="mt-1 text-sm text-muted">{listings.length} αποτελέσματα</p>
      </div>

      <Suspense fallback={<div className="h-32 animate-pulse rounded-xl bg-sand/50" />}>
        <AdminListingsFilters params={params} />
      </Suspense>

      {listings.length === 0 ? (
        <div className="rounded-2xl border border-border bg-white p-12 text-center text-muted shadow-soft">
          Δεν βρέθηκαν αγγελίες με τα τρέχοντα φίλτρα.
        </div>
      ) : (
        <div className="space-y-3">
          {listings.map((listing) => (
            <AdminListingCard
              key={listing.id}
              listing={listing}
              supabaseUrl={supabaseUrl}
            />
          ))}
        </div>
      )}
    </div>
  );
}
