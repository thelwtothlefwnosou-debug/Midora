"use client";

import { Info } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { MIDORA_ROLE_SHORT } from "@/lib/midora-legal-copy";

export const LISTING_PORTAL_NOTE = MIDORA_ROLE_SHORT;

export function ListingPortalNote({ className }: { className?: string }) {
  const t = useTranslations("Legal.shared");

  return (
    <p
      className={cn(
        "flex items-start gap-2 text-xs leading-relaxed text-muted",
        className
      )}
    >
      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted/80" aria-hidden />
      <span>{t("roleShort")}</span>
    </p>
  );
}
