import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ImageIcon } from "lucide-react";
import { DashboardListingStatusBadge } from "@/components/dashboard/DashboardListingStatusBadge";
import { ListingViewButton } from "@/components/dashboard/ListingViewButton";
import { DashboardBreadcrumbTrail } from "@/components/dashboard/DashboardBreadcrumbTrail";
import { OwnerListingsNavLink } from "@/components/dashboard/OwnerListingsNavLink";
import { ListingWorkspaceSwitcher } from "@/components/dashboard/listing-workspace/ListingWorkspaceSwitcher";
import type { ListingWorkspaceContext, ListingSwitcherItem } from "@/lib/listing-workspace-types";
import { ownerListingStatusHelper } from "@/lib/dashboard-listings";
import { formatListingPrice, rentalTypeBadgeLabel } from "@/lib/rental-types";
import { OWNER_LISTINGS_LIST_PATH } from "@/lib/owner-listings-nav";

type Props = {
  ctx: ListingWorkspaceContext;
  switcherItems: ListingSwitcherItem[];
};

export function ListingWorkspaceHeader({ ctx, switcherItems }: Props) {
  const { listing, effectiveStatus, ownerStatusKey, ownerStatusLabel, rentalType } = ctx;
  const helperText = ownerListingStatusHelper(listing, effectiveStatus, ownerStatusKey);
  const price = formatListingPrice(listing);
  const images = listing.listing_images ?? [];
  const cover = images.find((i) => i.media_type !== "video")?.url;

  return (
    <div className="mb-4 space-y-3">
      <DashboardBreadcrumbTrail
        items={[
          { label: "Midora", href: "/dashboard/listings" },
          { label: "Οι αγγελίες μου", href: OWNER_LISTINGS_LIST_PATH },
          { label: listing.title },
        ]}
      />

      <OwnerListingsNavLink
        href={OWNER_LISTINGS_LIST_PATH}
        className="inline-flex min-h-9 items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-charcoal"
      >
        <ArrowLeft className="h-4 w-4" />
        Όλες οι αγγελίες
      </OwnerListingsNavLink>

      {switcherItems.length > 1 && (
        <ListingWorkspaceSwitcher
          currentListingId={listing.id}
          items={switcherItems}
          className="max-w-xl"
        />
      )}

      <div className="rounded-2xl border border-border bg-white p-4 shadow-soft sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 gap-4">
            <div className="relative h-[88px] w-[118px] shrink-0 overflow-hidden rounded-xl bg-sand/40 sm:h-[96px] sm:w-[128px]">
              {cover ? (
                <Image src={cover} alt="" fill className="object-cover" sizes="128px" />
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-muted">
                  <ImageIcon className="h-5 w-5 opacity-50" />
                </div>
              )}
              <span className="absolute top-1.5 left-1.5 rounded bg-charcoal/90 px-1.5 py-0.5 text-[8px] font-semibold tracking-wide text-white uppercase">
                {rentalTypeBadgeLabel(rentalType)}
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="line-clamp-2 font-display text-lg font-semibold text-charcoal sm:text-xl">
                {listing.title}
              </h2>
              <p className="mt-1 text-sm text-muted">
                {listing.area_display_name || listing.area},{" "}
                {listing.city_display_name || listing.city}
              </p>
              <p className="mt-2 font-display text-base font-semibold text-charcoal">
                {price.amount && price.amount > 0 ? price.display : "—"}
              </p>
              <div className="mt-2">
                <DashboardListingStatusBadge
                  statusKey={ownerStatusKey}
                  label={ownerStatusLabel}
                  helperText={helperText}
                />
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col sm:items-end">
            <ListingViewButton listingId={listing.id} />
            <Link
              href={`/dashboard/listings/${listing.id}/edit`}
              className="inline-flex min-h-9 items-center justify-center rounded-xl bg-charcoal px-4 text-sm font-semibold text-white hover:bg-charcoal/90"
            >
              Επεξεργασία
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
