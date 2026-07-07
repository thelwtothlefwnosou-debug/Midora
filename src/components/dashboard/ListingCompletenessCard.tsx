import Link from "next/link";
import type { ListingWithImages } from "@/lib/types";
import {
  completenessPercent,
  shortTermCompletenessItems,
} from "@/lib/listing-completeness";
import { listingSupportsShortTerm } from "@/lib/rental-types";

export function ListingCompletenessCard({
  listing,
  photoCount,
}: {
  listing: ListingWithImages;
  photoCount: number;
}) {
  if (!listingSupportsShortTerm(listing)) return null;

  const items = shortTermCompletenessItems(listing, photoCount);
  const percent = completenessPercent(items);
  const missing = items.filter((i) => i.required && !i.done);

  return (
    <div className="rounded-2xl border border-border bg-white p-5 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <p className="font-medium text-charcoal">Πληρότητα αγγελίας</p>
        <span className="text-sm font-semibold text-gold">{percent}%</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-sand">
        <div
          className="h-full rounded-full bg-gold transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="mt-2 text-sm text-muted">
        Η αγγελία σου είναι {percent}% έτοιμη για έλεγχο.
      </p>
      {missing.length > 0 && (
        <ul className="mt-3 space-y-1 text-xs text-muted">
          {missing.slice(0, 4).map((m) => (
            <li key={m.id}>• Λείπει: {m.label}</li>
          ))}
        </ul>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={`/dashboard/listings/${listing.id}/edit`}
          className="text-sm font-medium text-gold hover:underline"
        >
          Επεξεργασία
        </Link>
        <Link
          href={`/dashboard/listings/${listing.id}/edit#availability-calendar`}
          className="text-sm font-medium text-charcoal/70 hover:underline"
        >
          Τιμές και διαθεσιμότητα
        </Link>
        <Link
          href={`/dashboard/listings/${listing.id}/photos`}
          className="text-sm font-medium text-charcoal/70 hover:underline"
        >
          Φωτογραφίες
        </Link>
      </div>
    </div>
  );
}
