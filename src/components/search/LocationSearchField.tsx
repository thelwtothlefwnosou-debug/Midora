"use client";

import { useState, useRef, useEffect } from "react";
import { PenLine, Type } from "lucide-react";
import { CitySearchInput } from "@/components/search/CitySearchInput";
import { MapAreaDrawModal } from "@/components/map/MapAreaDrawModal";
import type { LatLng } from "@/lib/geo/polygon";
import { cn } from "@/lib/utils";

type Props = {
  variant?: "hero" | "compact" | "embedded" | "toolbar";
  defaultValue?: string;
  placeholder?: string;
  className?: string;
  onValueChange?: (value: string) => void;
  onSelect?: (location: import("@/lib/data/locations").SearchLocation) => void;
  onNearbySelect?: (coords: { lat: number; lng: number }) => void;
  onDrawSearch?: (polygon: LatLng[]) => void;
  mapAreaActive?: boolean;
  onClearMapArea?: () => void;
  focusSignal?: number;
  inputId?: string;
  onFocus?: () => void;
};

export function LocationSearchField({
  variant = "hero",
  defaultValue = "",
  placeholder,
  className,
  onValueChange,
  onSelect,
  onNearbySelect,
  onDrawSearch,
  mapAreaActive,
  onClearMapArea,
  focusSignal,
  inputId,
  onFocus,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [drawOpen, setDrawOpen] = useState(false);
  const [hasQuery, setHasQuery] = useState(Boolean(defaultValue.trim()));
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!focusSignal) return;
    const input = wrapperRef.current?.querySelector("input");
    input?.focus();
  }, [focusSignal]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function openDrawMode() {
    setMenuOpen(false);
    setDrawOpen(true);
  }

  const menu = menuOpen && !hasQuery ? (
    <ul className="absolute left-0 right-0 top-full z-[120] mt-1 min-w-[280px] overflow-hidden rounded-xl border border-border bg-white shadow-card">
      <li>
        <button
          type="button"
          className="flex w-full items-start gap-3 border-b border-border px-4 py-3.5 text-left transition-colors hover:bg-sand/60"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setMenuOpen(false)}
        >
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal/10 text-teal">
            <Type className="h-4 w-4" />
          </span>
          <span>
            <span className="block text-sm font-semibold text-teal">
              Αναζήτηση με όνομα
            </span>
            <span className="mt-0.5 block text-xs text-muted">
              Αναζήτηση ανά πόλη, δήμο ή γειτονιά
            </span>
          </span>
        </button>
      </li>
      <li>
        <button
          type="button"
          className="flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-sand/60"
          onMouseDown={(e) => e.preventDefault()}
          onClick={openDrawMode}
        >
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal/10 text-teal">
            <PenLine className="h-4 w-4" />
          </span>
          <span>
            <span className="block text-sm font-semibold text-teal">
              Σχεδίασε περιοχή στον χάρτη
            </span>
            <span className="mt-0.5 block text-xs text-muted">
              Επίλεξε την περιοχή αναζήτησης απευθείας στον χάρτη
            </span>
          </span>
        </button>
      </li>
    </ul>
  ) : null;

  const drawModal = (
    <MapAreaDrawModal
      open={drawOpen}
      onClose={() => setDrawOpen(false)}
      onSearch={(polygon) => onDrawSearch?.(polygon)}
    />
  );

  if (mapAreaActive) {
    return (
      <div className={cn("relative flex-1", className)}>
        <div
          className={cn(
            "flex items-center gap-3",
            variant === "hero"
              ? "px-4 py-3"
              : variant === "toolbar"
                ? "listings-search-segment listings-search-segment--grow h-full"
                : "rounded-xl border border-teal/30 bg-teal/5 px-4 py-2"
          )}
        >
          {variant === "toolbar" ? (
            <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
              <span className="listings-search-segment__label">Πού</span>
              <div className="flex min-w-0 items-center gap-2">
                <PenLine className="h-4 w-4 shrink-0 text-teal" aria-hidden />
                <span className="listings-search-segment__value text-teal">
                  Σχεδιασμένη περιοχή στον χάρτη
                </span>
              </div>
            </div>
          ) : (
            <>
              <PenLine className="h-5 w-5 shrink-0 text-teal" />
              <div className="flex min-w-0 flex-1 flex-col">
                {variant === "hero" && (
                  <span className="text-[10px] font-medium tracking-wider text-muted uppercase">
                    Περιοχή αναζήτησης
                  </span>
                )}
                <span className="text-sm font-medium text-teal">
                  Σχεδιασμένη περιοχή στον χάρτη
                </span>
              </div>
            </>
          )}
          <button
            type="button"
            onClick={() => {
              onClearMapArea?.();
              setDrawOpen(true);
            }}
            className="shrink-0 text-xs font-medium text-gold hover:underline"
          >
            Αλλαγή
          </button>
        </div>
        {drawModal}
      </div>
    );
  }

  if (variant === "embedded") {
    return (
      <div ref={wrapperRef} className={cn("relative w-full min-w-0 overflow-visible", className)}>
        <CitySearchInput
          inputId={inputId}
          variant="embedded"
          defaultValue={defaultValue}
          placeholder={placeholder ?? "Αθήνα, Πάρος, Θεσσαλονίκη…"}
          onFocus={onFocus}
          onValueChange={onValueChange}
          onSelect={(loc) => {
            onSelect?.(loc);
            setMenuOpen(false);
          }}
          onNearbySelect={onNearbySelect}
        />
        {drawModal}
      </div>
    );
  }

  if (variant === "hero") {
    return (
      <div ref={wrapperRef} className={cn("relative w-full overflow-visible", className)}>
        <div onFocusCapture={() => !hasQuery && setMenuOpen(true)}>
          <CitySearchInput
            variant="hero"
            defaultValue={defaultValue}
            placeholder={placeholder ?? "Π.χ. Αθήνα, Θεσσαλονίκη, Πάτρα"}
            onValueChange={(v) => {
              setHasQuery(Boolean(v.trim()));
              if (v.trim()) setMenuOpen(false);
              onValueChange?.(v);
            }}
            onSelect={(loc) => {
              onSelect?.(loc);
              setMenuOpen(false);
            }}
            onNearbySelect={onNearbySelect}
          />
        </div>
        {menu}
        {drawModal}
      </div>
    );
  }

  if (variant === "compact" || variant === "toolbar") {
    const isToolbar = variant === "toolbar";

    return (
      <div
        ref={wrapperRef}
        className={cn(
          "relative flex items-center overflow-visible",
          isToolbar ? "h-full w-full" : "gap-2",
          className
        )}
      >
        <div
          className={cn(
            "min-w-0 overflow-visible",
            isToolbar
              ? "listings-search-segment listings-search-segment--grow flex flex-1 flex-col justify-center"
              : "flex-1"
          )}
          onFocusCapture={() => !hasQuery && setMenuOpen(true)}
        >
          {isToolbar && (
            <span className="listings-search-segment__label">Πού</span>
          )}
          {!isToolbar && variant === "compact" && (
            <span className="text-[9px] font-medium tracking-wide text-muted uppercase">
              Περιοχή
            </span>
          )}
          <CitySearchInput
            variant={isToolbar ? "dock" : "compact"}
            defaultValue={defaultValue}
            placeholder={
              isToolbar
                ? (placeholder ?? "Προσθήκη προορισμού")
                : (placeholder ?? "Πόλη ή περιοχή...")
            }
            className="w-full"
            onFocus={onFocus}
            onValueChange={(v) => {
              setHasQuery(Boolean(v.trim()));
              if (v.trim()) setMenuOpen(false);
              onValueChange?.(v);
            }}
            onSelect={(loc) => {
              onSelect?.(loc);
              setMenuOpen(false);
            }}
            onNearbySelect={onNearbySelect}
          />
        </div>
        {menu}
        {drawModal}
      </div>
    );
  }

  return null;
}
