"use client";

import { useTranslations } from "next-intl";
import type { ListingPublicDetail } from "@/lib/types";
import { getHouseRulesItems, hasStructuredHouseRules } from "@/lib/house-rules";
import { cn } from "@/lib/utils";

export function ListingHouseRulesSection({
  listing,
  embedded = false,
}: {
  listing: ListingPublicDetail;
  embedded?: boolean;
}) {
  const t = useTranslations("Listing.houseRulesSection");
  const tRules = useTranslations("Listing.houseRules");

  if (!hasStructuredHouseRules(listing)) return null;

  const items = getHouseRulesItems(listing, tRules);

  const body = (
    <>
      {!embedded && <p className="listing-meta mt-3">{t("intro")}</p>}
      <dl className={cn("listing-card space-y-3 p-5", embedded ? "mt-3" : "mt-5")}>
        {items.map((item) => (
          <div key={item.label} className="flex flex-col gap-0.5 sm:flex-row sm:justify-between">
            <dt className="text-sm text-muted">{item.label}</dt>
            <dd className="text-sm font-medium text-charcoal">{item.value}</dd>
          </div>
        ))}
      </dl>
    </>
  );

  if (embedded) {
    return (
      <div>
        <h3 className="text-sm font-semibold text-charcoal">{t("embeddedTitle")}</h3>
        {body}
      </div>
    );
  }

  return (
    <section id="rules" className="listing-section scroll-mt-28">
      <h2 className="listing-section-title">{t("title")}</h2>
      {body}
    </section>
  );
}
