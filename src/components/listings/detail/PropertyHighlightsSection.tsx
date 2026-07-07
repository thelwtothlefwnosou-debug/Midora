"use client";

import type { ListingPublicDetail } from "@/lib/types";
import { isValidPublicHighlightLabel } from "@/lib/listing-public-text";
import { highlightIconForKey } from "@/lib/amenity-icons";

type Props = {
  highlights: ListingPublicDetail["highlights"];
};

export function PropertyHighlightsSection({ highlights }: Props) {
  const items = highlights
    .filter((h) => isValidPublicHighlightLabel(h.label))
    .slice(0, 3);

  if (!items.length) return null;

  return (
    <section id="highlights" className="listing-section scroll-mt-32">
      <h2 className="listing-section-title">Τι ξεχωρίζει</h2>
      <ul className="mt-5 space-y-4">
        {items.map((item) => {
          const Icon = highlightIconForKey(item.icon_key);
          return (
            <li key={item.id} className="flex gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold/10 text-gold">
                <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
              </span>
              <div className="min-w-0 pt-0.5">
                <p className="text-[15px] font-semibold leading-snug text-charcoal sm:text-base">
                  {item.label}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
