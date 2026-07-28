"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ListingPublicDetail } from "@/lib/types";
import {
  amenitiesByCategoryGroups,
  type AmenityCategory,
} from "@/lib/amenities-catalog";
import { getAmenityCategoryLabel, getAmenityLabel } from "@/lib/amenities-i18n";
import { amenityIconForKey } from "@/lib/amenity-icons";

const PREVIEW_MAX = 8;
const PREVIEW_MIN = 6;

export function ListingAmenitiesSection({
  amenities,
}: {
  amenities: ListingPublicDetail["amenities"];
}) {
  const t = useTranslations("Amenities");
  const keys = amenities.map((a) => a.amenity_key);
  if (!keys.length) return null;

  const [open, setOpen] = useState(false);
  const previewCount = Math.min(PREVIEW_MAX, Math.max(PREVIEW_MIN, keys.length));
  const previewKeys = keys.slice(0, keys.length <= PREVIEW_MIN ? keys.length : previewCount);
  const grouped = amenitiesByCategoryGroups(keys);

  return (
    <section id="amenities" className="listing-section scroll-mt-28">
      <h2 className="listing-section-title">{t("title")}</h2>
      <ul className="mt-5 grid gap-3 sm:grid-cols-2">
        {previewKeys.map((key) => {
          const label = getAmenityLabel(key, t);
          const Icon = amenityIconForKey(key);
          return (
            <li
              key={key}
              className="flex items-center gap-2.5 text-sm font-medium text-charcoal/85"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sand/50 text-gold">
                <Icon className="h-4 w-4" strokeWidth={1.75} />
              </span>
              {label}
            </li>
          );
        })}
      </ul>
      {keys.length > previewKeys.length && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-5 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-medium text-charcoal transition-colors hover:border-gold/30"
        >
          {t("showAll")}
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-[180] flex items-end justify-center bg-charcoal/50 p-4 sm:items-center">
          <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="listing-section-title text-lg">{t("title")}</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-2 hover:bg-charcoal/5"
                aria-label={t("close")}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 space-y-5">
              {grouped.map((group) => (
                <div key={group.id}>
                  <p className="text-xs font-semibold tracking-wide text-muted uppercase">
                    {getAmenityCategoryLabel(group.id as AmenityCategory, t)}
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-charcoal/80">
                    {group.keys.map((key) => (
                      <li key={key}>{getAmenityLabel(key, t)}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            {(grouped.some((g) => g.id === "safety") ||
              grouped.some((g) => g.id === "accessibility")) && (
              <p className="mt-4 text-xs text-muted">{t("safetyDisclaimer")}</p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
