"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import {
  buildExtraPersonExamples,
  type MonthlyPricingMode,
  type MonthlyPriceTier,
} from "@/lib/listing-monthly-price";

export type MonthlyOccupancyPricingValue = {
  mode: MonthlyPricingMode;
  basePrice: string;
  includedPeople: string;
  maxPeople: string;
  extraPersonPrice: string;
  maxPrice: string;
  tiers: MonthlyPriceTier[];
};

type Props = {
  value: MonthlyOccupancyPricingValue;
  onChange: (next: MonthlyOccupancyPricingValue) => void;
  inputClassName?: string;
  markDirty?: () => void;
};

const MODE_IDS: MonthlyPricingMode[] = ["fixed", "extra_person", "tiers"];

export const EMPTY_MONTHLY_OCCUPANCY_PRICING: MonthlyOccupancyPricingValue = {
  mode: "extra_person",
  basePrice: "",
  includedPeople: "2",
  maxPeople: "",
  extraPersonPrice: "",
  maxPrice: "",
  tiers: [],
};

export function MonthlyOccupancyPricingFields({
  value,
  onChange,
  inputClassName,
  markDirty,
}: Props) {
  const t = useTranslations("Wizard.pricing");
  const inputClass = cn(
    "mt-1 w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm text-charcoal outline-none focus:border-gold/40",
    inputClassName
  );

  function patch(partial: Partial<MonthlyOccupancyPricingValue>) {
    onChange({ ...value, ...partial });
    markDirty?.();
  }

  function applyRecommendation() {
    patch({
      mode: "extra_person",
      includedPeople: value.includedPeople || "2",
    });
  }

  const examples = buildExtraPersonExamples({
    pricingMode: "extra_person",
    monthlyBasePrice: Number(value.basePrice) || 0,
    includedPeople: Number(value.includedPeople) || 2,
    maxPeople: Number(value.maxPeople) || Number(value.includedPeople) || 2,
    extraPersonPrice: Number(value.extraPersonPrice) || 0,
    maxPrice: Number(value.maxPrice) || null,
  });

  const modeLabel = (id: MonthlyPricingMode) => {
    if (id === "fixed") return t("modeFixed");
    if (id === "extra_person") return t("modeExtraPerson");
    return t("modeTiers");
  };

  return (
    <div className="space-y-4 rounded-xl border border-gold/25 bg-[#faf7f2] p-4">
      <div>
        <h3 className="text-sm font-semibold text-charcoal">{t("occupancyTitle")}</h3>
        <p className="mt-1 text-sm text-charcoal/70">{t("occupancySubtitle")}</p>
      </div>

      <div className="rounded-xl border border-charcoal/8 bg-white px-3.5 py-3">
        <p className="text-xs font-semibold tracking-wide text-gold-dark uppercase">
          {t("midoraSuggestion")}
        </p>
        <p className="mt-1.5 text-sm text-charcoal/75">{t("midoraSuggestionBody")}</p>
        <button
          type="button"
          onClick={applyRecommendation}
          className="mt-2.5 text-sm font-semibold text-gold-dark hover:underline"
        >
          {t("useSuggested")}
        </button>
      </div>

      <fieldset>
        <legend className="text-xs font-medium tracking-wide text-muted uppercase">
          {t("pricingMode")}
        </legend>
        <div className="mt-2 space-y-2">
          {MODE_IDS.map((id) => (
            <label
              key={id}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-charcoal/8 bg-white px-3 py-2.5 text-sm"
            >
              <input
                type="radio"
                name="monthly_pricing_mode"
                checked={value.mode === id}
                onChange={() => patch({ mode: id })}
                className="accent-gold"
              />
              <span>{modeLabel(id)}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {(value.mode === "fixed" || value.mode === "extra_person") && (
        <label className="block">
          <span className="text-xs text-muted uppercase">
            {value.mode === "fixed" ? t("monthlyPrice") : t("baseMonthlyPrice")}
          </span>
          <input
            type="number"
            min={1}
            placeholder={t("pricePlaceholder")}
            value={value.basePrice}
            onChange={(e) => patch({ basePrice: e.target.value })}
            className={inputClass}
          />
        </label>
      )}

      {value.mode === "extra_person" && (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs text-muted uppercase">{t("baseIncludesUpTo")}</span>
              <input
                type="number"
                min={1}
                value={value.includedPeople}
                onChange={(e) => patch({ includedPeople: e.target.value })}
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className="text-xs text-muted uppercase">{t("maxPeople")}</span>
              <input
                type="number"
                min={1}
                value={value.maxPeople}
                onChange={(e) => patch({ maxPeople: e.target.value })}
                className={inputClass}
              />
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs text-muted uppercase">{t("extraPersonFee")}</span>
              <input
                type="number"
                min={0}
                placeholder={t("extraPersonPlaceholder")}
                value={value.extraPersonPrice}
                onChange={(e) => patch({ extraPersonPrice: e.target.value })}
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className="text-xs text-muted uppercase">{t("maxMonthlyPrice")}</span>
              <input
                type="number"
                min={1}
                placeholder={t("maxPricePlaceholder")}
                value={value.maxPrice}
                onChange={(e) => patch({ maxPrice: e.target.value })}
                className={inputClass}
              />
            </label>
          </div>
          <p className="text-sm text-charcoal/65">{t("autoCalcNote")}</p>
          {examples.length > 0 && Number(value.basePrice) > 0 ? (
            <div className="rounded-xl border border-charcoal/8 bg-white px-3.5 py-3 text-sm text-charcoal/80">
              <p className="font-medium text-charcoal">{t("example")}</p>
              <ul className="mt-1.5 space-y-0.5">
                {examples.map((ex) => (
                  <li key={ex.people}>
                    {ex.people === 1
                      ? t("examplePerson", {
                          count: ex.people,
                          price: ex.price.toLocaleString(),
                        })
                      : t("examplePeople", {
                          count: ex.people,
                          price: ex.price.toLocaleString(),
                        })}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      )}

      {value.mode === "fixed" && (
        <label className="block">
          <span className="text-xs text-muted uppercase">{t("maxPeople")}</span>
          <input
            type="number"
            min={1}
            value={value.maxPeople}
            onChange={(e) => patch({ maxPeople: e.target.value })}
            className={inputClass}
          />
        </label>
      )}

      {value.mode === "tiers" && (
        <div className="space-y-3">
          <label className="block">
            <span className="text-xs text-muted uppercase">{t("maxPeople")}</span>
            <input
              type="number"
              min={1}
              value={value.maxPeople}
              onChange={(e) => patch({ maxPeople: e.target.value })}
              className={inputClass}
            />
          </label>
          {value.tiers.map((tier, index) => (
            <div
              key={index}
              className="grid grid-cols-[1fr_1fr_1fr_auto] items-end gap-2 rounded-xl border border-charcoal/8 bg-white p-3"
            >
              <label className="block">
                <span className="text-[10px] text-muted uppercase">{t("peopleFrom")}</span>
                <input
                  type="number"
                  min={1}
                  value={tier.people_from}
                  onChange={(e) => {
                    const tiers = [...value.tiers];
                    tiers[index] = {
                      ...tier,
                      people_from: parseInt(e.target.value, 10) || 1,
                    };
                    patch({ tiers });
                  }}
                  className={inputClass}
                />
              </label>
              <label className="block">
                <span className="text-[10px] text-muted uppercase">{t("peopleTo")}</span>
                <input
                  type="number"
                  min={1}
                  value={tier.people_to}
                  onChange={(e) => {
                    const tiers = [...value.tiers];
                    tiers[index] = {
                      ...tier,
                      people_to: parseInt(e.target.value, 10) || 1,
                    };
                    patch({ tiers });
                  }}
                  className={inputClass}
                />
              </label>
              <label className="block">
                <span className="text-[10px] text-muted uppercase">{t("eurosPerMonth")}</span>
                <input
                  type="number"
                  min={1}
                  value={tier.monthly_price || ""}
                  onChange={(e) => {
                    const tiers = [...value.tiers];
                    tiers[index] = {
                      ...tier,
                      monthly_price: parseInt(e.target.value, 10) || 0,
                    };
                    patch({ tiers });
                  }}
                  className={inputClass}
                />
              </label>
              <button
                type="button"
                onClick={() =>
                  patch({ tiers: value.tiers.filter((_, i) => i !== index) })
                }
                className="mb-1 rounded-lg px-2 py-2 text-xs font-medium text-muted hover:bg-sand/60 hover:text-charcoal"
              >
                {t("remove")}
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => {
              const last = value.tiers[value.tiers.length - 1];
              const from = last ? last.people_to + 1 : 1;
              const max = Number(value.maxPeople) || from + 1;
              patch({
                tiers: [
                  ...value.tiers,
                  {
                    people_from: from,
                    people_to: Math.min(from + 1, max),
                    monthly_price: Number(value.basePrice) || 1000,
                  },
                ],
              });
            }}
            className="text-sm font-semibold text-gold-dark hover:underline"
          >
            {t("addTier")}
          </button>
          <button
            type="button"
            onClick={() => {
              const max = Math.max(1, Number(value.maxPeople) || 10);
              const base = Number(value.basePrice) || 1000;
              const step = 2;
              const tiers = [];
              for (let from = 1; from <= max; from += step) {
                const to = Math.min(from + step - 1, max);
                const band = Math.ceil(to / step);
                tiers.push({
                  people_from: from,
                  people_to: to,
                  monthly_price: Math.round(base * band),
                });
              }
              patch({ tiers, mode: "tiers" });
            }}
            className="ml-4 text-sm font-medium text-charcoal/70 hover:underline"
          >
            {t("autoTiers")}
          </button>
        </div>
      )}
    </div>
  );
}
