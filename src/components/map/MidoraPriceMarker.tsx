"use client";

import { cn } from "@/lib/utils";

type Props = {
  label: string;
  active?: boolean;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  className?: string;
};

export function MidoraPriceMarker({
  label,
  active = false,
  onClick,
  onMouseEnter,
  onMouseLeave,
  className,
}: Props) {
  return (
    <button
      type="button"
      className={cn(
        "price-marker-pill pointer-events-auto cursor-pointer",
        active && "price-marker-pill--active",
        className
      )}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {label}
    </button>
  );
}

export function formatMarkerPriceLabel(
  priceLabel?: string,
  price?: number
): string {
  return priceLabel ?? (price != null ? `€${price.toLocaleString("el-GR")}` : "€");
}
