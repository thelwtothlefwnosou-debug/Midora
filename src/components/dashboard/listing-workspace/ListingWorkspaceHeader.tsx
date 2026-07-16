import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ImageIcon } from "lucide-react";
import { DashboardListingStatusBadge } from "@/components/dashboard/DashboardListingStatusBadge";
import { ListingViewButton } from "@/components/dashboard/ListingViewButton";
import { OwnerListingsNavLink } from "@/components/dashboard/OwnerListingsNavLink";
import { HelpAssistantTrigger } from "@/components/assistant/HelpAssistantContext";
import { ListingWorkspaceSwitcher } from "@/components/dashboard/listing-workspace/ListingWorkspaceSwitcher";
import type { ListingWorkspaceContext, ListingSwitcherItem } from "@/lib/listing-workspace-types";
import { ownerListingStatusHelper } from "@/lib/dashboard-listings";
import { formatListingPrice, rentalTypeBadgeLabel } from "@/lib/rental-types";
import { OWNER_LISTINGS_LIST_PATH } from "@/lib/owner-listings-nav";
import { formatOwnerListingDate } from "@/lib/dashboard-listings";

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
  const showActiveUntil =
    (ownerStatusKey === "published" ||
      ownerStatusKey === "paused" ||
      ownerStatusKey === "expired") &&
    listing.expires_at;
  const activeUntil = showActiveUntil ? formatOwnerListingDate(listing.expires_at) : null;

  return (
    <div className="mb-3 space-y-2">
      <OwnerListingsNavLink
        href={OWNER_LISTINGS_LIST_PATH}
        className="inline-flex min-h-8 items-center gap-1.5 text-[13px] font-medium text-muted transition-colors hover:text-charcoal"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Όλες οι αγγελίες
      </OwnerListingsNavLink>

      {switcherItems.length > 1 && (
        <ListingWorkspaceSwitcher
          currentListingId={listing.id}
          items={switcherItems}
          className="max-w-md"
        />
      )}

      <div className="rounded-xl border border-border bg-white px-3 py-2.5 shadow-soft sm:px-4">
        <div className="flex items-center gap-3">
          <div className="relative h-14 w-[72px] shrink-0 overflow-hidden rounded-lg bg-sand/40 sm:h-16 sm:w-20">
            {cover ? (
              <Image src={cover} alt="" fill className="object-cover" sizes="80px" />
            ) : (
              <div className="flex h-full items-center justify-center text-muted">
                <ImageIcon className="h-4 w-4 opacity-50" />
              </div>
            )}
            <span className="absolute bottom-0.5 left-0.5 rounded bg-charcoal/90 px-1 py-px text-[7px] font-semibold tracking-wide text-white uppercase">
              {rentalTypeBadgeLabel(rentalType)}
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="line-clamp-1 font-display text-base font-semibold text-charcoal sm:text-[17px]">
              {listing.title}
            </h2>
            <p className="mt-0.5 line-clamp-1 text-xs text-muted">
              {listing.area_display_name || listing.area},{" "}
              {listing.city_display_name || listing.city}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-sm font-semibold text-charcoal">
                {price.amount && price.amount > 0 ? price.display : "—"}
              </span>
              <DashboardListingStatusBadge
                statusKey={ownerStatusKey}
                label={ownerStatusLabel}
                helperText={null}
                compact
              />
              {activeUntil && (
                <span className="text-[11px] text-muted">έως {activeUntil}</span>
              )}
            </div>
            {helperText && (
              <p className="mt-1 line-clamp-1 text-[11px] text-muted">{helperText}</p>
            )}
          </div>

          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <ListingViewButton listingId={listing.id} size="sm" />
            <Link
              href={`/dashboard/listings/${listing.id}/edit`}
              className="hidden min-h-8 items-center rounded-lg border border-border px-3 text-xs font-medium text-charcoal hover:bg-sand sm:inline-flex"
            >
              Επεξεργασία
            </Link>
            <HelpAssistantTrigger
              label="Βοήθεια για αυτή την αγγελία"
              seedQuestion="Πώς ανεβάζω φωτογραφίες;"
              className="hidden min-h-8 items-center text-xs font-medium text-muted hover:text-gold-dark sm:inline-flex"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
