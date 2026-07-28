"use client";

import { useState } from "react";
import Image from "next/image";
import { Bed, Bath, Home, Maximize, Users, Building2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ListingImage, ListingPublicDetail } from "@/lib/types";
import {
  formatFloorLabel,
  resolveListingBathrooms,
} from "@/lib/listing-filter-helpers";
import {
  formatPublicBedroomsLabel,
  formatPublicBathroomsLabel,
  formatPublicBedsLabel,
  formatPublicGuestsLabel,
  formatPublicPropertyTypeLabel,
  formatPublicSqmLabel,
} from "@/lib/listing-public-labels";
import { countBedsFromSleeping } from "@/lib/listing-short-term-price";
import { formatPublicMinStayNights } from "@/lib/listing-rental-modes";
import {
  isValidPublicHighlightLabel,
  sanitizePublicListingText,
} from "@/lib/listing-public-text";
import { highlightIconForKey } from "@/lib/amenity-icons";

export function ListingShortTermFacts({ listing }: { listing: ListingPublicDetail }) {
  const t = useTranslations("Listing");
  const tLabels = useTranslations("Listing.labels");
  const tPropertyTypes = useTranslations("PropertyTypes");
  const beds =
    listing.sleeping_arrangements.length > 0
      ? countBedsFromSleeping(listing.sleeping_arrangements)
      : listing.bedrooms;
  const baths = resolveListingBathrooms(listing.bathrooms, listing.bedrooms);
  const floorLabel = formatFloorLabel(listing.floor);
  const propertyLabel = formatPublicPropertyTypeLabel(
    listing.property_type,
    tLabels,
    tPropertyTypes
  );

  const facts = [
    listing.max_guests != null && {
      icon: Users,
      label: formatPublicGuestsLabel(listing.max_guests, tLabels),
    },
    {
      icon: Bed,
      label: formatPublicBedroomsLabel(listing.bedrooms, tLabels),
    },
    beds > 0 && { icon: Bed, label: formatPublicBedsLabel(beds, tLabels) },
    { icon: Bath, label: formatPublicBathroomsLabel(baths, tLabels) },
    floorLabel && { icon: Building2, label: floorLabel },
    listing.sqm && {
      icon: Maximize,
      label: formatPublicSqmLabel(listing.sqm, tLabels),
    },
    { icon: Home, label: propertyLabel },
  ].filter(Boolean) as { icon: typeof Users; label: string }[];

  return (
    <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 border-b border-border pb-8">
      {facts.map((f) => (
        <span
          key={f.label}
          className="inline-flex items-center gap-2 text-sm font-medium text-charcoal/85"
        >
          <f.icon className="h-4 w-4 text-gold/90" strokeWidth={1.75} />
          {f.label}
        </span>
      ))}
      <span className="w-full text-sm text-charcoal/85 sm:w-auto">
        {t("minStayPrefix", { value: formatPublicMinStayNights(listing) })}
      </span>
    </div>
  );
}

export function ListingHighlightsSection({
  highlights,
}: {
  highlights: ListingPublicDetail["highlights"];
}) {
  const t = useTranslations("Listing.shortTermSections");
  const items = highlights
    .filter((h) => isValidPublicHighlightLabel(h.label))
    .slice(0, 3);

  if (!items.length) return null;

  return (
    <section id="highlights" className="listing-section">
      <h2 className="listing-section-title">{t("highlightsTitle")}</h2>
      <ul className="mt-5 grid gap-3 sm:grid-cols-3">
        {items.map((h) => {
          const Icon = highlightIconForKey(h.icon_key);
          return (
            <li
              key={h.id}
              className="listing-card flex items-center gap-3 px-4 py-3.5 text-sm font-medium text-charcoal"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold/10 text-gold">
                <Icon className="h-4 w-4" strokeWidth={1.75} />
              </span>
              {h.label}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function ListingAboutSection({ description }: { description: string }) {
  const t = useTranslations("Listing.shortTermSections");
  const clean = sanitizePublicListingText(description);
  if (!clean) return null;

  const [expanded, setExpanded] = useState(false);
  const long = clean.length > 420;
  const shown = long && !expanded ? `${clean.slice(0, 420).trim()}…` : clean;

  return (
    <section id="about" className="listing-section">
      <h2 className="listing-section-title">{t("aboutThisProperty")}</h2>
      <p className="listing-body mt-5 max-w-full min-w-0 break-words whitespace-pre-wrap [overflow-wrap:anywhere]">
        {shown}
      </p>
      {long && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-4 text-sm font-semibold text-gold-dark hover:text-gold"
        >
          {expanded ? t("showLess") : t("showMore")}
        </button>
      )}
    </section>
  );
}

export function ListingSleepingSection({
  arrangements,
  images = [],
}: {
  arrangements: ListingPublicDetail["sleeping_arrangements"];
  images?: ListingImage[];
}) {
  const t = useTranslations("Listing.shortTermSections");
  if (!arrangements.length) return null;

  const imageById = new Map(images.map((img) => [img.id, img.url]));

  return (
    <section id="sleeping" className="listing-section">
      <h2 className="listing-section-title">{t("sleepingTitle")}</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {arrangements.map((row) => {
          const photoUrl = row.listing_image_id
            ? imageById.get(row.listing_image_id)
            : null;
          const bedLine = [
            row.quantity > 1 ? `${row.quantity}×` : null,
            row.bed_type,
            row.bed_size_note?.trim() || null,
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <article key={row.id} className="overflow-hidden rounded-2xl bg-white">
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-sand/40">
                {photoUrl ? (
                  <Image
                    src={photoUrl}
                    alt={row.room_name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, 50vw"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-sand/80 to-sand/40">
                    <Bed className="h-10 w-10 text-gold/50" strokeWidth={1.5} />
                  </div>
                )}
              </div>
              <div className="px-1 pt-3">
                <h3 className="font-display text-base font-semibold text-charcoal">
                  {row.room_name}
                </h3>
                <p className="mt-1 text-sm text-muted">{bedLine}</p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
