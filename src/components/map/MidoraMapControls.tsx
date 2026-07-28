"use client";

import type { RefObject } from "react";
import { LocateFixed, Minus, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import type { MapRef } from "@/components/map/MidoraMapCore";
import { cn } from "@/lib/utils";

type Props = {
  mapRef: RefObject<MapRef | null>;
  onRecenter?: () => void;
  showRecenter?: boolean;
  className?: string;
};

export function MidoraMapControls({
  mapRef,
  onRecenter,
  showRecenter = false,
  className,
}: Props) {
  const t = useTranslations("Map");

  const zoomIn = () => {
    mapRef.current?.zoomIn({ duration: 220 });
  };

  const zoomOut = () => {
    mapRef.current?.zoomOut({ duration: 220 });
  };

  const recenter = () => {
    onRecenter?.();
  };

  return (
    <div
      className={cn("midora-map-controls", className)}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        className="midora-map-control-btn"
        onClick={zoomIn}
        aria-label={t("zoomIn")}
      >
        <Plus className="h-4 w-4" strokeWidth={2.25} aria-hidden />
      </button>
      <button
        type="button"
        className="midora-map-control-btn"
        onClick={zoomOut}
        aria-label={t("zoomOut")}
      >
        <Minus className="h-4 w-4" strokeWidth={2.25} aria-hidden />
      </button>
      {showRecenter && onRecenter ? (
        <button
          type="button"
          className="midora-map-control-btn"
          onClick={recenter}
          aria-label={t("reset")}
        >
          <LocateFixed className="h-4 w-4" strokeWidth={2} aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
