"use client";

import { useTranslations } from "next-intl";
import type { OwnerListingRowModel, OwnerListingsOverview } from "@/lib/owner-listings-page";

type Props = {
  rows: OwnerListingRowModel[];
  overview: OwnerListingsOverview;
};

export function OwnerHomeMetaStrip({ rows, overview }: Props) {
  const t = useTranslations("Owner.homeMetaStrip");
  const inReview = rows.filter(
    (r) => r.ownerStatusKey === "review" || r.ownerStatusKey === "needs_fixes"
  ).length;
  const chips: { label: string; value: string }[] = [
    {
      label: rows.length === 1 ? t("listingOne") : t("listingOther"),
      value: String(rows.length),
    },
  ];

  if (inReview > 0) {
    chips.push({ label: t("inReview"), value: String(inReview) });
  }
  if (overview.activeCount > 0) {
    chips.push({ label: t("active"), value: String(overview.activeCount) });
  }
  if (overview.newInquiries > 0) {
    chips.push({ label: t("newRequests"), value: String(overview.newInquiries) });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip) => (
        <span
          key={chip.label}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1 text-xs text-muted shadow-soft"
        >
          <span className="font-semibold tabular-nums text-charcoal">{chip.value}</span>
          {chip.label}
        </span>
      ))}
    </div>
  );
}
