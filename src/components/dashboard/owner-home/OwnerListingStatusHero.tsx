import Link from "next/link";
import { ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DashboardListingStatusBadge } from "@/components/dashboard/DashboardListingStatusBadge";
import type { OwnerListingRowModel } from "@/lib/owner-listings-page";
import { getOwnerListingStatus } from "@/lib/dashboard-listings";
import { formatSubmittedDate } from "@/lib/owner-listing-card-helpers";
import { formatListingPrice, listingRentalType, rentalTypeBadgeLabel } from "@/lib/rental-types";
import { listingManageHref } from "@/lib/listing-workspace-nav";

type Props = {
  row: OwnerListingRowModel;
};

function statusCopy(row: OwnerListingRowModel): {
  title: string;
  description: string;
  primaryCta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
} {
  const manage = listingManageHref(row.listing.id);
  const publish = `${manage}/publish`;

  switch (row.ownerStatusKey) {
    case "review":
      return {
        title: "Η αγγελία σου είναι σε έλεγχο",
        description: "Θα εμφανιστεί δημόσια μόλις ολοκληρωθεί ο έλεγχος.",
        primaryCta: { label: "Δες την αγγελία", href: manage },
        secondaryCta: { label: "Δες την κατάσταση ελέγχου", href: publish },
      };
    case "needs_fixes":
      return {
        title: "Η αγγελία χρειάζεται διόρθωση",
        description:
          row.listing.admin_verification_notes?.slice(0, 160) ||
          "Δες τις παρατηρήσεις και ενημέρωσε την αγγελία.",
        primaryCta: { label: "Διόρθωσε την αγγελία", href: `${manage}/edit` },
        secondaryCta: { label: "Δες την κατάσταση", href: publish },
      };
    case "draft":
      return {
        title: "Η αγγελία είναι πρόχειρη",
        description: "Ολοκλήρωσε τα στοιχεία και υποβάλε για έλεγχο.",
        primaryCta: { label: "Συνέχισε τη συμπλήρωση", href: manage },
      };
    case "published":
    case "paused":
      return {
        title: "Η αγγελία σου είναι δημοσιευμένη",
        description: "Διαχειρίσου διαθεσιμότητα, αιτήματα και στατιστικά από το workspace.",
        primaryCta: { label: "Διαχείριση ακινήτου", href: manage },
      };
    case "expired":
      return {
        title: "Η αγγελία έληξε",
        description: "Ανανέωσε την προβολή για να εμφανίζεται ξανά δημόσια.",
        primaryCta: {
          label: "Ανανέωση αγγελίας",
          href: `${manage}/pay?reactivate=1`,
        },
      };
    default:
      return {
        title: row.listing.title,
        description: "Δες την κατάσταση και τα επόμενα βήματα.",
        primaryCta: { label: "Διαχείριση ακινήτου", href: manage },
      };
  }
}

export function OwnerListingStatusHero({ row }: Props) {
  const { listing, effectiveStatus, ownerStatusKey, completenessPercent } = row;
  const ownerStatus = getOwnerListingStatus(listing, effectiveStatus);
  const copy = statusCopy(row);
  const rentalType = listingRentalType(listing);
  const price = formatListingPrice(listing);
  const submitted = formatSubmittedDate(listing.updated_at ?? listing.created_at);
  const cover = listing.listing_images?.find((i) => i.media_type !== "video")?.url;
  const location = [listing.area_display_name || listing.area, listing.city_display_name || listing.city]
    .filter(Boolean)
    .join(", ");

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-white shadow-soft">
      <div className="grid lg:grid-cols-[minmax(0,1fr)_220px]">
        <div className="flex gap-4 p-4 sm:p-5">
          <Link
            href={listingManageHref(listing.id)}
            className="relative hidden h-20 w-28 shrink-0 overflow-hidden rounded-xl bg-sand/50 sm:block"
          >
            {cover ? (
              // eslint-disable-next-line @next/next/no-img-element -- avoid next/image hostname crashes blanking dashboard
              <img src={cover} alt="" className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-muted">
                <ImageIcon className="h-6 w-6 opacity-40" />
              </div>
            )}
          </Link>

          <div className="min-w-0 flex-1">
            <DashboardListingStatusBadge statusKey={ownerStatusKey} label={ownerStatus.label} />
            <h2 className="mt-2 font-display text-lg font-semibold text-charcoal sm:text-xl">
              {copy.title}
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-muted">{copy.description}</p>
            {submitted &&
              (ownerStatusKey === "review" || ownerStatusKey === "needs_fixes") && (
                <p className="mt-2 text-xs text-muted">Υποβλήθηκε στις {submitted}</p>
              )}
            <div className="mt-4 flex flex-wrap gap-2">
              <Button href={copy.primaryCta.href} size="sm">
                {copy.primaryCta.label}
              </Button>
              {copy.secondaryCta && (
                <Button href={copy.secondaryCta.href} size="sm" variant="outline">
                  {copy.secondaryCta.label}
                </Button>
              )}
            </div>
          </div>
        </div>

        <aside className="border-t border-border bg-cream/30 p-4 sm:p-5 lg:border-t-0 lg:border-l">
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-[11px] font-medium tracking-wide text-muted uppercase">Τύπος</dt>
              <dd className="mt-0.5 font-medium text-charcoal">
                {rentalTypeBadgeLabel(rentalType)}
              </dd>
            </div>
            {location && (
              <div>
                <dt className="text-[11px] font-medium tracking-wide text-muted uppercase">
                  Περιοχή
                </dt>
                <dd className="mt-0.5 font-medium text-charcoal">{location}</dd>
              </div>
            )}
            <div>
              <dt className="text-[11px] font-medium tracking-wide text-muted uppercase">Τιμή</dt>
              <dd className="mt-0.5 font-medium text-charcoal">
                {price.amount && price.amount > 0 ? price.display : "—"}
              </dd>
            </div>
            {completenessPercent < 100 && (
              <div>
                <dt className="text-[11px] font-medium tracking-wide text-muted uppercase">
                  Πληρότητα
                </dt>
                <dd className="mt-1 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-sand">
                    <div
                      className="h-full rounded-full bg-gold"
                      style={{ width: `${completenessPercent}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold tabular-nums text-charcoal">
                    {completenessPercent}%
                  </span>
                </dd>
              </div>
            )}
          </dl>
        </aside>
      </div>
    </section>
  );
}
