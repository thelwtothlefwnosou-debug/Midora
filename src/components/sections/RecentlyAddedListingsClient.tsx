"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRight, Search } from "lucide-react";
import { ListingCard } from "@/components/listings/ListingCard";
import { RentalModeToggle } from "@/components/listings/RentalModeToggle";
import { HomeSectionHeader } from "@/components/sections/HomeSectionHeader";
import type { ListingBadge } from "@/lib/listing-badges";
import type { ListingUnavailablePeriod } from "@/lib/unavailable-periods";
import type { ListingWithImages } from "@/lib/types";
import type { MvpPublicRentalType } from "@/lib/rental-types";

type Props = {
  shortTerm: ListingWithImages[];
  monthly: ListingWithImages[];
  favoriteIds: string[];
  badgesByListingId: Record<string, ListingBadge[]>;
  periodsByListingId: Record<string, Pick<ListingUnavailablePeriod, "start_date" | "end_date">[]>;
};

function listingsHref(mode: MvpPublicRentalType) {
  return `/listings?rentalType=${mode}`;
}

export function RecentlyAddedListingsClient({
  shortTerm,
  monthly,
  favoriteIds,
  badgesByListingId,
  periodsByListingId,
}: Props) {
  const t = useTranslations("Home");
  const [mode, setMode] = useState<MvpPublicRentalType>("short_term");

  const favoriteSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);
  const listings = mode === "short_term" ? shortTerm : monthly;
  const seeAllHref = listingsHref(mode);
  const emptyMessage =
    mode === "short_term" ? t("featuredEmptyShort") : t("featuredEmptyMonthly");

  return (
    <section id="listings" className="home-section home-section--editorial home-bg-sand">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <HomeSectionHeader
          title={t("featuredTitle")}
          subtitle={t("featuredSubtitlePlain")}
          action={
            <div className="hidden sm:block">
              <Link href={seeAllHref} className="home-btn-secondary shrink-0">
                {t("featuredCta")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          }
        />

        <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
          <RentalModeToggle
            variant="standalone"
            value={mode}
            onChange={(next) => {
              if (next === "short_term" || next === "monthly") setMode(next);
            }}
          />
        </div>

        {listings.length === 0 ? (
          <div className="rounded-[1.35rem] bg-white/70 px-6 py-14 text-center ring-1 ring-border/60">
            <p className="font-display text-lg font-semibold text-charcoal">{emptyMessage}</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href={seeAllHref} className="home-btn-primary">
                <Search className="h-4 w-4" />
                {t("featuredCta")}
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="grid auto-rows-fr gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
              {listings.map((listing, i) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  index={i}
                  variant="home"
                  favorited={favoriteSet.has(listing.id)}
                  badges={badgesByListingId[listing.id]}
                  unavailablePeriods={periodsByListingId[listing.id] ?? []}
                />
              ))}
            </div>
            <div className="mt-8 flex justify-center sm:hidden">
              <Link href={seeAllHref} className="home-btn-secondary">
                {t("featuredCta")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
