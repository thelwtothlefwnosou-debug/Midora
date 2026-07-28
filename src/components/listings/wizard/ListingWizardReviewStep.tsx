"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Circle,
  Eye,
  Loader2,
} from "lucide-react";
import { AadeGuideHelperCard } from "@/components/aade/AadeGuideHelperCard";
import {
  buildReviewChecklist,
  countRequiredReviewWarnings,
  isReviewChecklistReady,
  REVIEW_CHECK_GROUPS,
  type ReviewCheckItem,
} from "@/lib/listing-wizard-step-validation";
import { isValidRegistryNumber } from "@/lib/listing-wizard-validation";
import { cn } from "@/lib/utils";
import type { PortalListingFields } from "@/lib/listing-portal-payload";
import {
  formatMonthlyOccupancyReviewSummary,
  listingToMonthlyPricingInput,
} from "@/lib/listing-monthly-price";

type Props = {
  fields: PortalListingFields;
  savedPhotoCount: number;
  photosHydrated?: boolean;
  trustLinksCount?: number;
  listingId?: string | null;
  needsAma: boolean;
  ownerDeclarationAccepted: boolean;
  registryDeclarationAccepted: boolean;
  platformDeclarationAccepted: boolean;
  taxDeclarationAccepted: boolean;
  authorityDeclarationAccepted: boolean;
  termsPrivacyAccepted: boolean;
  listingPhoneReady: boolean;
  onGoToStep: (step: number) => void;
};

function statusIcon(item: ReviewCheckItem) {
  if (item.status === "complete") {
    return <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-teal" />;
  }
  if (item.status === "pending") {
    return <Loader2 className="mt-0.5 h-5 w-5 shrink-0 animate-spin text-muted" />;
  }
  if (item.status === "optional") {
    return <Circle className="mt-0.5 h-5 w-5 shrink-0 text-muted/55" />;
  }
  return <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />;
}

function statusRightLabel(
  item: ReviewCheckItem,
  labels: {
    statusComplete: string;
    statusPending: string;
    statusOptional: string;
    statusMissing: string;
  }
): string {
  if (item.status === "complete") return labels.statusComplete;
  if (item.status === "pending") return labels.statusPending;
  if (item.status === "optional") return labels.statusOptional;
  return labels.statusMissing;
}

