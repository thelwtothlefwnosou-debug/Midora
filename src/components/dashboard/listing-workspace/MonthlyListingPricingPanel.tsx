"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  EMPTY_MONTHLY_OCCUPANCY_PRICING,
  MonthlyOccupancyPricingFields,
  type MonthlyOccupancyPricingValue,
} from "@/components/listings/wizard/MonthlyOccupancyPricingFields";
import { WorkspaceSectionCard } from "@/components/dashboard/listing-workspace/WorkspaceSectionCard";
import { saveMonthlyPricingSettings } from "@/lib/listing-pricing-actions";
import { buildExtraPersonExamples } from "@/lib/listing-monthly-price";
import type { Listing } from "@/lib/types";

type Props = {
  listing: Listing;
};

function initialValue(listing: Listing): MonthlyOccupancyPricingValue {
  const mode =
    listing.monthly_pricing_mode === "fixed" ||
    listing.monthly_pricing_mode === "extra_person" ||
    listing.monthly_pricing_mode === "tiers"
      ? listing.monthly_pricing_mode
      : EMPTY_MONTHLY_OCCUPANCY_PRICING.mode;

  return {
    mode,
    basePrice: String(
      listing.monthly_base_price ?? listing.price_monthly ?? ""
    ),
    includedPeople: String(listing.monthly_included_people ?? 2),
    maxPeople: String(
      listing.monthly_max_people ?? listing.max_guests ?? ""
    ),
    extraPersonPrice: String(listing.monthly_extra_person_price ?? ""),
    maxPrice: String(listing.monthly_max_price ?? ""),
    tiers: [],
  };
}

export function MonthlyListingPricingPanel({ listing }: Props) {
  const router = useRouter();
  const t = useTranslations("Workspace.monthlyPricing");
  const [value, setValue] = useState(() => initialValue(listing));
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  const examples = useMemo(
    () =>
      buildExtraPersonExamples({
        pricingMode: value.mode === "tiers" ? "fixed" : value.mode,
        monthlyBasePrice: Number(value.basePrice) || 0,
        includedPeople: Number(value.includedPeople) || 2,
        maxPeople: Number(value.maxPeople) || Number(value.includedPeople) || 2,
        extraPersonPrice: Number(value.extraPersonPrice) || 0,
        maxPrice: Number(value.maxPrice) || null,
      }),
    [value]
  );

  function handleSave() {
    setError(null);
    setSaved(false);
    const fd = new FormData();
    fd.set("monthly_pricing_mode", value.mode);
    fd.set("monthly_base_price", value.basePrice);
    fd.set("price_monthly", value.basePrice);
    fd.set("monthly_included_people", value.includedPeople || "2");
    if (value.maxPeople) fd.set("monthly_max_people", value.maxPeople);
    if (value.extraPersonPrice !== "") {
      fd.set("monthly_extra_person_price", value.extraPersonPrice);
    } else if (value.mode === "extra_person") {
      fd.set("monthly_extra_person_price", "0");
    }
    if (value.maxPrice) fd.set("monthly_max_price", value.maxPrice);
    if (value.mode === "tiers") {
      fd.set("monthly_price_tiers_json", JSON.stringify(value.tiers));
    }

    startTransition(async () => {
      const result = await saveMonthlyPricingSettings(listing.id, fd);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <div className="max-w-2xl space-y-4">
      <WorkspaceSectionCard title={t("title")} description={t("subtitle")}>
        <MonthlyOccupancyPricingFields value={value} onChange={setValue} />

        {examples.length > 0 ? (
          <div className="mt-4 rounded-xl border border-border bg-sand/20 px-3.5 py-3">
            <p className="text-xs font-medium tracking-wide text-muted uppercase">
              {t("previewTitle")}
            </p>
            <ul className="mt-2 space-y-1 text-sm text-charcoal">
              {examples.slice(0, 4).map((ex) => (
                <li key={ex.people}>
                  {t("previewRow", { people: ex.people, price: ex.price })}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {error ? (
          <p className="mt-3 text-sm text-red-600">{error}</p>
        ) : null}
        {saved ? (
          <p className="mt-3 text-sm text-teal">{t("saved")}</p>
        ) : null}

        <button
          type="button"
          onClick={handleSave}
          disabled={pending}
          className="mt-4 inline-flex min-h-10 items-center rounded-xl bg-charcoal px-4 text-sm font-semibold text-white hover:bg-charcoal/90 disabled:opacity-50"
        >
          {pending ? t("saving") : t("save")}
        </button>
      </WorkspaceSectionCard>
    </div>
  );
}
