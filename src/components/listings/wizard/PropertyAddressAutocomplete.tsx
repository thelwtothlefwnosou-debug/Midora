"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MapPin } from "lucide-react";
import { useTranslations } from "next-intl";
import { useFloatingDropdown } from "@/hooks/useFloatingDropdown";
import {
  MIN_LOCATION_QUERY_LENGTH,
  formatLocationSelection,
  type SearchLocation,
} from "@/lib/data/locations-shared";
import type { AddressSuggestion } from "@/lib/geocoding/nominatim";
import { fetchLocationSuggestions } from "@/lib/locations/search-client";
import { cn } from "@/lib/utils";

const ADDRESS_MIN_QUERY = 4;
const DEBOUNCE_MS = 200;

export type PropertySearchSuggestion =
  | { type: "location"; location: SearchLocation }
  | { type: "address"; address: AddressSuggestion };

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSelectAddress: (suggestion: AddressSuggestion) => void;
  onSelectLocation: (location: SearchLocation) => void;
  inputClassName?: string;
  disabled?: boolean;
};

function suggestionKey(item: PropertySearchSuggestion, index: number): string {
  if (item.type === "location") {
    return `loc-${item.location.label}-${item.location.city}-${index}`;
  }
  return `addr-${item.address.placeId}`;
}

function shouldFetchAddresses(query: string): boolean {
  const trimmed = query.trim();
  if (trimmed.length < ADDRESS_MIN_QUERY) return false;
  return /\d/.test(trimmed) || trimmed.includes(",") || trimmed.split(/\s+/).length >= 2;
}

export function PropertyAddressAutocomplete({
  value,
  onChange,
  onSelectAddress,
  onSelectLocation,
  inputClassName,
  disabled,
}: Props) {
  const t = useTranslations("Wizard.location");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [suggestions, setSuggestions] = useState<PropertySearchSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLUListElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownStyle = useFloatingDropdown(open && suggestions.length > 0, wrapperRef);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchSuggestions = useCallback(async (query: string) => {
    const trimmed = query.trim();
    if (trimmed.length < MIN_LOCATION_QUERY_LENGTH) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const locationRes = await fetchLocationSuggestions(trimmed, { limit: 8 });
      const merged: PropertySearchSuggestion[] = locationRes.suggestions.map(
        (location): PropertySearchSuggestion => ({ type: "location", location })
      );

      if (shouldFetchAddresses(trimmed)) {
        const addressRes = await fetch(
          `/api/geocode/autocomplete?q=${encodeURIComponent(trimmed)}`
        ).then((r) => r.json());
        for (const address of addressRes.suggestions ?? []) {
          merged.push({ type: "address", address });
        }
      }

      setSuggestions(merged);
      setActiveIndex(0);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!open || value.trim().length < MIN_LOCATION_QUERY_LENGTH) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(() => {
      void fetchSuggestions(value);
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, open, fetchSuggestions]);

  useEffect(() => {
    function handlePointerDown(e: PointerEvent) {
      const target = e.target as Node;
      if (wrapperRef.current?.contains(target)) return;
      if (dropdownRef.current?.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  function selectSuggestion(item: PropertySearchSuggestion) {
    if (item.type === "location") {
      onSelectLocation(item.location);
      onChange(formatLocationSelection(item.location));
    } else {
      onSelectAddress(item.address);
      onChange(item.address.formattedAddress);
    }
    setOpen(false);
    setSuggestions([]);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (open && suggestions.length > 0) {
        const s = suggestions[activeIndex];
        if (s) selectSuggestion(s);
      }
      return;
    }
    if (!open || suggestions.length === 0) {
      if (e.key === "Escape") setOpen(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const dropdown =
    open && suggestions.length > 0 && mounted
      ? createPortal(
          <ul
            ref={dropdownRef}
            role="listbox"
            style={dropdownStyle}
            className="z-[200] max-h-72 overflow-auto rounded-xl border border-border bg-white py-1 shadow-lg"
          >
            {suggestions.map((item, index) => {
              const isLocation = item.type === "location";
              const primary = isLocation ? item.location.label : item.address.primary;
              const secondary = isLocation
                ? item.location.area && item.location.kind === "area"
                  ? item.location.city
                  : item.location.region ?? item.location.city
                : item.address.secondary;

              return (
                <li key={suggestionKey(item, index)} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={index === activeIndex}
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => selectSuggestion(item)}
                    className={cn(
                      "flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors",
                      index === activeIndex ? "bg-gold/10" : "hover:bg-sand/40"
                    )}
                  >
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold-dark" />
                    <span>
                      <span className="block text-sm font-medium text-charcoal">{primary}</span>
                      <span className="block text-xs text-muted">{secondary}</span>
                      {isLocation && (
                        <span className="mt-0.5 block text-[10px] text-muted/80">
                          {t("addressCityAreaLabel")}
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>,
          document.body
        )
      : null;

  return (
    <div ref={wrapperRef} className="relative">
      <label className="block">
        <span className="text-xs font-medium uppercase tracking-wide text-muted">
          {t("addressSearchLabel")}
        </span>
        <input
          type="text"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          disabled={disabled}
          value={value}
          placeholder={t("addressPlaceholder")}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          className={inputClassName}
        />
      </label>
      {loading && value.trim().length >= MIN_LOCATION_QUERY_LENGTH && (
        <p className="mt-1 text-[11px] text-muted">{t("addressSearching")}</p>
      )}
      {open && value.trim().length > 0 && value.trim().length < MIN_LOCATION_QUERY_LENGTH && (
        <p className="mt-1 text-[11px] text-muted">
          {t("addressMinChars", { count: MIN_LOCATION_QUERY_LENGTH })}
        </p>
      )}
      {dropdown}
    </div>
  );
}
