"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MapPin } from "lucide-react";
import {
  MAX_LOCATION_SUGGESTIONS,
  type SearchLocation,
} from "@/lib/data/locations-shared";
import {
  fetchCitySuggestions,
  getInstantCitySuggestions,
} from "@/lib/locations/search-client";
import { useFloatingDropdown } from "@/hooks/useFloatingDropdown";
import { cn } from "@/lib/utils";

const MIN_CITY_QUERY = 1;

type Props = {
  value: string;
  onChange: (city: string) => void;
  onSelectLocation?: (location: SearchLocation) => void;
  className?: string;
  inputClassName?: string;
  required?: boolean;
};

function cityLabel(loc: SearchLocation): string {
  return (loc.city || loc.label).trim();
}

function suggestionSubtitle(loc: SearchLocation): string {
  return loc.region ?? "Ελλάδα";
}

export function ListingCityField({
  value,
  onChange,
  onSelectLocation,
  className,
  inputClassName,
  required,
}: Props) {
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState(value);
  const [suggestions, setSuggestions] = useState<SearchLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLUListElement>(null);

  const display = focused ? draft : value;
  const queryLen = display.trim().length;
  const dropdownOpen = open && queryLen >= MIN_CITY_QUERY && (suggestions.length > 0 || loading);
  const dropdownStyle = useFloatingDropdown(dropdownOpen, wrapperRef);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!focused) setDraft(value);
  }, [value, focused]);

  useEffect(() => {
    if (!open || queryLen < MIN_CITY_QUERY) {
      setSuggestions([]);
      setLoading(false);
      return;
    }
    const trimmed = display.trim();
    const instant = getInstantCitySuggestions(trimmed, { limit: MAX_LOCATION_SUGGESTIONS });
    setSuggestions(instant.suggestions);
    setActiveIndex(0);

    let cancelled = false;
    setLoading(true);
    fetchCitySuggestions(trimmed, { limit: MAX_LOCATION_SUGGESTIONS }).then(
      ({ suggestions: items, resolved }) => {
        if (cancelled) return;
        setLoading(false);
        if (items.length > 0) {
          setSuggestions(items);
          setActiveIndex(0);
          return;
        }
        if (resolved?.strongMatch && resolved.city) {
          setSuggestions([
            {
              label: resolved.city,
              city: resolved.city,
              region: resolved.region,
              kind: "city",
              rank: 100,
              aliases: [],
            },
          ]);
        }
      }
    );
    return () => {
      cancelled = true;
    };
  }, [display, open, queryLen]);

  useEffect(() => {
    function handlePointerDown(e: PointerEvent) {
      const target = e.target as Node;
      if (wrapperRef.current?.contains(target)) return;
      if (dropdownRef.current?.contains(target)) return;
      setOpen(false);
      setFocused(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  const pick = useCallback(
    (loc: SearchLocation) => {
      const cityName = cityLabel(loc);
      setDraft(cityName);
      onChange(cityName);
      onSelectLocation?.(loc);
      setOpen(false);
      setFocused(false);
    },
    [onChange, onSelectLocation]
  );

  const tryResolveOnBlur = useCallback(async () => {
    const trimmed = draft.trim();
    if (trimmed.length < MIN_CITY_QUERY) return;
    const { suggestions: items, resolved } = await fetchCitySuggestions(trimmed, { limit: 1 });
    if (items[0]) {
      pick(items[0]);
      return;
    }
    if (resolved?.strongMatch && resolved.city) {
      onChange(resolved.city);
      setDraft(resolved.city);
    }
  }, [draft, onChange, pick]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (dropdownOpen && suggestions[activeIndex]) {
        pick(suggestions[activeIndex]);
      } else if (suggestions[0]) {
        pick(suggestions[0]);
      } else {
        void tryResolveOnBlur();
      }
      return;
    }
    if (!dropdownOpen) return;
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
    mounted && dropdownOpen
      ? createPortal(
          <ul
            ref={dropdownRef}
            role="listbox"
            style={dropdownStyle}
            className="z-[200] max-h-72 overflow-y-auto rounded-xl border border-border bg-white py-1 shadow-[0_12px_40px_-8px_rgba(26,26,26,0.22)]"
          >
            {loading && suggestions.length === 0 && (
              <li className="px-4 py-2.5 text-xs text-muted">Αναζήτηση πόλεων...</li>
            )}
            {suggestions.map((loc, index) => (
              <li key={`${loc.kind}-${cityLabel(loc)}-${index}`} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={index === activeIndex}
                  className={cn(
                    "flex w-full items-start gap-3 px-4 py-2.5 text-left transition-colors",
                    index === activeIndex ? "bg-gold/10" : "hover:bg-sand/60"
                  )}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => pick(loc)}
                >
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold-dark" />
                  <span>
                    <span className="block text-sm font-medium text-charcoal">{cityLabel(loc)}</span>
                    <span className="block text-xs text-muted">{suggestionSubtitle(loc)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>,
          document.body
        )
      : null;

  return (
    <div ref={wrapperRef} className={cn("relative", className)}>
      <input
        type="text"
        value={display}
        required={required}
        autoComplete="off"
        placeholder="π.χ. Αθήνα, Θεσσαλονίκη, Ηράκλειο"
        onChange={(e) => {
          const next = e.target.value;
          setDraft(next);
          onChange(next);
          setOpen(true);
        }}
        onFocus={() => {
          setFocused(true);
          setDraft(value);
          setOpen(true);
        }}
        onBlur={() => {
          window.setTimeout(() => {
            setFocused(false);
            void tryResolveOnBlur();
          }, 150);
        }}
        onKeyDown={handleKeyDown}
        className={inputClassName}
      />
      {open && queryLen === 0 && (
        <p className="mt-1 text-[11px] text-muted">Ξεκίνα να πληκτρολογείς την πόλη</p>
      )}
      {dropdown}
    </div>
  );
}