export function ListingWizardReviewStep({
  fields,
  savedPhotoCount,
  photosHydrated = true,
  trustLinksCount = 0,
  listingId = null,
  needsAma,
  ownerDeclarationAccepted,
  registryDeclarationAccepted,
  platformDeclarationAccepted,
  taxDeclarationAccepted,
  authorityDeclarationAccepted,
  termsPrivacyAccepted,
  listingPhoneReady,
  onGoToStep,
}: Props) {
  const t = useTranslations("Wizard.review");
  const tChecklist = useTranslations("Wizard.review.checklist");
  const tMonthly = useTranslations("Listing.monthlyPrice");
  const locale = useLocale();
  const statusLabels = {
    statusComplete: t("statusComplete"),
    statusPending: t("statusPending"),
    statusOptional: t("statusOptional"),
    statusMissing: t("statusMissing"),
  };
  const checklistCtx = {
    fields,
    savedPhotoCount,
    photosHydrated,
    trustLinksCount,
    needsAma,
    ownerDeclarationAccepted,
    registryDeclarationAccepted,
    platformDeclarationAccepted,
    taxDeclarationAccepted,
    authorityDeclarationAccepted,
    termsPrivacyAccepted,
    listingPhoneReady,
  };
  const items = buildReviewChecklist(checklistCtx);
  const missingCount = countRequiredReviewWarnings(checklistCtx);
  const ready = isReviewChecklistReady(checklistCtx);
  const hasPending = items.some((item) => item.status === "pending");

  const registryValid =
    needsAma &&
    fields.ama_number &&
    isValidRegistryNumber(fields.legal_registry_type, fields.ama_number);

  const previewHref = listingId ? `/dashboard/listings/${listingId}/view` : null;
  const monthlyPricingSummary =
    fields.supports_monthly && !fields.supports_short_term
      ? formatMonthlyOccupancyReviewSummary(
          listingToMonthlyPricingInput({
            monthly_pricing_mode: fields.monthly_pricing_mode,
            monthly_base_price: fields.monthly_base_price,
            monthly_included_people: fields.monthly_included_people,
            monthly_max_people: fields.monthly_max_people,
            monthly_extra_person_price: fields.monthly_extra_person_price,
            monthly_max_price: fields.monthly_max_price,
            price_monthly: fields.price_monthly,
            max_guests: fields.max_guests,
            monthly_price_tiers: fields.monthly_price_tiers,
          }),
          (key, values) => tMonthly(key, values),
          locale === "en" ? "en-GB" : "el-GR"
        )
      : null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-semibold text-charcoal">
          {t("title")}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          {t("subtitle")}
        </p>
      </div>

      {monthlyPricingSummary ? (
        <div className="rounded-2xl border border-gold/25 bg-[#faf7f2] px-4 py-4">
          <p className="text-sm font-semibold text-charcoal">{monthlyPricingSummary.title}</p>
          <ul className="mt-2 space-y-1 text-sm text-charcoal/80">
            {monthlyPricingSummary.lines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div
        className={cn(
          "rounded-2xl border px-4 py-4 sm:px-5",
          ready
            ? "border-teal/25 bg-teal/[0.06]"
            : "border-amber-200/80 bg-amber-50/80"
        )}
      >
        <p className="text-[15px] font-semibold text-charcoal sm:text-base">
          {ready ? t("ready") : t("missing")}
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">
          {ready ? t("readyBody") : t("missingBody")}
        </p>
        <p
          className={cn(
            "mt-3 text-sm font-medium",
            ready ? "text-teal" : "text-amber-900"
          )}
        >
          {ready
            ? t("allComplete")
            : hasPending
              ? t("checkingSome")
              : t("missingCount", { count: missingCount })}
        </p>
      </div>

      <div className="space-y-5">
        {REVIEW_CHECK_GROUPS.map((group) => {
          const groupItems = items.filter((item) => item.group === group.id);
          if (groupItems.length === 0) return null;
          return (
            <section key={group.id} className="space-y-2.5">
              <h3 className="px-0.5 text-xs font-semibold tracking-wide text-muted uppercase">
                {tChecklist(`groups.${group.labelKey}`)}
              </h3>
              <ul className="overflow-hidden rounded-2xl border border-border bg-white divide-y divide-border">
                {groupItems.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => onGoToStep(item.step)}
                      className="flex w-full items-start gap-3 px-4 py-4 text-left transition-colors hover:bg-sand/30 sm:px-5"
                    >
                      {statusIcon(item)}
                      <span className="min-w-0 flex-1">
                        <span
                          className={cn(
                            "block text-[15px] font-medium leading-snug sm:text-base",
                            item.status === "warning"
                              ? "text-amber-950"
                              : item.status === "optional" || item.status === "pending"
                                ? "text-charcoal/80"
                                : "text-charcoal"
                          )}
                        >
                          {tChecklist(`items.${item.labelKey}`)}
                        </span>
                        {item.subtextKey ? (
                          <span className="mt-1 block text-[13px] leading-snug text-muted sm:text-sm">
                            {tChecklist(
                              `subtext.${item.subtextKey}`,
                              item.subtextParams ?? {}
                            )}
                          </span>
                        ) : null}
                      </span>
                      <span className="flex shrink-0 items-center gap-1.5 pt-0.5">
                        {statusRightLabel(item, statusLabels) ? (
                          <span
                            className={cn(
                              "hidden text-xs font-medium sm:inline",
                              item.status === "complete" && "text-teal",
                              item.status === "warning" && "text-amber-700",
                              (item.status === "optional" || item.status === "pending") &&
                                "text-muted"
                            )}
                          >
                            {statusRightLabel(item, statusLabels)}
                          </span>
                        ) : null}
                        <ChevronRight className="h-4 w-4 text-muted" />
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      {previewHref ? (
        <Link
          href={previewHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-border bg-white px-5 py-2.5 text-sm font-medium text-charcoal transition hover:bg-sand/50 sm:w-auto"
        >
          <Eye className="h-4 w-4 text-gold" />
          {t("previewListing")}
        </Link>
      ) : (
        <p className="text-sm text-muted">
          {t("saveDraftForPreview")}
        </p>
      )}

      <AadeGuideHelperCard
        variant="review"
        defaultTab={
          fields.supports_monthly && !fields.supports_short_term ? "monthly" : "short_term"
        }
      />

      {needsAma && registryValid && (
        <p className="text-xs text-muted">
          {t("registryStatusFilled")}
        </p>
      )}
    </div>
  );
}

export function isReviewReady(
  fields: PortalListingFields,
  savedPhotoCount: number,
  needsAma: boolean,
  ownerDeclarationAccepted: boolean,
  registryDeclarationAccepted: boolean,
  platformDeclarationAccepted: boolean,
  taxDeclarationAccepted: boolean,
  authorityDeclarationAccepted: boolean,
  termsPrivacyAccepted: boolean,
  listingPhoneReady: boolean,
  options?: { photosHydrated?: boolean; trustLinksCount?: number }
): boolean {
  return isReviewChecklistReady({
    fields,
    savedPhotoCount,
    photosHydrated: options?.photosHydrated,
    trustLinksCount: options?.trustLinksCount,
    needsAma,
    ownerDeclarationAccepted,
    registryDeclarationAccepted,
    platformDeclarationAccepted,
    taxDeclarationAccepted,
    authorityDeclarationAccepted,
    termsPrivacyAccepted,
    listingPhoneReady,
  });
}
