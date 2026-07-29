"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import type { OwnerListingRowModel, OwnerListingsOverview } from "@/lib/owner-listings-page";
import { OWNER_LISTING_NEW_PATH } from "@/lib/owner-flow";
import { ownerListingContinueWizardHref } from "@/lib/owner-listing-ui-status";
import { cn } from "@/lib/utils";

type Props = {
  rows: OwnerListingRowModel[];
  overview: OwnerListingsOverview;
};

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="min-w-[7.5rem] flex-1 rounded-2xl border border-border bg-white px-3.5 py-3 shadow-soft">
      <p className="text-[11px] font-medium tracking-wide text-muted uppercase">{label}</p>
      <p
        className={cn(
          "mt-1 font-display text-xl font-semibold tabular-nums tracking-tight",
          highlight ? "text-gold-dark" : "text-charcoal"
        )}
      >
        {value}
      </p>
    </div>
  );
}

export function OwnerHomeMetaStrip({ rows, overview }: Props) {
  const t = useTranslations("Owner.homeMetaStrip");
  const drafts = rows.filter((r) => r.ownerStatusKey === "draft").length;
  const needsAction = overview.needsActionCount;

  return (
    <div className="flex flex-wrap gap-2.5">
      <Stat label={t("published")} value={String(overview.activeCount)} />
      <Stat label={t("drafts")} value={String(drafts)} />
      <Stat
        label={t("needsAction")}
        value={String(needsAction)}
        highlight={needsAction > 0}
      />
      <Stat
        label={t("requests")}
        value={String(overview.newInquiries)}
        highlight={overview.newInquiries > 0}
      />
    </div>
  );
}

export function OwnerHomeNextAction({
  rows,
  overview,
}: {
  rows: OwnerListingRowModel[];
  overview: OwnerListingsOverview;
}) {
  const t = useTranslations("Owner.home.nextAction");

  let href = "/dashboard/listings";
  let title = t("viewTitle");
  let body = t("viewBody");
  let cta = t("viewCta");

  if (rows.length === 0) {
    href = OWNER_LISTING_NEW_PATH;
    title = t("firstTitle");
    body = t("firstBody");
    cta = t("firstCta");
  } else {
    const incomplete =
      rows.find((r) => r.ownerStatusKey === "needs_fixes") ??
      rows.find((r) => r.ownerStatusKey === "draft") ??
      rows.find(
        (r) =>
          r.completenessPercent < 100 &&
          r.ownerStatusKey !== "published" &&
          r.ownerStatusKey !== "paused" &&
          r.ownerStatusKey !== "review"
      );
    if (incomplete) {
      href = ownerListingContinueWizardHref(incomplete.listing.id);
      title = t("continueTitle");
      body = t("continueBody");
      cta = t("continueCta");
    } else if (overview.activeCount > 0) {
      href = "/dashboard/listings";
      title = t("viewTitle");
      body = t("viewBody");
      cta = t("viewCta");
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-white p-4 shadow-soft sm:flex sm:items-center sm:justify-between sm:gap-4 sm:p-5">
      <div className="min-w-0">
        <p className="text-[11px] font-medium tracking-wide text-gold-dark uppercase">
          {t("eyebrow")}
        </p>
        <h2 className="mt-1 font-display text-lg font-semibold tracking-tight text-charcoal">
          {title}
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-muted">{body}</p>
      </div>
      <Link
        href={href}
        className="mt-4 inline-flex shrink-0 items-center justify-center rounded-full bg-charcoal px-5 py-2.5 text-sm font-medium text-white transition hover:bg-charcoal/90 sm:mt-0"
      >
        {cta}
      </Link>
    </section>
  );
}
