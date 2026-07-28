"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { saveShortTermPricingSettings } from "@/lib/listing-pricing-actions";
import type { ListingWithImages } from "@/lib/types";
import { cn } from "@/lib/utils";

const WEEKDAY_OPTIONS = [
  { value: 5, labelKey: "weekdayFriday" },
  { value: 6, labelKey: "weekdaySaturday" },
  { value: 0, labelKey: "weekdaySunday" },
] as const;

type Props = {
  listing: ListingWithImages;
  onSaved?: () => void;
};

function fieldClass() {
  return "mt-1.5 w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm text-charcoal outline-none focus:border-gold/50";
}

export function ShortTermPricingSettings({ listing, onSaved }: Props) {
  const router = useRouter();
  const t = useTranslations("Workspace.pricingSettings");
  const [dirty, setDirty] = useState(false);
  const [weekendDays, setWeekendDays] = useState<number[]>(
    listing.weekend_days?.length ? listing.weekend_days : [5, 6]
  );
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string; success?: boolean } | null, formData: FormData) => {
      const result = await saveShortTermPricingSettings(listing.id, formData);
      if (result.success) {
        setDirty(false);
        onSaved?.();
        router.refresh();
      }
      return result;
    },
    null
  );

  function toggleWeekendDay(day: number) {
    setDirty(true);
    setWeekendDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  }

  return (
    <form action={formAction} onChange={() => setDirty(true)} className="space-y-4">
      <div>
        <h3 className="font-display text-sm font-semibold text-charcoal">{t("title")}</h3>
        <p className="mt-1 text-xs text-muted">
          {t("subtitle")}
        </p>
      </div>

      <div>
        <label className="text-xs font-medium text-muted uppercase">{t("basePrice")}</label>
        <input
          name="price_per_night"
          type="number"
          min={1}
          required
          defaultValue={listing.price_per_night ?? ""}
          className={fieldClass()}
        />
      </div>

      <div>
        <label className="text-xs font-medium text-muted uppercase">{t("weekendPrice")}</label>
        <input
          name="weekend_price_per_night"
          type="number"
          min={1}
          defaultValue={listing.weekend_price_per_night ?? ""}
          placeholder={listing.price_per_night ? String(listing.price_per_night) : t("weekendPricePlaceholder")}
          className={fieldClass()}
        />
        <p className="mt-1 text-[11px] text-muted">
          {t("specialOverride")}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {WEEKDAY_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={cn(
                "cursor-pointer rounded-full border px-2.5 py-1 text-xs",
                weekendDays.includes(opt.value)
                  ? "border-gold bg-gold/10 text-charcoal"
                  : "border-border text-muted"
              )}
            >
              <input
                type="checkbox"
                name="weekend_days"
                value={opt.value}
                checked={weekendDays.includes(opt.value)}
                onChange={() => toggleWeekendDay(opt.value)}
                className="sr-only"
              />
              {t(opt.labelKey)}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-muted uppercase">{t("minStay")}</label>
        <input
          name="minimum_stay_nights"
          type="number"
          min={1}
          defaultValue={listing.minimum_stay_nights ?? 2}
          className={fieldClass()}
        />
      </div>

      <div>
        <label className="text-xs font-medium text-muted uppercase">
          {t("cleaningFee")} <span className="font-normal normal-case">{t("optional")}</span>
        </label>
        <input
          name="cleaning_fee_note"
          type="text"
          defaultValue={listing.cleaning_fee_note ?? ""}
          placeholder={t("cleaningFeePlaceholder")}
          className={fieldClass()}
        />
        <p className="mt-1 text-[11px] text-muted">
          {t("cleaningFeeHint")}
        </p>
      </div>

      <div className="border-t border-border pt-4">
        <p className="text-xs font-medium text-muted uppercase">{t("discountsTitle")}</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-[11px] text-muted">{t("weeklyDiscount")}</label>
            <input
              name="weekly_discount_percent"
              type="number"
              min={0}
              max={90}
              defaultValue={listing.weekly_discount_percent ?? ""}
              placeholder={t("weeklyDiscountPlaceholder")}
              className={fieldClass()}
            />
          </div>
          <div>
            <label className="text-[11px] text-muted">{t("monthlyDiscount")}</label>
            <input
              name="monthly_discount_percent"
              type="number"
              min={0}
              max={90}
              defaultValue={listing.monthly_discount_percent ?? ""}
              placeholder={t("monthlyDiscountPlaceholder")}
              className={fieldClass()}
            />
          </div>
        </div>
        {!listing.weekly_discount_percent && !listing.monthly_discount_percent && (
          <p className="mt-2 text-[11px] text-muted">
            {t("discountHint")}
          </p>
        )}
        <p className="mt-2 text-[11px] text-muted">
          {t("discountConditions")}
        </p>
      </div>

      {state?.error && (
        <p className="text-xs text-red-500">{state.error}</p>
      )}
      {state?.success && !dirty && (
        <p className="text-xs text-teal">{t("saved")}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-gold py-2.5 text-sm font-semibold text-white hover:bg-gold-dark disabled:opacity-60"
      >
        {pending ? t("saving") : t("saveSettings")}
      </button>
    </form>
  );
}
