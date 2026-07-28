"use client";

import { useTranslations } from "next-intl";
import { ListingExternalLinksEditor } from "@/components/dashboard/ListingExternalLinksEditor";
import type { ListingExternalLink } from "@/lib/listing-external-links";

type Props = {
  listingId: string | null;
  initialLinks: ListingExternalLink[];
};

/** Optional create-listing step — skippable; no validation required. */
export function ListingWizardTrustLinksStep({ listingId, initialLinks }: Props) {
  const t = useTranslations("Wizard.trustLinksStep");

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-xl font-semibold text-charcoal">{t("title")}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">{t("subtitle")}</p>
      </div>

      {!listingId ? (
        <p className="rounded-xl border border-border bg-sand/20 px-4 py-3 text-sm text-muted">
          {t("saveDraftFirst")}
        </p>
      ) : (
        <ListingExternalLinksEditor
          listingId={listingId}
          initialLinks={initialLinks}
          showCardChrome={false}
        />
      )}
    </div>
  );
}
