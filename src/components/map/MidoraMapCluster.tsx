"use client";

import { cn } from "@/lib/utils";

type Props = {
  label: string;
  onClick?: () => void;
  className?: string;
};

export function MidoraMapCluster({ label, onClick, className }: Props) {
  return (
    <button
      type="button"
      className={cn("midora-map-cluster pointer-events-auto cursor-pointer", className)}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
    >
      {label}
    </button>
  );
}
