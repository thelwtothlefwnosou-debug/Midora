"use client";

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
  if (!price) return null;

  if (variant === "public") {
    return (
      <div className="rounded-2xl border border-charcoal/8 bg-sand/20 p-4">
        <p className="listing-price-display text-xl text-charcoal">
          {formatPublicStayPriceTotal(price.total)}
        </p>
        <p className="mt-0.5 text-sm text-muted">
          {formatPublicStayPriceNightsLine(price.nights)}
        </p>
        {price.discountAmount > 0 && price.discountLabel && (
          <p className="mt-2 text-sm text-teal">
            {price.discountLabel}: -€{price.discountAmount.toLocaleString("el-GR")}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-dashed border-gold/30 bg-gold/5 p-4">
      <p className="text-xs font-medium tracking-wide text-muted uppercase">
        Πώς θα εμφανιστεί στον ενδιαφερόμενο
      </p>
      <div className="mt-3 space-y-1 text-sm text-charcoal">
        <p>
          {price.nights} {price.nights === 1 ? "νύχτα" : "νύχτες"} × €
          {Math.round(price.subtotal / price.nights).toLocaleString("el-GR")} = €
          {price.subtotal.toLocaleString("el-GR")}
        </p>
        {price.discountAmount > 0 && price.discountLabel && (
          <p className="text-teal">
            {price.discountLabel}: -€{price.discountAmount.toLocaleString("el-GR")}
          </p>
        )}
        <p className="font-semibold">
          Σύνολο: €{price.total.toLocaleString("el-GR")}
        </p>
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-muted">
        Η τιμή είναι ενδικτική και επιβεβαιώνεται από εσένα πριν συμφωνήσεις με τον
        ενδιαφερόμενο.
      </p>
    </div>
  );
}
