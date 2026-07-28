import Link from "next/link";
import { GitCompareArrows, Heart } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { AccountShell } from "@/components/account/AccountShell";
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";
import { FavoritesListingCard } from "@/components/favorites/FavoritesListingCard";
import { requireDashboardContext } from "@/lib/dashboard-context";
import { getFavoriteListings } from "@/lib/user-features";
import { getListingPublicId } from "@/lib/utils";

export default async function DashboardFavoritesPage() {
  const { profile, email } = await requireDashboardContext("/dashboard/favorites");
  const listings = await getFavoriteListings();
  const t = await getTranslations("Owner.favoritesPage");
  const compareIds = listings
    .slice(0, 4)
    .map((l) => getListingPublicId(l))
    .join(",");

  return (
    <AccountShell
      profile={profile}
      email={email}
      active="favorites"
      title={t("title")}
      subtitle={t("subtitle")}
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {listings.length === 0
            ? t("noneSaved")
            : listings.length === 1
              ? t("oneFavorite")
              : t("nFavorites", { count: listings.length })}
        </p>
        {listings.length >= 2 && (
          <Link
            href={`/favorites/compare?ids=${compareIds}`}
            className="flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 py-2 text-sm font-medium text-gold hover:bg-gold/20"
          >
            <GitCompareArrows className="h-4 w-4" />
            {t("compare", { count: Math.min(listings.length, 4) })}
          </Link>
        )}
      </div>

      {listings.length === 0 ? (
        <DashboardEmptyState
          icon={Heart}
          title={t("emptyTitle")}
          text={t("emptyText")}
          actionLabel={t("searchProperties")}
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
