"use client";

import {
  buildPublicListingMetadataLine,
  buildPublicPropertySummaryLine,
} from "@/lib/listing-public-labels";
import type { ListingPublicDetail } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  listing: ListingPublicDetail;
  rentalLabel?: "Βραχυχρόνια" | "Μηνιαία / Μεσοπρόθεσμη";
  modeSwitcher?: React.ReactNode;
  className?: string;
};

/** Property type, location and capacity — sits directly below the gallery. */
export function PublicListingSummary({
  listing,
  rentalLabel,
  modeSwitcher,
  className,
}: Props) {
  const summaryLine = buildPublicPropertySummaryLine(listing);
  const metadataLine = buildPublicListingMetadataLine(listing);

  return (
    <section className={cn("mt-6 lg:mt-8", className)}>
      <p className="listing-summary-headline">{summaryLine}</p>
      {metadataLine ? (
        <p className="listing-summary-meta mt-1.5">{metadataLine}</p>
      ) : null}
      {(rentalLabel || modeSwitcher) && (
        <div className="mt-3 flex flex-wrap items-center gap-2.5">
          {rentalLabel ? (
            <span className="inline-flex items-center rounded-full border border-charcoal/10 bg-sand/30 px-2.5 py-0.5 text-[11px] font-medium tracking-wide text-charcoal/70">
              {rentalLabel}
            </span>
          ) : null}
          {modeSwitcher}
        </div>
      )}
    </section>
  );
}
