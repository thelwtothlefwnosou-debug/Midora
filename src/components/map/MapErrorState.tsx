"use client";

import { MapPinned } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

type Props = {
  height?: string;
  className?: string;
  onRetry?: () => void;
};

export function MapErrorState({ height = "100%", className, onRetry }: Props) {
  const t = useTranslations("Map");

  return (
    <div
      className={cn(
        "flex h-full min-h-[240px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-sand/20 px-6 text-center",
        className
      )}
      style={height !== "100%" ? { height } : undefined}
      role="alert"
    >
      <MapPinned className="h-9 w-9 text-gold/70" aria-hidden />
      <p className="max-w-xs text-sm font-medium text-charcoal">{t("loadFailed")}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-1 rounded-lg border border-border bg-white px-4 py-2 text-sm font-semibold text-charcoal transition hover:border-gold/40"
        >
          {t("retry")}
        </button>
      ) : null}
    </div>
  );
}
