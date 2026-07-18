"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Copy, ExternalLink, Eye } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { OwnerListingStatusKey } from "@/lib/dashboard-listings";

type Props = {
  listingId: string;
  publicId: string;
  ownerStatusKey: OwnerListingStatusKey;
  ownerStatusLabel: string;
  expiresLabel: string | null;
  publishedLabel: string | null;
  isFree: boolean;
  externalLinkCount?: number;
  publicExternalLinkCount?: number;
};

const STATUS_COPY: Partial<Record<OwnerListingStatusKey, string>> = {
  published: "Η αγγελία εμφανίζεται δημόσια.",
  paused: "Η αγγελία είναι σε παύση — δεν εμφανίζεται στους επισκέπτες.",
  review: "Η αγγελία είναι σε έλεγχο.",
  draft: "Η αγγελία δεν έχει δημοσιευτεί ακόμα.",
  needs_fixes: "Χρειάζονται διορθώσεις πριν τη δημοσίευση.",
  expired: "Η αγγελία έχει λήξει — ανανέωσε για να εμφανιστεί ξανά.",
  rejected: "Η αγγελία δεν εγκρίθηκε.",
};

export function ListingPublishPanel({
  listingId,
  publicId,
  ownerStatusKey,
  ownerStatusLabel,
  expiresLabel,
  publishedLabel,
  isFree,
  externalLinkCount = 0,
  publicExternalLinkCount = 0,
}: Props) {
  const [copied, setCopied] = useState(false);
  const publicUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/listings/${publicId}`
      : `/listings/${publicId}`;
  const statusNote = STATUS_COPY[ownerStatusKey];
  const showPublic =
    ownerStatusKey === "published" || ownerStatusKey === "paused";

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/listings/${publicId}`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="max-w-2xl space-y-4">
      {statusNote && (
        <p className="rounded-xl border border-border bg-sand/25 px-4 py-3 text-sm text-charcoal">
          {statusNote}
        </p>
      )}

      <div className="rounded-xl border border-gold/25 bg-white p-4 shadow-soft">
        <h3 className="text-sm font-semibold text-charcoal">Σύνδεσμοι αξιοπιστίας</h3>
        <p className="mt-2 text-sm text-muted">
          Πρόσθεσε προαιρετικά σύνδεσμο από Airbnb, Booking ή άλλη πλατφόρμα. Βοηθά στη
          διασταύρωση της αγγελίας — χωρίς επαλήθευση από το Midora.
        </p>
        {externalLinkCount > 0 ? (
          <p className="mt-2 text-xs text-muted">
            {externalLinkCount} αποθηκευμένοι · {publicExternalLinkCount} δημόσιοι
          </p>
        ) : (
          <p className="mt-2 text-xs text-gold-dark">Δεν έχεις προσθέσει ακόμα σύνδεσμο.</p>
        )}
        <Link
          href={`/dashboard/listings/${listingId}/trust-links`}
          className="mt-3 inline-flex min-h-9 items-center rounded-xl border border-border px-4 text-sm font-medium text-charcoal hover:border-gold/30 hover:bg-sand"
        >
          {externalLinkCount > 0 ? "Διαχείριση συνδέσμων" : "Προσθήκη συνδέσμου"}
        </Link>
      </div>

      <div className="rounded-xl border border-border bg-white p-4 shadow-soft">
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Κατάσταση</dt>
            <dd className="font-medium text-charcoal">{ownerStatusLabel}</dd>
          </div>
          {expiresLabel &&
            (ownerStatusKey === "published" ||
              ownerStatusKey === "paused" ||
              ownerStatusKey === "expired") && (
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Ενεργή έως</dt>
                <dd className="font-medium text-charcoal">{expiresLabel}</dd>
              </div>
            )}
          {publishedLabel && (
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Δημοσιεύτηκε</dt>
              <dd className="font-medium text-charcoal">{publishedLabel}</dd>
            </div>
          )}
          {showPublic && (
            <div className="flex justify-between gap-4 border-t border-border pt-3">
              <dt className="text-muted">Δημόσιος σύνδεσμος</dt>
              <dd className="max-w-[60%] truncate font-mono text-xs text-charcoal">
                /listings/{publicId}
              </dd>
            </div>
          )}
        </dl>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button href={`/dashboard/listings/${listingId}/view`} size="sm" variant="outline">
          <Eye className="h-3.5 w-3.5" />
          Προβολή
        </Button>
        {showPublic && (
          <>
            <Link
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-border px-3 text-sm font-medium text-charcoal hover:bg-sand"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Δημόσια αγγελία
            </Link>
            <button
              type="button"
              onClick={() => void copyLink()}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-border px-3 text-sm font-medium text-charcoal hover:bg-sand"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-teal" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Αντιγράφηκε" : "Αντιγραφή link"}
            </button>
          </>
        )}
        {(ownerStatusKey === "expired" ||
          ownerStatusKey === "draft" ||
          ownerStatusKey === "needs_fixes") && (
          <Button href={`/dashboard/listings/${listingId}/pay`} size="sm">
            {ownerStatusKey === "expired" ? "Ανανέωση" : "Υποβολή / ανανέωση"}
          </Button>
        )}
        {ownerStatusKey === "draft" && (
          <Link
            href={`/dashboard/listings/new?draft=${listingId}`}
            className="inline-flex min-h-9 items-center rounded-xl bg-charcoal px-4 text-sm font-semibold text-white hover:bg-charcoal/90"
          >
            Συνέχισε τη συμπλήρωση
          </Link>
        )}
      </div>

      {isFree && (
        <p className="text-xs text-muted">
          Προσφορά launch — η προβολή αγγελίας είναι δωρεάν.
        </p>
      )}
    </div>
  );
}
