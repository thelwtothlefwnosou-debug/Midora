"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  pointCount?: number;
  onClick?: () => void;
  className?: string;
};

export function MidoraMapCluster({
  label,
  pointCount,
  onClick,
  className,
}: Props) {
  const t = useTranslations("Map");

  return (
    <button
      type="button"
      className={cn(
        "midora-map-cluster pointer-events-auto cursor-pointer",
        pointCount != null && pointCount > 1 && "midora-map-cluster--multi",
        className
      )}
      aria-label={
        pointCount != null && pointCount > 1
          ? t("clusterListings", { count: pointCount })
          : undefined
      }
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
    >
      {label}
    </button>
  );
}
