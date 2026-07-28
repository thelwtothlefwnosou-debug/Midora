"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

type Props = {
  height?: string;
  className?: string;
  message?: string;
};

export function MapLoadingState({
  height = "100%",
  className,
  message,
}: Props) {
  const t = useTranslations("Map");
  const resolvedMessage = message ?? t("loading");

  return (
    <div
      className={cn(
        "flex h-full min-h-[280px] flex-col items-center justify-center gap-3 bg-[#eceae6]",
        className
      )}
      style={height !== "100%" ? { height } : undefined}
      aria-busy="true"
      aria-live="polite"
    >
      <div className="relative h-10 w-10 overflow-hidden rounded-full border-2 border-gold/25">
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-gold" />
      </div>
      <span className="text-sm text-muted">{resolvedMessage}</span>
    </div>
  );
}
