"use client";

import { useEffect, useId } from "react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { MapListingPreviewSheet } from "@/components/listings/MapListingPreviewSheet";
import type { MapMarker } from "@/components/map/types";
import { setPhoneFullMapBodyFlag } from "@/lib/phone-fullmap-chrome";
import { cn } from "@/lib/utils";

type SheetState = "collapsed" | "expanded";

type Props = {
  open: boolean;
  onClose: () => void;
  totalCount: number;
  sheet: SheetState;
  onSheetChange: (next: SheetState) => void;
  map: React.ReactNode;
  results: React.ReactNode;
  previewMarker: MapMarker | null;
  onPreviewClose: () => void;
  searchChrome?: React.ReactNode;
};

/**
 * Phone-only (parent gates ≤639) full-map overlay with two-state results sheet.
 * No drag physics — tap handle / header toggles collapsed ↔ expanded.
 */
export function PhoneFullMapOverlay({
  open,
  onClose,
  totalCount,
  sheet,
  onSheetChange,
  map,
  results,
  previewMarker,
  onPreviewClose,
  searchChrome,
}: Props) {
  const t = useTranslations("Listings");
  const titleId = useId();
  const expanded = sheet === "expanded";

  useEffect(() => {
    if (!open) return;
    setPhoneFullMapBodyFlag(true);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      setPhoneFullMapBodyFlag(false);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        if (expanded) onSheetChange("collapsed");
        else onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, expanded, onClose, onSheetChange]);

  if (!open) return null;

  const countLabel =
    totalCount === 0
      ? t("noneMatchArea")
      : totalCount === 1
        ? t("oneMatchShort")
        : t("nMatchShort", { count: totalCount });

  return (
    <div
      className="midora-phone-fullmap fixed inset-0 z-[160] flex flex-col bg-white"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className="relative z-20 shrink-0 border-b border-border/80 bg-white/95 pt-[env(safe-area-inset-top,0px)] backdrop-blur-md">
        <div className="flex items-center gap-2 px-3 py-2.5">
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-white text-charcoal"
            aria-label={t("closeMap")}
          >
            <X className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1" id={titleId}>
            {searchChrome}
          </div>
        </div>
      </div>

      <div className="relative min-h-0 flex-1">
        <div className="absolute inset-0">{map}</div>

        <div
          className={cn(
            "midora-phone-fullmap__sheet absolute inset-x-0 bottom-0 z-[20] flex flex-col rounded-t-2xl border-t border-border bg-white shadow-[0_-12px_40px_-12px_rgba(26,26,26,0.28)]",
            "pb-[env(safe-area-inset-bottom,0px)]",
            "transition-[height] duration-300 ease-out motion-reduce:transition-none",
            expanded ? "h-[min(72dvh,36rem)]" : "h-[5.75rem]"
          )}
        >
          <button
            type="button"
            className="flex w-full flex-col items-center px-4 pt-2.5 pb-2"
            aria-expanded={expanded}
            aria-controls="midora-phone-map-sheet-panel"
            onClick={() => onSheetChange(expanded ? "collapsed" : "expanded")}
          >
            <span className="mb-2 h-1 w-10 rounded-full bg-charcoal/20" aria-hidden />
            <span className="text-sm font-semibold text-charcoal">{countLabel}</span>
            <span className="text-[11px] text-muted">
              {expanded ? t("sheetCollapseHint") : t("sheetExpandHint")}
            </span>
          </button>

          <div
            id="midora-phone-map-sheet-panel"
            hidden={!expanded}
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
          >
            {results}
          </div>
        </div>

        {previewMarker ? (
          <MapListingPreviewSheet
            marker={previewMarker}
            onClose={onPreviewClose}
            className={cn(
              "bottom-[calc(5.75rem+env(safe-area-inset-bottom,0px))]",
              expanded && "bottom-[min(72dvh,36rem)]"
            )}
          />
        ) : null}
      </div>
    </div>
  );
}
