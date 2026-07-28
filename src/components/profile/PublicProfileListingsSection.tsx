"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import type { PublicProfileListingItem } from "@/lib/profile-public-queries";
import { PublicProfileListingCard } from "@/components/profile/PublicProfileListingCard";
import { PublicProfileAllListingsModal } from "@/components/profile/PublicProfileAllListingsModal";

const PREVIEW_LIMIT = 6;

type Props = {
  displayName: string;
  ownedListings: PublicProfileListingItem[];
  cohostedListings: PublicProfileListingItem[];
  interestFrom?: string;
  interestTo?: string;
  durationMonths?: number;
  rentalTypeFilter?: string | null;
};

export function PublicProfileListingsSection({
  displayName,
  ownedListings,
  cohostedListings,
  interestFrom,
  interestTo,
  durationMonths,
  rentalTypeFilter,
}: Props) {
  const t = useTranslations("Profile.public");
  const [modalOpen, setModalOpen] = useState(false);
  const allListings = useMemo(
    () => [...ownedListings, ...cohostedListings],
    [ownedListings, cohostedListings]
  );

  if (!allListings.length) {
    return (
      <section className="mt-10 rounded-2xl border border-dashed border-border bg-white px-6 py-10 text-center">
        <p className="text-sm text-muted">{t("listingsEmpty")}</p>
      </section>
    );
  }

  const hasOwned = ownedListings.length > 0;
  const hasCohosted = cohostedListings.length > 0;
  const title = hasOwned && hasCohosted
    ? t("listingsTitleBoth", { name: displayName })
    : hasCohosted
      ? t("listingsTitleCohosted")
      : t("listingsTitleOwned", { name: displayName });

  const preview = allListings.slice(0, PREVIEW_LIMIT);
  const showViewAll = allListings.length > PREVIEW_LIMIT;

  return (
    <section className="mt-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold text-charcoal">{title}</h2>
          {hasOwned && hasCohosted ? (
            <p className="mt-1 text-sm text-muted">
              {t("listingsSummary", {
                ownedCount: ownedListings.length,
                cohostedCount: cohostedListings.length,
              })}
            </p>
          ) : null}
        </div>
        {showViewAll ? (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="text-sm font-medium text-gold-dark hover:underline"
          >
            {t("viewAllListings")}
          </button>
        ) : null}
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {preview.map((listing) => (
          <PublicProfileListingCard
            key={`${listing.id}-${listing.profileRole}`}
            listing={listing}
            interestFrom={interestFrom}
            interestTo={interestTo}
            durationMonths={durationMonths}
            rentalTypeFilter={rentalTypeFilter}
          />
        ))}
      </div>

      <PublicProfileAllListingsModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        displayName={displayName}
        ownedListings={ownedListings}
        cohostedListings={cohostedListings}
        interestFrom={interestFrom}
        interestTo={interestTo}
        durationMonths={durationMonths}
        rentalTypeFilter={rentalTypeFilter}
      />
    </section>
  );
}
