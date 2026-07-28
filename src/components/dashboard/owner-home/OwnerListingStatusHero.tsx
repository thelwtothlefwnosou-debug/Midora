"use client";

import Link from "next/link";
import { ImageIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { DashboardListingStatusBadge } from "@/components/dashboard/DashboardListingStatusBadge";
import type { OwnerListingRowModel } from "@/lib/owner-listings-page";
import { resolveOwnerListingUiStatus } from "@/lib/owner-listing-ui-status";
import { formatSubmittedDate } from "@/lib/owner-listing-card-helpers";
import {
  getFormattedListingPrice,
  getRentalTypeBadgeLabel,
  listingRentalType,
} from "@/lib/rental-types";
import { listingManageHref } from "@/lib/listing-workspace-nav";
import { pickListingCoverPhotoUrl } from "@/lib/listing-media";

type Props = {
  row: OwnerListingRowModel;
};

type StatusCopy = {
  title: string;
  description: string;
  primaryCta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
};

function statusCopy(
  row: OwnerListingRowModel,
  t: ReturnType<typeof useTranslations<"Owner.home.hero">>
): StatusCopy {
  const manage = listingManageHref(row.listing.id);
  const publish = `${manage}/publish`;

  switch (row.ownerStatusKey) {
    case "review":
      return {
        title: t("reviewTitle"),
        description: t("reviewDesc"),
        primaryCta: { label: t("seeListing"), href: manage },
        secondaryCta: { label: t("seeReviewStatus"), href: publish },
      };
    case "needs_fixes":
      return {
        title: t("needsFixesTitle"),
        description:
          row.listing.admin_verification_notes?.slice(0, 160) || t("needsFixesFallback"),
        primaryCta: { label: t("fixListing"), href: `${manage}/edit` },
        secondaryCta: { label: t("seeStatus"), href: publish },
      };
    case "draft":
      return {
        title: t("draftTitle"),
        description: t("draftDesc"),
        primaryCta: { label: t("continueDraft"), href: manage },
      };
    case "published":
    case "paused":
      return {
        title: t("publishedTitle"),
        description: t("publishedDesc"),
        primaryCta: { label: t("manageProperty"), href: manage },
      };
    case "expired":
      return {
        title: t("expiredTitle"),
        description: t("expiredDesc"),
        primaryCta: {
          label: t("renewListing"),
          href: `${manage}/pay?reactivate=1`,
        },
      };
    default:
      return {
        title: row.listing.title,
        description: t("defaultDesc"),
        primaryCta: { label: t("manageProperty"), href: manage },
      };
  }
}

export function OwnerListingStatusHero({ row }: Props) {
  const locale = useLocale();
  const t = useTranslations("Owner.home.hero");
  const tUi = useTranslations("Owner.uiStatus");
  const tListing = useTranslations("Listing");
  const tCommon = useTranslations("Common");
  const { listing, ownerStatusKey, completenessPercent } = row;
  const ui = resolveOwnerListingUiStatus(row, locale);
  const copy = statusCopy(row, t);
  const rentalType = listingRentalType(listing);
  const price = getFormattedListingPrice(listing, tCommon);
  const submitted = formatSubmittedDate(
    listing.updated_at ?? listing.created_at,
    locale
  );
  const cover = pickListingCoverPhotoUrl(listing);
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
            <DashboardListingStatusBadge
              statusKey={ui.styleKey}
              label={tUi(ui.labelKey)}
            />
            <h2 className="mt-2 font-display text-lg font-semibold text-charcoal sm:text-xl">
              {copy.title}
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-muted">{copy.description}</p>
            {submitted &&
              (ownerStatusKey === "review" || ownerStatusKey === "needs_fixes") && (
                <p className="mt-2 text-xs text-muted">{t("submittedOn", { date: submitted })}</p>
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
              <dt className="text-[11px] font-medium tracking-wide text-muted uppercase">{t("type")}</dt>
              <dd className="mt-0.5 font-medium text-charcoal">
                {getRentalTypeBadgeLabel(rentalType, tListing)}
              </dd>
            </div>
            {location && (
              <div>
                <dt className="text-[11px] font-medium tracking-wide text-muted uppercase">
                  {t("area")}
                </dt>
                <dd className="mt-0.5 font-medium text-charcoal">{location}</dd>
              </div>
            )}
            <div>
              <dt className="text-[11px] font-medium tracking-wide text-muted uppercase">{t("price")}</dt>
              <dd className="mt-0.5 font-medium text-charcoal">
                {price.amount && price.amount > 0 ? price.display : "—"}
              </dd>
            </div>
            {completenessPercent < 100 && (
              <div>
                <dt className="text-[11px] font-medium tracking-wide text-muted uppercase">
                  {t("completeness")}
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
