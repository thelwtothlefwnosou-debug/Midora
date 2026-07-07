import Link from "next/link";
import { GitCompareArrows } from "lucide-react";
import { AccountShell } from "@/components/account/AccountShell";
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";
import { FavoritesListingCard } from "@/components/favorites/FavoritesListingCard";
import { requireDashboardContext } from "@/lib/dashboard-context";
import { getFavoriteListings } from "@/lib/user-features";
import { getListingPublicId } from "@/lib/utils";
import { Heart } from "lucide-react";

export default async function DashboardFavoritesPage() {
  const { profile, email } = await requireDashboardContext("/dashboard/favorites");
  const listings = await getFavoriteListings();
  const compareIds = listings
    .slice(0, 4)
    .map((l) => getListingPublicId(l))
    .join(",");

  return (
    <AccountShell
      profile={profile}
      email={email}
      active="favorites"
      title="Αγαπημένα"
      subtitle="Τα ακίνητα που αποθήκευσες για να τα δεις αργότερα"
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {listings.length === 0
            ? "Κανένα αποθηκευμένο ακίνητο"
            : `${listings.length} ${listings.length === 1 ? "αγαπημένη αγγελία" : "αγαπημένες αγγελίες"}`}
        </p>
        {listings.length >= 2 && (
          <Link
            href={`/favorites/compare?ids=${compareIds}`}
            className="flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 py-2 text-sm font-medium text-gold hover:bg-gold/20"
          >
            <GitCompareArrows className="h-4 w-4" />
            Σύγκριση ({Math.min(listings.length, 4)})
          </Link>
        )}
      </div>

      {listings.length === 0 ? (
        <DashboardEmptyState
          icon={Heart}
          title="Δεν έχεις αποθηκεύσει ακόμα ακίνητα"
          text="Πάτα την καρδιά σε ένα ακίνητο για να το κρατήσεις και να το δεις αργότερα."
          actionLabel="Αναζήτηση ακινήτων"
          actionHref="/listings"
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {listings.map((listing) => (
            <FavoritesListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </AccountShell>
  );
}
