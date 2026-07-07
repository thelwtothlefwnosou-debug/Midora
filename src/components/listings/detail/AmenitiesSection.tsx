"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import type { ListingPublicDetail } from "@/lib/types";
import {
  amenityLabel,
  amenitiesByDisplayCategory,
  prioritizeAmenityKeys,
} from "@/lib/amenities-catalog";
import { amenityIconForKey } from "@/lib/amenity-icons";
import { Sofa, Zap } from "lucide-react";

const PREVIEW_MAX = 8;
const PREVIEW_MIN = 6;

type ExtraAmenity = {
  id: string;
  label: string;
  icon: typeof Sofa;
};

type Props = {
  listing: ListingPublicDetail;
  rentalMode?: "short_term" | "monthly";
};

function buildMonthlyExtras(listing: ListingPublicDetail): ExtraAmenity[] {
  const extras: ExtraAmenity[] = [];
  if (listing.furnished) {
    extras.push({ id: "furnished", label: "Επιπλωμένο", icon: Sofa });
  }
  if (listing.utilities_included) {
    extras.push({ id: "utilities", label: "Λογαριασμοί περιλαμβάνονται", icon: Zap });
  }
  return extras;
}

export function AmenitiesSection({ listing, rentalMode = "short_term" }: Props) {
  const amenityKeys = listing.amenities.map((a) => a.amenity_key);
  const sortedKeys = useMemo(
    () => prioritizeAmenityKeys(amenityKeys, rentalMode),
    [amenityKeys, rentalMode]
  );

  const monthlyExtras = rentalMode === "monthly" ? buildMonthlyExtras(listing) : [];
  const extraLabels = new Set(monthlyExtras.map((e) => e.label.toLowerCase()));

  const filteredKeys = sortedKeys.filter(
    (key) => !extraLabels.has(amenityLabel(key).toLowerCase())
  );

  const allCount = filteredKeys.length + monthlyExtras.length;
  if (!allCount) return null;

  const [open, setOpen] = useState(false);

  const previewItems = [
    ...monthlyExtras.map((extra) => ({ kind: "extra" as const, extra })),
    ...filteredKeys.map((key) => ({ kind: "key" as const, key })),
  ];
  const shownItems =
    allCount <= PREVIEW_MIN ? previewItems : previewItems.slice(0, PREVIEW_MAX);
  const showAllButton = allCount > shownItems.length;
  const modalGroups = amenitiesByDisplayCategory(filteredKeys);

  return (
    <section id="amenities" className="listing-section scroll-mt-32">
      <h2 className="listing-section-title">Παροχές</h2>
      <p className="mt-2 text-sm text-charcoal/65">Όσα προσφέρει αυτό το ακίνητο</p>

      <ul className="mt-5 grid gap-1 sm:grid-cols-2 sm:gap-x-6">
        {shownItems.map((item) => {
          if (item.kind === "extra") {
            const Icon = item.extra.icon;
            return (
              <li
                key={item.extra.id}
                className="flex min-h-10 items-center gap-3 py-1.5 text-[15px] font-medium text-charcoal/90"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center text-gold">
                  <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
                </span>
                {item.extra.label}
              </li>
            );
          }
          const label = amenityLabel(item.key);
          const Icon = amenityIconForKey(item.key);
          return (
            <li
              key={item.key}
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

      {showAllButton && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-5 text-sm font-semibold text-gold-dark transition-colors hover:text-gold"
        >
          Δες όλες τις παροχές
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-[180] flex items-end justify-center bg-charcoal/50 p-4 sm:items-center">
          <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-display text-lg font-semibold text-charcoal">Παροχές</h3>
                <p className="mt-0.5 text-sm text-muted">Όσα προσφέρει αυτό το ακίνητο</p>
              </div>
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
              {monthlyExtras.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                    Μηνιαία / μεσοπρόθεσμη
                  </p>
                  <ul className="mt-3 space-y-2">
                    {monthlyExtras.map((extra) => {
                      const Icon = extra.icon;
                      return (
                        <li
                          key={extra.id}
                          className="flex min-h-10 items-center gap-3 text-sm font-medium text-charcoal"
                        >
                          <Icon className="h-4 w-4 shrink-0 text-gold" strokeWidth={1.75} />
                          {extra.label}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

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

            {(modalGroups.some((g) => g.id === "safety" || g.id === "accessibility") ||
              filteredKeys.some((k) => k.startsWith("step_") || k.startsWith("accessible_"))) && (
              <p className="mt-5 text-xs leading-relaxed text-muted">
                Οι παροχές ασφάλειας και προσβασιμότητας δηλώνονται από τον ιδιοκτήτη και δεν
                αποτελούν επίσημη πιστοποίηση.
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
