import Link from "next/link";
import { requireDashboardContext } from "@/lib/dashboard-context";
import { loadListingWorkspace } from "@/lib/listing-workspace-server";
import { formatOwnerListingDate } from "@/lib/dashboard-listings";
import { getListingPublicId } from "@/lib/utils";

export default async function ListingPublishPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { profile } = await requireDashboardContext("/dashboard/listings");
  const ctx = await loadListingWorkspace(id, profile.id);
  const { listing, ownerStatusKey, ownerStatusLabel } = ctx;
  const isFree = process.env.NEXT_PUBLIC_FREE_LISTINGS === "true";
  const publicId = getListingPublicId(listing);
  const expiresLabel = formatOwnerListingDate(listing.expires_at);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="font-display text-lg font-semibold text-charcoal">Δημοσίευση</h2>
        <p className="mt-1 text-sm text-muted">
          Κατάσταση προβολής και λήξης — ξεχωριστά από τη συνδρομή λογαριασμού.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-white p-5 shadow-soft">
        <dl className="space-y-4 text-sm">
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
          {listing.published_at && (
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Δημοσιεύτηκε</dt>
              <dd className="font-medium text-charcoal">
                {formatOwnerListingDate(listing.published_at)}
              </dd>
            </div>
          )}
        </dl>
      </div>

      <div className="flex flex-wrap gap-2">
        {(ownerStatusKey === "published" || ownerStatusKey === "paused") && (
          <Link
            href={`/listings/${publicId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-10 items-center rounded-xl border border-border px-4 text-sm font-medium text-charcoal hover:border-gold/30"
          >
            Δες δημόσια αγγελία
          </Link>
        )}
        {(ownerStatusKey === "expired" ||
          ownerStatusKey === "draft" ||
          ownerStatusKey === "needs_fixes") && (
          <Link
            href={`/dashboard/listings/${id}/pay`}
            className="inline-flex min-h-10 items-center rounded-xl bg-gold px-4 text-sm font-semibold text-white hover:bg-gold-dark"
          >
            {ownerStatusKey === "expired" ? "Επανενεργοποίηση" : "Υποβολή / ανανέωση"}
          </Link>
        )}
        {ownerStatusKey === "draft" && (
          <Link
            href={`/dashboard/listings/new?draft=${id}`}
            className="inline-flex min-h-10 items-center rounded-xl bg-charcoal px-4 text-sm font-semibold text-white hover:bg-charcoal/90"
          >
            Συνέχισε τη συμπλήρωση
          </Link>
        )}
      </div>

      {isFree && (
        <p className="text-xs text-muted">
          Προσφορά launch — η προβολή αγγελίας είναι δωρεάν. Η συνδρομή προβολής λογαριασμού
          διαχειρίζεται από τις ρυθμίσεις λογαριασμού.
        </p>
      )}
    </div>
  );
}
