"use client";

import { useTranslations } from "next-intl";
import type { ListingPublicDetail } from "@/lib/types";
import { formatAmaDisplay } from "@/lib/rental-types";

export function ListingRegistrySection({
  listing,
  embedded = false,
}: {
  listing: ListingPublicDetail;
  embedded?: boolean;
}) {
  const t = useTranslations("Listing.registrySection");
  const display = formatAmaDisplay(listing);
  if (!display) return null;

  const content = (
    <div className="rounded-xl border border-teal/20 bg-teal/5 px-4 py-4">
      <p className="text-sm text-charcoal">
        {t("numberLabel")}{" "}
        <span className="font-semibold">{display.replace(/^(ΑΜΑ|ΕΣΛ|ΜΑΓ): /, "")}</span>
        <span className="ml-1 text-muted">
          ({display.startsWith("ΕΣΛ") ? "ΕΣΛ" : display.startsWith("ΜΑΓ") ? "ΜΑΓ" : "ΑΜΑ"})
        </span>
      </p>
      <p className="mt-2 text-xs leading-relaxed text-muted">{t("disclaimer")}</p>
    </div>
  );

  if (embedded) {
    return (
      <div>
        <h3 className="text-sm font-semibold text-charcoal">{t("title")}</h3>
        <div className="mt-3">{content}</div>
      </div>
    );
  }

  return (
    <section id="registry" className="listing-section scroll-mt-28">
      <h2 className="listing-section-title">{t("title")}</h2>
      <div className="mt-4">{content}</div>
    </section>
  );
}
