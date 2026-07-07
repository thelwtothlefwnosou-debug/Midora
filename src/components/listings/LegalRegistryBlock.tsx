import type { ListingWithImages } from "@/lib/types";
import {
  AMA_DISCLAIMER,
  formatAmaDisplay,
  legalRegistryRegisteredBadge,
  needsPublicRegistryDisplay,
} from "@/lib/rental-types";
import { cn } from "@/lib/utils";

export function LegalRegistryBlock({
  listing,
  className,
}: {
  listing: ListingWithImages;
  className?: string;
}) {
  if (!needsPublicRegistryDisplay(listing)) return null;

  const display = formatAmaDisplay(listing);
  const badge = legalRegistryRegisteredBadge(listing);

  if (!display && !badge) return null;

  return (
    <div
      className={cn(
        "rounded-xl border border-teal/20 bg-teal/5 px-4 py-3",
        className
      )}
    >
      <p className="text-xs font-semibold tracking-wide text-teal uppercase">
        Στοιχεία βραχυχρόνιας μίσθωσης
      </p>
      {badge && (
        <span className="mt-2 inline-block rounded-full bg-teal/15 px-2.5 py-0.5 text-xs font-medium text-teal">
          {badge}
        </span>
      )}
      {display && (
        <p className="mt-2 font-display text-lg font-semibold text-charcoal">{display}</p>
      )}
      <p className="mt-2 text-xs leading-relaxed text-muted">{AMA_DISCLAIMER}</p>
    </div>
  );
}
