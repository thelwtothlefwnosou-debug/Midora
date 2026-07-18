"use client";

import { ListingExternalLinksEditor } from "@/components/dashboard/ListingExternalLinksEditor";
import type { ListingExternalLink } from "@/lib/listing-external-links";

type Props = {
  listingId: string | null;
  initialLinks: ListingExternalLink[];
};

/** Optional create-listing step — skippable; no validation required. */
export function ListingWizardTrustLinksStep({ listingId, initialLinks }: Props) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-xl font-semibold text-charcoal">
          Σύνδεσμοι αξιοπιστίας
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Προαιρετικά: πρόσθεσε HTTPS σύνδεσμο από άλλη πλατφόρμα όπου υπάρχει το ίδιο ακίνητο.
          Βοηθά στη διασταύρωση — χωρίς επαλήθευση από το Midora. Μπορείς να το παραλείψεις και να
          το κάνεις αργότερα από την καρτέλα Αξιοπιστία.
        </p>
      </div>

      {!listingId ? (
        <p className="rounded-xl border border-border bg-sand/20 px-4 py-3 text-sm text-muted">
          Αποθήκευσε πρώτα το πρόχειρο της αγγελίας για να προσθέσεις συνδέσμους, ή πάτα Επόμενο για
          να συνεχίσεις χωρίς.
        </p>
      ) : (
        <ListingExternalLinksEditor
          listingId={listingId}
          initialLinks={initialLinks}
          showCardChrome={false}
        />
      )}
    </div>
  );
}
