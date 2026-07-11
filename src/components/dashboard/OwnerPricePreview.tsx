"use client";

import type { IndicativeStayPrice } from "@/lib/listing-short-term-price";

type Props = {
  price: IndicativeStayPrice | null;
  variant?: "owner" | "public";
};

export function OwnerPricePreview({ price, variant = "owner" }: Props) {
  if (!price) return null;

  return (
    <div className="rounded-2xl border border-dashed border-gold/30 bg-gold/5 p-4">
      <p className="text-xs font-medium tracking-wide text-muted uppercase">
        {variant === "owner"
          ? "Πώς θα εμφανιστεί στον ενδιαφερόμενο"
          : "Ενδεικτική τιμή"}
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
          Ενδεικτική τιμή: €{price.total.toLocaleString("el-GR")}
        </p>
      </div>
      {variant === "owner" && (
        <p className="mt-3 text-[11px] leading-relaxed text-muted">
          Η τιμή είναι ενδεικτική και επιβεβαιώνεται από εσένα πριν συμφωνήσεις με τον
          ενδιαφερόμενο.
        </p>
      )}
      {variant === "public" && (
        <p className="mt-2 text-[11px] text-muted">
          Η τελική διαθεσιμότητα και τιμή επιβεβαιώνονται από τον ιδιοκτήτη.
        </p>
      )}
    </div>
  );
}
