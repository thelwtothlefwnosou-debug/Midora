"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import type { ListingPublicDetail } from "@/lib/types";
import {
  amenityLabel,
  amenitiesByCategoryGroups,
  normalizeAmenityKey,
  prioritizeAmenityKeys,
} from "@/lib/amenities-catalog";
import { amenityIconForKey } from "@/lib/amenity-icons";

const PREVIEW_MAX = 10;

function formatShowAllAmenitiesLabel(count: number): string {
  if (count <= 1) return "Εμφάνιση όλων των παροχών";
  return `Εμφάνιση όλων των ${count} παροχών`;
}

type Props = {
  listing: ListingPublicDetail;
  rentalMode?: "short_term" | "monthly";
};

export function AmenitiesSection({ listing, rentalMode = "short_term" }: Props) {
  const amenityKeys = useMemo(
    () =>
      prioritizeAmenityKeys(
        listing.amenities.map((a) => normalizeAmenityKey(a.amenity_key)),
        rentalMode
      ),
    [listing.amenities, rentalMode]
  );

  if (!amenityKeys.length) return null;

  const [open, setOpen] = useState(false);
  const previewKeys = amenityKeys.slice(0, PREVIEW_MAX);
  const showAllButton = amenityKeys.length > previewKeys.length;
  const modalGroups = amenitiesByCategoryGroups(amenityKeys);
  const hasSafetyOrAccessibility = modalGroups.some(
    (group) => group.id === "safety" || group.id === "accessibility"
  );

  return (
    <section id="amenities" className="listing-section scroll-mt-32">
      <h2 className="listing-section-title">Τι προσφέρει ο χώρος</h2>

      <ul className="mt-5 grid gap-1 sm:grid-cols-2 sm:gap-x-6">
        {previewKeys.map((key) => {
          const label = amenityLabel(key);
          const Icon = amenityIconForKey(key);
          return (
            <li
              key={key}
              className="flex min-h-10 items-center gap-3 py-1.5 text-[15px] font-medium text-charcoal/90"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center text-gold">
                <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
              </span>
              {label}
            </li>
          );
        })}
      </ul>

      {showAllButton ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-5 w-full rounded-xl border border-charcoal/15 bg-charcoal/[0.03] px-4 py-3 text-sm font-semibold text-charcoal transition-colors hover:border-charcoal/25 hover:bg-charcoal/[0.05] sm:w-auto"
        >
          {formatShowAllAmenitiesLabel(amenityKeys.length)}
        </button>
      ) : null}

      {open ? (
        <div className="fixed inset-0 z-[180] flex items-end justify-center bg-charcoal/50 p-4 sm:items-center">
          <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-display text-lg font-semibold text-charcoal">
                Τι προσφέρει ο χώρος
              </h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-2 hover:bg-charcoal/5"
                aria-label="Κλείσιμο"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 space-y-6">
              {modalGroups.map((group) => (
                <div key={group.id}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                    {group.label}
                  </p>
                  <ul className="mt-3 space-y-2">
                    {group.keys.map((key) => {
                      const Icon = amenityIconForKey(key);
                      return (
                        <li
                          key={key}
                          className="flex min-h-10 items-center gap-3 text-sm font-medium text-charcoal"
                        >
                          <Icon className="h-4 w-4 shrink-0 text-gold" strokeWidth={1.75} />
                          {amenityLabel(key)}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>

            {hasSafetyOrAccessibility ? (
              <p className="mt-5 text-xs leading-relaxed text-muted">
                Οι παροχές ασφάλειας και προσβασιμότητας δηλώνονται από τον ιδιοκτήτη και δεν
                αποτελούν επίσημη πιστοποίηση.
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
