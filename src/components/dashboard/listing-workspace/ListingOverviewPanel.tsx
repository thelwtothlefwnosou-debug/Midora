import Link from "next/link";
import {
  Eye,
  CalendarDays,
  Pencil,
  ExternalLink,
  Camera,
  MessageSquare,
  ArrowRight,
  BarChart3,
  Link2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";
import { PropertyLeadRow } from "@/components/dashboard/PropertyLeadRow";
import { ListingCompletenessCard } from "@/components/dashboard/ListingCompletenessCard";
import type { ListingWorkspaceContext } from "@/lib/listing-workspace-types";
import type { PropertyLeadWithListing } from "@/lib/types";
import { listingNeedsCompletenessPanel } from "@/lib/owner-listings-page";
import {
  buildListingAnalytics,
  formatAnalyticsMetric,
  hasListingPerformanceData,
} from "@/lib/owner-listing-analytics";
import { formatOwnerListingDate } from "@/lib/dashboard-listings";
import { formatListingPrice } from "@/lib/rental-types";
import { getListingPublicId } from "@/lib/utils";

type Props = {
  ctx: ListingWorkspaceContext;
  recentLeads?: PropertyLeadWithListing[];
  externalLinkCount?: number;
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
    return { text: formatted ? `Έληξε στις ${formatted}` : "Έληξε", tone: "text-charcoal/60" };
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

function nextAction(
  ctx: ListingWorkspaceContext
): { label: string; href: string } | null {
  const { listing, ownerStatusKey } = ctx;
  const id = listing.id;

  switch (ownerStatusKey) {
    case "draft":
      return { label: "Συνέχισε τη συμπλήρωση", href: `/dashboard/listings/new?draft=${id}` };
    case "needs_fixes":
      return { label: "Διόρθωσε την αγγελία", href: `/dashboard/listings/${id}/edit` };
    case "review":
      return { label: "Δες κατάσταση δημοσίευσης", href: `/dashboard/listings/${id}/publish` };
    case "expired":
      return { label: "Ανανέωση αγγελίας", href: `/dashboard/listings/${id}/pay` };
    case "published":
    case "paused":
      return { label: "Διαχείριση ημερολογίου", href: `/dashboard/listings/${id}/availability` };
    default:
      return null;
  }
}

export function ListingOverviewPanel({
  ctx,
  recentLeads = [],
  externalLinkCount = 0,
}: Props) {
  const { listing, ownerStatusKey, ownerStatusLabel, photoCount, rentalType } = ctx;
  const analytics = buildListingAnalytics(
    listing,
    ctx.effectiveStatus,
    ownerStatusKey
  );
  const lifecycle = activeUntilLabel(ctx);
  const action = nextAction(ctx);
  const publicId = getListingPublicId(listing);
  const showCompleteness = listingNeedsCompletenessPanel(ownerStatusKey);
  const hasPerformance = hasListingPerformanceData(analytics);
  const price = formatListingPrice(listing);
  const isShortTerm = rentalType === "short_term";
  const showTrustRecommendation = externalLinkCount === 0;

  return (
    <div className="space-y-4">
      {showTrustRecommendation && (
        <section className="rounded-xl border border-gold/30 bg-white p-4 shadow-soft">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-gold-dark">
                <Link2 className="h-3.5 w-3.5" />
                Σύσταση
              </p>
              <h3 className="mt-1 font-display text-sm font-semibold text-charcoal">
                Πρόσθεσε συνδέσμους αξιοπιστίας
              </h3>
              <p className="mt-1 text-sm text-muted">
                Αν η αγγελία υπάρχει και αλλού (Airbnb, Booking κ.ά.), πρόσθεσε το HTTPS link.
                Βοηθά τους επισκέπτες να διασταυρώσουν το ακίνητο — χωρίς να σημαίνει έλεγχο από
                το Midora.
              </p>
            </div>
            <Button href={`/dashboard/listings/${listing.id}/trust-links`} size="sm">
              Προσθήκη
            </Button>
          </div>
        </section>
      )}

      <section className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-white p-4 shadow-soft">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
            Κατάσταση αγγελίας
          </p>
          <p className="mt-1 font-display text-lg font-semibold text-charcoal">
            {ownerStatusLabel}
          </p>
          {lifecycle && (
            <p className={`mt-1 text-sm font-medium ${lifecycle.tone}`}>{lifecycle.text}</p>
          )}
          {action && (
            <Link
              href={action.href}
              className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-gold-dark hover:text-charcoal"
            >
              {action.label}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>

        <div className="rounded-xl border border-border bg-white p-4 shadow-soft">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
            Απόδοση
          </p>
          {hasPerformance ? (
            <div className="mt-2 flex flex-wrap gap-4">
              <div>
                <p className="flex items-center gap-1 text-xs text-muted">
                  <Eye className="h-3 w-3" />
                  Προβολές
                </p>
                <p className="font-display text-2xl font-semibold tabular-nums text-charcoal">
                  {formatAnalyticsMetric(analytics.viewsTotal)}
                </p>
              </div>
              <div>
                <p className="flex items-center gap-1 text-xs text-muted">
                  <MessageSquare className="h-3 w-3" />
                  Αιτήματα
                </p>
                <p className="font-display text-2xl font-semibold tabular-nums text-charcoal">
                  {recentLeads.length}
                </p>
              </div>
            </div>
          ) : (
            <DashboardEmptyState
              compact
              icon={BarChart3}
              title="Χωρίς στατιστικά ακόμα"
              text="Τα στατιστικά θα εμφανιστούν όταν η αγγελία λάβει επισκέψεις."
              className="mt-2 border-0 bg-transparent px-0 py-0"
            />
          )}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-white p-4 shadow-soft">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
              Διαθεσιμότητα
            </p>
            {isShortTerm ? (
              <>
                <p className="mt-1 text-sm text-charcoal">
                  Βασική τιμή:{" "}
                  <span className="font-semibold">
                    {listing.price_per_night
                      ? `€${listing.price_per_night.toLocaleString("el-GR")} / βράδυ`
                      : "—"}
                  </span>
                </p>
                <p className="mt-0.5 text-xs text-muted">
                  Διαχείριση τιμών και κλεισμένων ημερομηνιών στο ημερολόγιο.
                </p>
              </>
            ) : (
              <>
                <p className="mt-1 text-sm font-semibold text-charcoal">
                  {price.amount && price.amount > 0 ? price.display : "—"}
                </p>
                {listing.available_from && (
                  <p className="mt-0.5 text-xs text-muted">
                    Διαθέσιμο από {formatOwnerListingDate(listing.available_from)}
                  </p>
                )}
              </>
            )}
          </div>
          <Button
            href={`/dashboard/listings/${listing.id}/availability`}
            size="sm"
            variant="outline"
          >
            <CalendarDays className="h-3.5 w-3.5" />
            {isShortTerm ? "Ημερολόγιο" : "Διαθεσιμότητα"}
          </Button>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-white p-4 shadow-soft">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-display text-sm font-semibold text-charcoal">
            Πρόσφατα αιτήματα
          </h3>
          {recentLeads.length > 0 && (
            <Link
              href={`/dashboard/listings/${listing.id}/inquiries`}
              className="text-xs font-medium text-gold-dark hover:text-charcoal"
            >
              Όλα
            </Link>
          )}
        </div>
        {recentLeads.length === 0 ? (
          <DashboardEmptyState
            compact
            icon={MessageSquare}
            title="Χωρίς αιτήματα"
            text="Δεν υπάρχουν ακόμη αιτήματα ενδιαφέροντος για αυτό το ακίνητο."
            className="mt-3"
          />
        ) : (
          <div className="mt-3 space-y-2">
            {recentLeads.slice(0, 3).map((lead) => (
              <PropertyLeadRow key={lead.id} lead={lead} />
            ))}
          </div>
        )}
      </section>

      {showCompleteness && (
        <ListingCompletenessCard listing={listing} photoCount={photoCount} />
      )}

      <section className="rounded-xl border border-border bg-white p-4 shadow-soft">
        <h3 className="font-display text-sm font-semibold text-charcoal">Γρήγορες ενέργειες</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button href={`/dashboard/listings/${listing.id}/edit`} size="sm" variant="outline">
            <Pencil className="h-3.5 w-3.5" />
            Επεξεργασία
          </Button>
          <Button
            href={`/dashboard/listings/${listing.id}/trust-links`}
            size="sm"
            variant="outline"
          >
            <Link2 className="h-3.5 w-3.5" />
            Αξιοπιστία
          </Button>
          <Button href={`/dashboard/listings/${listing.id}/photos`} size="sm" variant="outline">
            <Camera className="h-3.5 w-3.5" />
            Φωτογραφίες
          </Button>
          <Button
            href={`/dashboard/listings/${listing.id}/availability`}
            size="sm"
            variant="outline"
          >
            <CalendarDays className="h-3.5 w-3.5" />
            Διαθεσιμότητα
          </Button>
          <Button href={`/dashboard/listings/${listing.id}/view`} size="sm" variant="outline">
            <ExternalLink className="h-3.5 w-3.5" />
            Προβολή
          </Button>
          {(ownerStatusKey === "published" || ownerStatusKey === "paused") && (
            <Button href={`/listings/${publicId}`} size="sm" variant="outline">
              Δημόσια σελίδα
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}
