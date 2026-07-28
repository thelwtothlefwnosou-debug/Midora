"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MapPin } from "lucide-react";
import { useTranslations } from "next-intl";
import { useFloatingDropdown } from "@/hooks/useFloatingDropdown";
import type { AddressSuggestion } from "@/lib/geocoding/types";
import {
  postalCodeForCity,
  streetMatchesQuery,
  streetSuggestionMatchesScope,
} from "@/lib/geocoding/geocode-utils";
import { cn } from "@/lib/utils";

const MIN_STREET_QUERY = 2;
const DEBOUNCE_MS = 350;

type Props = {
  city: string;
  area?: string;
  postalCode?: string;
  searchCenter?: { lat: number; lng: number } | null;
  areaCenter?: { lat: number; lng: number } | null;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  onSelectStreet: (suggestion: AddressSuggestion) => void;
  inputClassName?: string;
  disabled?: boolean;
};

export function PropertyStreetSearchField({
  city,
  area,
  postalCode,
  searchCenter,
  areaCenter,
  value,
  onChange,
  onBlur,
  onSelectStreet,
  inputClassName,
  disabled,
}: Props) {
  const t = useTranslations("Wizard.location");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [mounted, setMounted] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLUListElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const requestSeqRef = useRef(0);
  const cityReady = city.trim().length >= 2;
  const dropdownOpen =
    open && cityReady && (loading || searched) && value.trim().length >= MIN_STREET_QUERY;
  const dropdownStyle = useFloatingDropdown(dropdownOpen, wrapperRef);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setSuggestions([]);
    setSearched(false);
    abortRef.current?.abort();
  }, [city, area, searchCenter?.lat, searchCenter?.lng]);

  const fetchSuggestions = useCallback(
    async (query: string) => {
      const trimmed = query.trim();
      if (!cityReady || trimmed.length < MIN_STREET_QUERY) {
        setSuggestions([]);
        setSearched(false);
        return;
      }

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const seq = ++requestSeqRef.current;

      setLoading(true);
      setSearched(true);
      try {
        const params = new URLSearchParams({
          q: trimmed,
          city: city.trim(),
        });
        const safePostal = postalCodeForCity(postalCode, city);
        if (safePostal) params.set("postalCode", safePostal);
        if (area?.trim()) params.set("area", area.trim());
        if (searchCenter) {
          params.set("lat", String(searchCenter.lat));
          params.set("lng", String(searchCenter.lng));
        }
        const res = await fetch(`/api/geocode/autocomplete?${params}`, {
          signal: controller.signal,
        });
        const data = await res.json();
        if (controller.signal.aborted || seq !== requestSeqRef.current) return;
        const scopeCenter = areaCenter ?? searchCenter ?? null;
        const items = ((data.suggestions ?? []) as AddressSuggestion[]).filter((s) => {
          if (!streetSuggestionMatchesScope(s, city.trim(), area?.trim(), scopeCenter)) {
            return false;
          }
          const streetName = s.street?.trim() || s.primary;
          return streetMatchesQuery(streetName, trimmed);
        });
        setSuggestions(items);
        setActiveIndex(0);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        if (seq !== requestSeqRef.current) return;
        setSuggestions([]);
      } finally {
        if (!controller.signal.aborted && seq === requestSeqRef.current) {
          setLoading(false);
        }
      }
    },
    [city, cityReady, postalCode, area, searchCenter, areaCenter]
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = value.trim();
    if (!open || !cityReady || trimmed.length < MIN_STREET_QUERY) {
      setSuggestions([]);
      setLoading(false);
      setSearched(false);
      abortRef.current?.abort();
      return;
    }

    setLoading(true);
    setSearched(true);

    debounceRef.current = setTimeout(() => {
      void fetchSuggestions(value);
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, open, cityReady, fetchSuggestions]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

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

  function selectSuggestion(s: AddressSuggestion) {
    onSelectStreet(s);
    setOpen(false);
    setSuggestions([]);
    setSearched(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (dropdownOpen && suggestions[activeIndex]) {
        selectSuggestion(suggestions[activeIndex]);
      }
      return;
    }
    if (!dropdownOpen) {
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

  const locationHint = area?.trim()
    ? `${city.trim()} · ${area.trim()}`
    : city.trim();

  const dropdown =
    dropdownOpen && mounted
      ? createPortal(
          <ul
            ref={dropdownRef}
            role="listbox"
            style={dropdownStyle}
            className="z-[200] max-h-72 overflow-auto rounded-xl border border-border bg-white py-1 shadow-lg"
          >
            {loading && suggestions.length === 0 && (
              <li className="px-3 py-2.5 text-xs text-muted">
                {area?.trim()
                  ? t("searchingInArea", { area: area.trim() })
                  : t("searchingInCity", { city: city.trim() })}
              </li>
            )}
            {!loading && suggestions.length === 0 && searched && (
              <li className="px-3 py-2.5 text-xs text-muted">{t("noStreetFound")}</li>
            )}
            {suggestions.map((s, index) => (
              <li key={s.placeId} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={index === activeIndex}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => selectSuggestion(s)}
                  className={cn(
                    "flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors",
                    index === activeIndex ? "bg-gold/10" : "hover:bg-sand/40"
                  )}
                >
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold-dark" />
                  <span>
                    <span className="block text-sm font-medium text-charcoal">{s.primary}</span>
                    <span className="block text-xs text-muted">
                      {s.secondary || locationHint}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>,
          document.body
        )
      : null;

  return (
    <div ref={wrapperRef} className="relative">
      <label className="block">
        <span className="text-xs font-medium uppercase tracking-wide text-muted">
          {t("street")}
        </span>
        <input
          type="text"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          disabled={disabled || !cityReady}
          value={value}
          placeholder={
            cityReady
              ? t("streetPlaceholder", { location: locationHint })
              : t("chooseCityFirst")
          }
          onChange={(e) => {
            const next = e.target.value;
            onChange(next);
            setOpen(true);
          }}
          onFocus={() => {
            setOpen(true);
            if (value.trim().length >= MIN_STREET_QUERY) {
              void fetchSuggestions(value);
            }
          }}
          onBlur={onBlur}
          onKeyDown={handleKeyDown}
          className={cn(inputClassName, !cityReady && "opacity-60")}
        />
      </label>
      {cityReady && (
        <p className="mt-1 text-[11px] text-muted">
          {t("streetHelp")}
          {area?.trim()
            ? t("streetHelpInArea", { area: area.trim() })
            : t("streetHelpInCity", { city: city.trim() })}
        </p>
      )}
      {!cityReady && (
        <p className="mt-1 text-[11px] text-muted">{t("fillCityFirst")}</p>
      )}
      {dropdown}
    </div>
  );
}
