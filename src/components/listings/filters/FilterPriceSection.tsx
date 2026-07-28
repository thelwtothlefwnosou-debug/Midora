"use client";

import { useCallback, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { PriceHistogramBucket } from "@/lib/listing-price-histogram";
import { cn } from "@/lib/utils";

type Props = {
  isShort: boolean;
  histogram: { buckets: PriceHistogramBucket[]; min: number; max: number };
  minValue: string;
  maxValue: string;
  onMinChange: (v: string) => void;
  onMaxChange: (v: string) => void;
};

type PricePreset = {
  id: string;
  labelKey:
    | "presetTo50"
    | "preset50_100"
    | "preset100_150"
    | "preset150Plus"
    | "presetTo800"
    | "preset800_1200"
    | "preset1200_1600"
    | "preset1600Plus";
  min?: number;
  max?: number;
};

const SHORT_PRESETS: PricePreset[] = [
  { id: "to-50", labelKey: "presetTo50", max: 50 },
  { id: "50-100", labelKey: "preset50_100", min: 50, max: 100 },
  { id: "100-150", labelKey: "preset100_150", min: 100, max: 150 },
  { id: "150-plus", labelKey: "preset150Plus", min: 150 },
];

const MONTHLY_PRESETS: PricePreset[] = [
  { id: "to-800", labelKey: "presetTo800", max: 800 },
  { id: "800-1200", labelKey: "preset800_1200", min: 800, max: 1200 },
  { id: "1200-1600", labelKey: "preset1200_1600", min: 1200, max: 1600 },
  { id: "1600-plus", labelKey: "preset1600Plus", min: 1600 },
];

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

function formatEuro(n: number, locale: string): string {
  return n.toLocaleString(locale === "en" ? "en-GB" : "el-GR");
}

function parsePriceInput(raw: string): number | null {
  const cleaned = raw.replace(/[^\d]/g, "");
  if (!cleaned) return null;
  const n = parseInt(cleaned, 10);
  return Number.isNaN(n) ? null : n;
}

function presetMatches(
  preset: PricePreset,
  minValue: string,
  maxValue: string
): boolean {
  const curMin = minValue ? parseInt(minValue, 10) : null;
  const curMax = maxValue ? parseInt(maxValue, 10) : null;
  if (preset.min != null) {
    if (curMin !== preset.min) return false;
  } else if (curMin != null) {
    return false;
  }
  if (preset.max != null) {
    if (curMax !== preset.max) return false;
  } else if (curMax != null) {
    return false;
  }
  return true;
}

export function FilterPriceSection({
  isShort,
  histogram,
  minValue,
  maxValue,
  onMinChange,
  onMaxChange,
}: Props) {
  const t = useTranslations("Listings.filter");
  const locale = useLocale();
  const { min: boundMin, max: boundMax, buckets } = histogram;
  const presets = isShort ? SHORT_PRESETS : MONTHLY_PRESETS;

  const minNum = minValue ? parseInt(minValue, 10) : boundMin;
  const maxNum = maxValue ? parseInt(maxValue, 10) : boundMax;

  const sliderMin = clamp(minNum, boundMin, boundMax);
  const sliderMax = clamp(maxNum, boundMin, boundMax);
  const rangeSpan = Math.max(boundMax - boundMin, 1);
  const leftPct = ((sliderMin - boundMin) / rangeSpan) * 100;
  const rightPct = ((sliderMax - boundMin) / rangeSpan) * 100;

  const maxCount = useMemo(
    () => Math.max(1, ...buckets.map((b) => b.count)),
    [buckets]
  );

  const rangeSummary = useMemo(() => {
    const lo = minValue ? parseInt(minValue, 10) : boundMin;
    const hi = maxValue ? parseInt(maxValue, 10) : boundMax;
    const base = `€${formatEuro(lo, locale)} – €${formatEuro(hi, locale)}`;
    return isShort ? base : `${base} ${t("perMonthSuffix")}`;
  }, [minValue, maxValue, boundMin, boundMax, isShort, locale, t]);

  const setRange = useCallback(
    (nextMin: number, nextMax: number) => {
      const lo = clamp(nextMin, boundMin, boundMax);
      const hi = clamp(nextMax, boundMin, boundMax);
      const orderedMin = Math.min(lo, hi);
      const orderedMax = Math.max(lo, hi);
      onMinChange(orderedMin <= boundMin ? "" : String(orderedMin));
      onMaxChange(orderedMax >= boundMax ? "" : String(orderedMax));
    },
    [boundMin, boundMax, onMinChange, onMaxChange]
  );

  function applyPreset(preset: PricePreset) {
    onMinChange(preset.min != null ? String(preset.min) : "");
    onMaxChange(preset.max != null ? String(preset.max) : "");
  }

  function handleMinInput(raw: string) {
    if (!raw.trim()) {
      onMinChange("");
      return;
    }
    const n = parsePriceInput(raw);
    if (n == null) return;
    const hi = maxValue ? parseInt(maxValue, 10) : boundMax;
    setRange(n, hi);
  }

  function handleMaxInput(raw: string) {
    if (!raw.trim()) {
      onMaxChange("");
      return;
    }
    const n = parsePriceInput(raw);
    if (n == null) return;
    const lo = minValue ? parseInt(minValue, 10) : boundMin;
    setRange(lo, n);
  }

  const hasActiveFilter = Boolean(minValue || maxValue);

  return (
    <details className="group border-b border-charcoal/8 last:border-b-0" open>
      <summary className="flex cursor-pointer list-none items-center gap-3 py-3.5 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0 flex-1 font-display text-base font-semibold text-charcoal">
          {isShort ? t("pricePerNight") : t("pricePerMonth")}
        </span>
        <span
          className={cn(
            "filter-price-range-badge shrink-0 transition-opacity duration-200",
            !hasActiveFilter && "opacity-80"
          )}
          aria-live="polite"
        >
          {rangeSummary}
        </span>
        <ChevronDown
          className="h-5 w-5 shrink-0 text-muted transition-transform group-open:rotate-180"
          aria-hidden
        />
      </summary>

      <div className="filter-price-section pb-4">
        {/* Histogram */}
        <div className="filter-price-histogram" aria-hidden>
          {buckets.map((bucket, i) => {
            const inRange = bucket.max >= sliderMin && bucket.min <= sliderMax;
            const h = Math.max(8, (bucket.count / maxCount) * 100);
            return (
              <div key={i} className="filter-price-histogram__bar-wrap">
                <div
                  className={cn(
                    "filter-price-histogram__bar",
                    inRange && "filter-price-histogram__bar--active"
                  )}
                  style={{ height: `${h}%` }}
                />
              </div>
            );
          })}
        </div>

        {/* Dual slider */}
        <div className="filter-price-slider">
          <div className="filter-price-slider__track" />
          <div
            className="filter-price-slider__track-active"
            style={{ left: `${leftPct}%`, right: `${100 - rightPct}%` }}
          />
          <input
            type="range"
            min={boundMin}
            max={boundMax}
            value={sliderMin}
            onChange={(e) => {
              const n = parseInt(e.target.value, 10);
              setRange(n, sliderMax);
            }}
            className="filter-price-range filter-price-range--min"
            aria-label={t("minPrice")}
            aria-valuemin={boundMin}
            aria-valuemax={boundMax}
            aria-valuenow={sliderMin}
          />
          <input
            type="range"
            min={boundMin}
            max={boundMax}
            value={sliderMax}
            onChange={(e) => {
              const n = parseInt(e.target.value, 10);
              setRange(sliderMin, n);
            }}
            className="filter-price-range filter-price-range--max"
            aria-label={t("maxPrice")}
            aria-valuemin={boundMin}
            aria-valuemax={boundMax}
            aria-valuenow={sliderMax}
          />
        </div>

        {/* Min / max inputs */}
        <div className="filter-price-inputs">
          <PriceInput
            label={t("minPrice")}
            value={minValue}
            placeholder={formatEuro(boundMin, locale)}
            boundMin={boundMin}
            boundMax={boundMax}
            locale={locale}
            onChange={handleMinInput}
          />
          <PriceInput
            label={t("maxPrice")}
            value={maxValue}
            placeholder={formatEuro(boundMax, locale)}
            boundMin={boundMin}
            boundMax={boundMax}
            locale={locale}
            onChange={handleMaxInput}
          />
        </div>

        {/* Quick presets */}
        <div className="filter-price-presets">
          {presets.map((preset) => {
            const active = presetMatches(preset, minValue, maxValue);
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset)}
                className={cn(
                  "filter-price-preset",
                  active && "filter-price-preset--active"
                )}
              >
                {t(preset.labelKey)}
              </button>
            );
          })}
        </div>
      </div>
    </details>
  );
}

function PriceInput({
  label,
  value,
  placeholder,
  boundMin,
  boundMax,
  locale,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  boundMin: number;
  boundMax: number;
  locale: string;
  onChange: (raw: string) => void;
}) {
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState("");

  const displayValue = focused
    ? draft
    : value
      ? formatEuro(parseInt(value, 10), locale)
      : "";

  return (
    <label className="filter-price-input">
      <span className="filter-price-input__label">{label}</span>
      <div className="filter-price-input__field">
        <span className="filter-price-input__prefix" aria-hidden>
          €
        </span>
        <input
          type="text"
          inputMode="numeric"
          value={displayValue}
          placeholder={placeholder}
          onFocus={() => {
            setFocused(true);
            setDraft(value);
          }}
          onBlur={() => {
            setFocused(false);
          }}
          onChange={(e) => {
            const raw = e.target.value.replace(/[^\d]/g, "");
            setDraft(raw);
            onChange(raw);
          }}
          className="filter-price-input__control"
          aria-label={label}
          min={boundMin}
          max={boundMax}
        />
      </div>
    </label>
  );
}
