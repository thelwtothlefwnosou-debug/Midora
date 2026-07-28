"use client";

import { useTranslations, useLocale } from "next-intl";
import type { IndicativeStayPrice } from "@/lib/listing-short-term-price";
import {
  formatPublicStayPriceNightsLine,
  formatPublicStayPriceTotal,
} from "@/lib/listing-short-term-price";

type Props = {
  price: IndicativeStayPrice | null;
  variant?: "owner" | "public";
};

export function OwnerPricePreview({ price, variant = "owner" }: Props) {
  const t = useTranslations("Owner.pricePreview");
  const locale = useLocale();

  if (!price) return null;

  if (variant === "public") {
    return (
      <div className="rounded-2xl border border-charcoal/8 bg-sand/20 p-4">
        <p className="listing-price-display text-xl text-charcoal">
          {formatPublicStayPriceTotal(price.total, locale)}
        </p>
        <p className="mt-0.5 text-sm text-muted">
          {formatPublicStayPriceNightsLine(price.nights, locale)}
        </p>
        {price.discountAmount > 0 && price.discountLabel && (
          <p className="mt-2 text-sm text-teal">
            {price.discountLabel}: -€{price.discountAmount.toLocaleString("el-GR")}
          </p>
        )}
      </div>
    );
  }

  const nightLabel = price.nights === 1 ? t("nightOne") : t("nightOther");

  return (
    <div className="rounded-2xl border border-dashed border-gold/30 bg-gold/5 p-4">
      <p className="text-xs font-medium tracking-wide text-muted uppercase">{t("ownerTitle")}</p>
      <div className="mt-3 space-y-1 text-sm text-charcoal">
        <p>
          {price.nights} {nightLabel} × €
          {Math.round(price.subtotal / price.nights).toLocaleString("el-GR")} = €
          {price.subtotal.toLocaleString("el-GR")}
        </p>
        {price.discountAmount > 0 && price.discountLabel && (
          <p className="text-teal">
            {price.discountLabel}: -€{price.discountAmount.toLocaleString("el-GR")}
          </p>
        )}
        <p className="font-semibold">
          {t("total", { amount: price.total.toLocaleString("el-GR") })}
        </p>
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-muted">{t("disclaimer")}</p>
    </div>
  );
}
