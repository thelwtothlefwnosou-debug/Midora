"use client";

import Link from "next/link";
import { ArrowLeft, Eye, MoreHorizontal, Pencil } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { DashboardListingCover } from "@/components/dashboard/DashboardListingCover";
import { DashboardListingStatusBadge } from "@/components/dashboard/DashboardListingStatusBadge";
import {
  mapOwnerStatusKeyToUi,
  resolveOwnerListingUiStatus,
  listingNeedsContinueCompletion,
  ownerListingContinueWizardHref,
} from "@/lib/owner-listing-ui-status";
import { OwnerListingsNavLink } from "@/components/dashboard/OwnerListingsNavLink";
import { HelpAssistantTrigger } from "@/components/assistant/HelpAssistantContext";
import { ListingWorkspaceSwitcher } from "@/components/dashboard/listing-workspace/ListingWorkspaceSwitcher";
import type {
  ListingWorkspaceContext,
  ListingSwitcherItem,
} from "@/lib/listing-workspace-types";
import { formatOwnerListingDate } from "@/lib/dashboard-listings";
import { pickListingCoverPhotoUrl } from "@/lib/listing-media";
import { buildOwnerListingRowModel } from "@/lib/owner-listings-page";
import { getRentalTypeBadgeLabel } from "@/lib/rental-types";
import { getListingPublicId } from "@/lib/utils";
import { OWNER_LISTINGS_LIST_PATH } from "@/lib/owner-listings-nav";
import { Button } from "@/components/ui/Button";

type Props = {
  ctx: ListingWorkspaceContext;
  switcherItems: ListingSwitcherItem[];
};

export function ListingWorkspaceHeader({ ctx, switcherItems }: Props) {
  const locale = useLocale();
  const tHeader = useTranslations("Workspace.header");
  const tContinue = useTranslations("Workspace.continueCompletion");
  const tUi = useTranslations("Owner.uiStatus");
  const tListing = useTranslations("Listing");
  const { listing, effectiveStatus, ownerStatusKey, rentalType } = ctx;
  const dateLocale = locale.startsWith("el") ? "el-GR" : "en-US";
  const row = buildOwnerListingRowModel(listing, effectiveStatus);
  const ui = resolveOwnerListingUiStatus(row, locale);
  const statusLabel = tUi(ui.labelKey);
  const helperText = ui.helperValues
    ? tUi(ui.helperKey, ui.helperValues)
    : tUi(ui.helperKey);
  const cover = pickListingCoverPhotoUrl(listing);
  const needsContinue = listingNeedsContinueCompletion(row);
  const continueHref = ownerListingContinueWizardHref(listing.id);
  const previewHref = `/dashboard/listings/${listing.id}/view`;
  const publicHref = `/listings/${getListingPublicId(listing)}`;
  const completenessHref = `/dashboard/listings/${listing.id}#listing-completeness`;
  const showActiveUntil =
    (ownerStatusKey === "published" ||
      ownerStatusKey === "paused" ||
      ownerStatusKey === "expired") &&
    listing.expires_at;
  const activeUntil = showActiveUntil
    ? formatOwnerListingDate(listing.expires_at, dateLocale)
    : null;

  const showCompletionMeta =
    needsContinue &&
    (row.completenessPercent < 100 || row.missingRequiredCount > 0);

  const isPublished =
    ownerStatusKey === "published" || ownerStatusKey === "paused";
  const isNeedsFixes = ownerStatusKey === "needs_fixes" || ui.key === "needs_fixes";

  let primaryHref = previewHref;
  let primaryLabel = tHeader("preview");
  if (needsContinue && !isNeedsFixes) {
    primaryHref = continueHref;
    primaryLabel = tContinue("continueCta");
  } else if (isNeedsFixes) {
    primaryHref = completenessHref;
    primaryLabel = tHeader("seeFixes");
  } else if (isPublished) {
    primaryHref = publicHref;
    primaryLabel = tHeader("viewListing");
  }

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

      <div className="rounded-2xl border border-border bg-white px-3 py-3 shadow-soft sm:px-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="relative h-14 w-[72px] shrink-0 overflow-hidden rounded-xl sm:h-[4.25rem] sm:w-[5.5rem]">
              <DashboardListingCover
                src={cover}
                compact
                roundedClassName="rounded-xl"
              />
              <span className="absolute bottom-1 left-1 rounded-md bg-charcoal/90 px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-white">
                {getRentalTypeBadgeLabel(rentalType, tListing)}
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="line-clamp-1 font-display text-base font-semibold tracking-tight text-charcoal sm:text-[17px]">
                {listing.title || tHeader("untitled")}
              </h2>
              <p className="mt-0.5 line-clamp-1 text-xs text-muted">
                {listing.area_display_name || listing.area},{" "}
                {listing.city_display_name || listing.city}
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                <DashboardListingStatusBadge
                  statusKey={mapOwnerStatusKeyToUi(ownerStatusKey)}
                  label={statusLabel}
                  helperText={null}
                  compact
                />
                {showCompletionMeta ? (
                  <>
                    <span className="text-[11px] font-medium text-charcoal/80">
                      {tHeader("completionPercent", {
                        percent: row.completenessPercent,
                      })}
                    </span>
                    {row.missingRequiredCount > 0 ? (
                      <span className="text-[11px] text-muted">
                        {tHeader("missingCount", {
                          count: row.missingRequiredCount,
                        })}
                      </span>
                    ) : null}
                  </>
                ) : null}
                {activeUntil ? (
                  <span className="text-[11px] text-muted">
                    {tHeader("until", { date: activeUntil })}
                  </span>
                ) : null}
              </div>
              {helperText ? (
                <p className="mt-1 line-clamp-1 text-[11px] text-muted">
                  {helperText}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:items-end">
            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
              <Button href={primaryHref} size="sm" className="min-w-0 flex-1 sm:flex-none">
                {primaryLabel}
              </Button>
              {isPublished || needsContinue ? (
                <Link
                  href={previewHref}
                  className="inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-xl border border-border bg-white px-3 text-sm font-medium text-charcoal hover:bg-sand/50 sm:flex-none"
                >
                  <Eye className="h-3.5 w-3.5 text-muted" />
                  {tHeader("preview")}
                </Link>
              ) : null}
              <details className="relative">
                <summary
                  className="inline-flex min-h-9 min-w-9 cursor-pointer list-none items-center justify-center rounded-xl border border-border bg-white text-charcoal hover:bg-sand/50 [&::-webkit-details-marker]:hidden"
                  aria-label={tHeader("moreActions")}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </summary>
                <div className="absolute right-0 z-30 mt-1.5 min-w-[11rem] rounded-xl border border-border bg-white p-1.5 shadow-soft">
                  <Link
                    href={`/dashboard/listings/${listing.id}/edit`}
                    className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-charcoal hover:bg-sand/60"
                  >
                    <Pencil className="h-3.5 w-3.5 text-muted" />
                    {tHeader("edit")}
                  </Link>
                  {needsContinue ? (
                    <Link
                      href={continueHref}
                      className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-charcoal hover:bg-sand/60"
                    >
                      {tContinue("continueCta")}
                    </Link>
                  ) : null}
                  <div className="border-t border-border/70 px-1 py-1">
                    <HelpAssistantTrigger
                      label={tHeader("helpLabel")}
                      seedQuestion={tHeader("helpSeed")}
                      className="flex w-full items-center rounded-lg px-1.5 py-1.5 text-left text-sm text-muted hover:bg-sand/60 hover:text-charcoal"
                    />
                  </div>
                </div>
              </details>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
