"use client";

import { Shield } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { MIDORA_SAFE_COMMUNICATION } from "@/lib/midora-legal-copy";

export const LISTING_TRUST_NOTE =
  process.env.NEXT_PUBLIC_LISTING_TRUST_NOTE ?? MIDORA_SAFE_COMMUNICATION;

type Props = {
  className?: string;
  showPaymentNote?: boolean;
  showTitle?: boolean;
  /** Stronger deposit guidance for short-term vs monthly. */
  rentalMode?: "short_term" | "monthly";
  showDepositWarning?: boolean;
  /** Smaller padding / tighter type for host section. */
  compact?: boolean;
};

export function ListingTrustNote({
  className,
  showPaymentNote = false,
  showTitle = false,
  rentalMode,
  showDepositWarning = false,
  compact = false,
}: Props) {
  const t = useTranslations("Legal.shared");
  const trustNote =
    process.env.NEXT_PUBLIC_LISTING_TRUST_NOTE ?? t("safeComm");
  const depositLine =
    rentalMode === "monthly"
      ? t("depositMonthly")
      : rentalMode === "short_term"
        ? t("depositShortTerm")
        : t("depositShort");

  return (
    <div
      className={cn(
        "flex items-start gap-2.5 rounded-xl border border-charcoal/6 bg-sand/30 text-sm leading-relaxed text-charcoal/75",
        compact ? "px-3 py-2.5" : "px-3.5 py-3",
        className
      )}
    >
      <Shield
        className={cn("shrink-0 text-gold-dark", compact ? "mt-0.5 h-3.5 w-3.5" : "mt-0.5 h-4 w-4")}
        aria-hidden
      />
      <div className={cn(compact ? "space-y-0.5" : "space-y-1")}>
        {showTitle ? (
          <p
            className={cn(
              "font-semibold tracking-wide text-charcoal/85",
              compact ? "text-[11px] uppercase" : "text-xs uppercase"
            )}
          >
            {t("safeCommTitle")}
          </p>
        ) : null}
        <p className={compact ? "text-[13px] leading-snug" : undefined}>{trustNote}</p>
        {showPaymentNote ? (
          <p className="text-[12px] leading-snug text-charcoal/55">{t("safeCommMuted")}</p>
        ) : null}
        {showDepositWarning ? (
          <p className="text-[13px] text-charcoal/60">{depositLine}</p>
        ) : null}
      </div>
    </div>
  );
}
