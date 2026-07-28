"use client";

import { Info } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { LISTING_PRICE_AVAILABILITY_NOTE } from "@/lib/midora-legal-copy";

/** Configurable portal disclaimer — replace text via env or CMS when legal copy is approved. */
export const LISTING_INQUIRY_DISCLAIMER =
  process.env.NEXT_PUBLIC_LISTING_INQUIRY_DISCLAIMER ??
  LISTING_PRICE_AVAILABILITY_NOTE;

export function ListingPortalDisclaimer({ className }: { className?: string }) {
  const t = useTranslations("Legal.shared");
  const disclaimer =
    process.env.NEXT_PUBLIC_LISTING_INQUIRY_DISCLAIMER ?? t("priceAvailabilityNote");

  return (
    <p
      className={cn(
        "flex items-start gap-2 text-xs leading-relaxed text-muted",
        className
      )}
    >
      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted/80" aria-hidden />
      <span>{disclaimer}</span>
    </p>
  );
}
