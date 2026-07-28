"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import type { ListingWithImages } from "@/lib/types";
import {
  completenessPercent,
  shortTermCompletenessItems,
} from "@/lib/listing-completeness";
import { MIN_LISTING_PHOTOS_FOR_REVIEW } from "@/lib/constants";
import { listingSupportsShortTerm } from "@/lib/rental-types";

export function ListingCompletenessCard({
  listing,
  photoCount,
  amenityCount = 0,
}: {
  listing: ListingWithImages;
  photoCount: number;
  amenityCount?: number;
}) {
  const t = useTranslations("Workspace.completenessCard");
  const tItems = useTranslations("Workspace.completenessItems");
  if (!listingSupportsShortTerm(listing)) return null;

  const items = shortTermCompletenessItems(listing, photoCount, amenityCount);
  const percent = completenessPercent(items);
  const missing = items.filter((i) => i.required && !i.done);

  function itemLabel(id: string): string {
    if (id === "photos") {
      return tItems("photos", { count: MIN_LISTING_PHOTOS_FOR_REVIEW });
    }
    try {
      return tItems(id as "basics");
    } catch {
      return id;
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-white p-5 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <p className="font-medium text-charcoal">{t("title")}</p>
        <span className="text-sm font-semibold text-gold">{percent}%</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-sand">
        <div
          className="h-full rounded-full bg-gold transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="mt-2 text-sm text-muted">{t("ready", { percent })}</p>
      {missing.length > 0 && (
        <ul className="mt-3 space-y-1 text-xs text-muted">
          {missing.slice(0, 4).map((m) => (
            <li key={m.id}>{t("missing", { label: itemLabel(m.id) })}</li>
          ))}
        </ul>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={`/dashboard/listings/${listing.id}/edit`}
          className="text-sm font-medium text-gold hover:underline"
        >
          {t("edit")}
        </Link>
        <Link
          href={`/dashboard/listings/${listing.id}/edit#availability-calendar`}
          className="text-sm font-medium text-charcoal/70 hover:underline"
        >
          {t("pricing")}
        </Link>
        <Link
          href={`/dashboard/listings/${listing.id}/photos`}
          className="text-sm font-medium text-charcoal/70 hover:underline"
        >
          {t("photos")}
        </Link>
      </div>
    </div>
  );
}
