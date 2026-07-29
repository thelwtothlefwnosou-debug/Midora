"use client";

import Link from "next/link";
import { AlertCircle, ArrowRight, ClipboardList } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import type { OwnerListingRowModel } from "@/lib/owner-listings-page";
import {
  listingNeedsContinueCompletion,
  ownerListingContinueWizardHref,
  resolveOwnerListingUiStatus,
} from "@/lib/owner-listing-ui-status";
import {
  shortTermCompletenessItems,
} from "@/lib/listing-completeness";
import { listingSupportsShortTerm } from "@/lib/rental-types";
import { MIN_LISTING_PHOTOS_FOR_REVIEW } from "@/lib/constants";
import { cn } from "@/lib/utils";

type Props = {
  row: OwnerListingRowModel;
  amenityCount?: number;
  className?: string;
};

export function ListingContinueCompletionCard({
  row,
  amenityCount = 0,
  className,
}: Props) {
  const t = useTranslations("Workspace.continueCompletion");
  const tItems = useTranslations("Workspace.completenessItems");

  if (!listingNeedsContinueCompletion(row)) return null;

  const ui = resolveOwnerListingUiStatus(row);
  const isNeedsFixes =
    row.ownerStatusKey === "needs_fixes" || ui.key === "needs_fixes";
  const wizardHref = ownerListingContinueWizardHref(row.listing.id);
  const checklistHref = `#listing-completeness`;

  const missingLabels: string[] = [];
  if (listingSupportsShortTerm(row.listing)) {
    const items = shortTermCompletenessItems(
      row.listing,
      row.photoCount,
      amenityCount
    );
    for (const item of items.filter((i) => i.required && !i.done).slice(0, 4)) {
      if (item.id === "photos") {
        missingLabels.push(
          tItems("photos", { count: MIN_LISTING_PHOTOS_FOR_REVIEW })
        );
      } else {
        try {
          missingLabels.push(tItems(item.id as "basics"));
        } catch {
          missingLabels.push(item.id);
        }
      }
    }
  }

  const missingCount =
    missingLabels.length > 0 ? missingLabels.length : row.missingRequiredCount;

  return (
    <section
      className={cn(
        "rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/90 via-white to-sand/40 p-4 shadow-soft sm:p-5",
        className
      )}
      data-testid="listing-continue-completion"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
              <AlertCircle className="h-4 w-4" strokeWidth={1.75} />
            </span>
            <div className="min-w-0">
              <h3 className="font-display text-base font-semibold tracking-tight text-charcoal sm:text-lg">
                {isNeedsFixes ? t("needsFixesTitle") : t("title")}
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-muted">
                {isNeedsFixes ? t("needsFixesBody") : t("body")}
              </p>

              {missingCount > 0 ? (
                <div className="mt-3">
                  <p className="text-xs font-medium text-charcoal/80">
                    {t("missingCount", { count: missingCount })}
                  </p>
                  {missingLabels.length > 0 ? (
                    <ul className="mt-1.5 flex flex-wrap gap-1.5">
                      {missingLabels.map((label) => (
                        <li
                          key={label}
                          className="rounded-full border border-border bg-white/80 px-2.5 py-0.5 text-[11px] text-muted"
                        >
                          {label}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:min-w-[200px]">
          <Button href={wizardHref} className="w-full justify-center sm:w-auto">
            {isNeedsFixes ? t("fixCta") : t("continueCta")}
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Link
            href={checklistHref}
            className="inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-full border border-border bg-white px-4 text-sm font-medium text-charcoal transition hover:bg-sand/50 sm:w-auto"
          >
            <ClipboardList className="h-3.5 w-3.5 text-muted" />
            {t("seeMissing")}
          </Link>
        </div>
      </div>
    </section>
  );
}
