"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ImageIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { DashboardListingStatusBadge } from "@/components/dashboard/DashboardListingStatusBadge";
import {
  mapOwnerStatusKeyToUi,
  resolveOwnerListingUiStatus,
} from "@/lib/owner-listing-ui-status";
import { ListingViewButton } from "@/components/dashboard/ListingViewButton";
import { OwnerListingsNavLink } from "@/components/dashboard/OwnerListingsNavLink";
import { HelpAssistantTrigger } from "@/components/assistant/HelpAssistantContext";
import { ListingWorkspaceSwitcher } from "@/components/dashboard/listing-workspace/ListingWorkspaceSwitcher";
import type { ListingWorkspaceContext, ListingSwitcherItem } from "@/lib/listing-workspace-types";
import { formatOwnerListingDate } from "@/lib/dashboard-listings";
import { pickListingCoverPhotoUrl } from "@/lib/listing-media";
import { buildOwnerListingRowModel } from "@/lib/owner-listings-page";
import {
  getFormattedListingPrice,
  getRentalTypeBadgeLabel,
} from "@/lib/rental-types";
import { OWNER_LISTINGS_LIST_PATH } from "@/lib/owner-listings-nav";

type Props = {
  ctx: ListingWorkspaceContext;
  switcherItems: ListingSwitcherItem[];
};

export function ListingWorkspaceHeader({ ctx, switcherItems }: Props) {
  const locale = useLocale();
  const tHeader = useTranslations("Workspace.header");
  const tUi = useTranslations("Owner.uiStatus");
  const tListing = useTranslations("Listing");
  const tCommon = useTranslations("Common");
  const { listing, effectiveStatus, ownerStatusKey, rentalType } = ctx;
  const dateLocale = locale.startsWith("el") ? "el-GR" : "en-US";
  const row = buildOwnerListingRowModel(listing, effectiveStatus);
  const ui = resolveOwnerListingUiStatus(row, locale);
  const statusLabel = tUi(ui.labelKey);
  const helperText = ui.helperValues
    ? tUi(ui.helperKey, ui.helperValues)
    : tUi(ui.helperKey);
  const price = getFormattedListingPrice(listing, tCommon);
  const cover = pickListingCoverPhotoUrl(listing);
  const showActiveUntil =
    (ownerStatusKey === "published" ||
      ownerStatusKey === "paused" ||
      ownerStatusKey === "expired") &&
    listing.expires_at;
  const activeUntil = showActiveUntil
    ? formatOwnerListingDate(listing.expires_at, dateLocale)
    : null;

  return (
    <div className="mb-3 space-y-2">
      <OwnerListingsNavLink
        href={OWNER_LISTINGS_LIST_PATH}
        className="inline-flex min-h-8 items-center gap-1.5 text-[13px] font-medium text-muted transition-colors hover:text-charcoal"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {tHeader("allListings")}
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
              {getRentalTypeBadgeLabel(rentalType, tListing)}
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
                statusKey={mapOwnerStatusKeyToUi(ownerStatusKey)}
                label={statusLabel}
                helperText={null}
                compact
              />
              {activeUntil && (
                <span className="text-[11px] text-muted">
                  {tHeader("until", { date: activeUntil })}
                </span>
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
              {tHeader("edit")}
            </Link>
            <HelpAssistantTrigger
              label={tHeader("helpLabel")}
              seedQuestion={tHeader("helpSeed")}
              className="hidden min-h-8 items-center text-xs font-medium text-muted hover:text-gold-dark sm:inline-flex"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
