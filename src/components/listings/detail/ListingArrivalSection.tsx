"use client";

import { useTranslations, useLocale } from "next-intl";
import { DoorOpen } from "lucide-react";
import { getArrivalInfoItems, hasArrivalInfo } from "@/lib/listing-arrival";
import type { ListingPublicDetail } from "@/lib/types";

type Props = {
  listing: ListingPublicDetail;
};

export function ListingArrivalSection({ listing }: Props) {
  const tSection = useTranslations("Listing.arrivalSection");
  const t = useTranslations("Listing.houseRules");
  if (!hasArrivalInfo(listing)) return null;

  const items = getArrivalInfoItems(listing, t);

  return (
    <section id="arrival" className="listing-section scroll-mt-32">
      <h2 className="listing-section-title">{tSection("title")}</h2>
      <p className="listing-meta mt-2">{tSection("intro")}</p>

      <dl className="listing-card mt-5 space-y-4 p-5">
        {items.map((item) => (
          <div key={item.label} className="flex items-start gap-3">
            <DoorOpen className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
            <div>
              <dt className="text-sm text-muted">{item.label}</dt>
              <dd className="mt-0.5 text-sm font-semibold text-charcoal">{item.value}</dd>
            </div>
          </div>
        ))}
      </dl>
    </section>
  );
}
