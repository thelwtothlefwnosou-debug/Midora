import Link from "next/link";
import { Eye, CalendarDays, Pencil, ExternalLink, Camera } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ListingCompletenessCard } from "@/components/dashboard/ListingCompletenessCard";
import type { ListingWorkspaceContext } from "@/lib/listing-workspace-types";
import { listingNeedsCompletenessPanel } from "@/lib/owner-listings-page";
import {
  buildListingAnalytics,
  formatAnalyticsMetric,
  hasListingPerformanceData,
} from "@/lib/owner-listing-analytics";
import { formatOwnerListingDate } from "@/lib/dashboard-listings";
import { getListingPublicId } from "@/lib/utils";

type Props = {
  ctx: ListingWorkspaceContext;
};

function activeUntilLabel(
  ctx: ListingWorkspaceContext
): { text: string; tone: string } | null {
  const { listing, ownerStatusKey } = ctx;
  if (
    ownerStatusKey !== "published" &&
    ownerStatusKey !== "paused" &&
    ownerStatusKey !== "expired"
  ) {
    return null;
  }

  if (!listing.expires_at) {
    return { text: "Ενεργή χωρίς ημερομηνία λήξης", tone: "text-charcoal/80" };
  }

  const days = Math.ceil(
    (new Date(listing.expires_at).getTime() - Date.now()) / 86400000
  );
  const formatted = formatOwnerListingDate(listing.expires_at);

  if (days < 0) {
    return {
      text: formatted ? `Έληξε στις ${formatted}` : "Έληξε",
      tone: "text-charcoal/60",
    };
  }
  if (days <= 6) {
    return {
      text: `Λήγει σε ${days} ${days === 1 ? "ημέρα" : "ημέρες"}`,
      tone: "text-orange-700",
    };
  }
  if (days <= 14) {
    return {
      text: formatted ? `Ενεργή έως ${formatted}` : `Λήγει σε ${days} ημέρες`,
      tone: "text-gold-dark",
    };
  }
  return {
    text: formatted ? `Ενεργή έως ${formatted}` : "Ενεργή",
    tone: "text-teal",
  };
}

export function ListingOverviewPanel({ ctx }: Props) {
  const { listing, ownerStatusKey, photoCount } = ctx;
  const analytics = buildListingAnalytics(
    listing,
    ctx.effectiveStatus,
    ownerStatusKey
  );
  const lifecycle = activeUntilLabel(ctx);
  const publicId = getListingPublicId(listing);
  const showCompleteness = listingNeedsCompletenessPanel(ownerStatusKey);
  const hasPerformance = hasListingPerformanceData(analytics);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {lifecycle && (
          <div className="rounded-xl border border-border bg-white px-4 py-3 shadow-soft">
            <p className="text-[11px] font-medium text-muted">Διάρκεια προβολής</p>
            <p className={`mt-1 text-sm font-semibold ${lifecycle.tone}`}>{lifecycle.text}</p>
          </div>
        )}
        {hasPerformance ? (
          <div className="rounded-xl border border-border bg-white px-4 py-3 shadow-soft">
            <p className="flex items-center gap-1.5 text-[11px] font-medium text-muted">
              <Eye className="h-3 w-3" />
              Προβολές
            </p>
            <p className="mt-1 font-display text-xl font-semibold tabular-nums text-charcoal">
              {formatAnalyticsMetric(analytics.viewsTotal)}
            </p>
            <p className="text-[11px] text-muted">Σύνολο</p>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-white px-4 py-3 shadow-soft sm:col-span-2">
            <p className="text-sm text-muted">Δεν υπάρχουν ακόμη αρκετά δεδομένα προβολών.</p>
          </div>
        )}
      </div>

      {showCompleteness && (
        <ListingCompletenessCard listing={listing} photoCount={photoCount} />
      )}

      <section className="rounded-2xl border border-border bg-white p-5 shadow-soft">
        <h3 className="font-display text-base font-semibold text-charcoal">Γρήγορες ενέργειες</h3>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button href={`/dashboard/listings/${listing.id}/edit`} size="sm" variant="outline">
            <Pencil className="h-3.5 w-3.5" />
            Επεξεργασία αγγελίας
          </Button>
          <Button href={`/dashboard/listings/${listing.id}/photos`} size="sm" variant="outline">
            <Camera className="h-3.5 w-3.5" />
            Περιήγηση σπιτιού
          </Button>
          <Button
            href={`/dashboard/listings/${listing.id}/availability`}
            size="sm"
            variant="outline"
          >
            <CalendarDays className="h-3.5 w-3.5" />
            Διαθεσιμότητα
          </Button>
          {(ownerStatusKey === "published" || ownerStatusKey === "paused") && (
            <Button href={`/listings/${publicId}`} size="sm" variant="outline">
              <ExternalLink className="h-3.5 w-3.5" />
              Δημόσια αγγελία
            </Button>
          )}
          <Button href={`/dashboard/listings/${listing.id}/analytics`} size="sm" variant="outline">
            Δες στατιστικά
          </Button>
        </div>
      </section>
    </div>
  );
}
