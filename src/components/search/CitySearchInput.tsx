"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  MIN_LOCATION_QUERY_LENGTH,
  MAX_LOCATION_SUGGESTIONS,
  NEARBY_LOCATION,
  formatLocationSelection,
  type SearchLocation,
} from "@/lib/data/locations-shared";
import { fetchLocationSuggestions, getInstantLocationSuggestions } from "@/lib/locations/search-client";
import { useFloatingDropdown } from "@/hooks/useFloatingDropdown";
import { cn } from "@/lib/utils";
import { MapPin, Navigation, TrendingUp, X } from "lucide-react";

type CitySearchInputProps = {
  name?: string;
  inputId?: string;
  defaultValue?: string;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  variant?: "hero" | "compact" | "embedded" | "dock";
  onSelect?: (location: SearchLocation) => void;
  onValueChange?: (value: string) => void;
  onNearbySelect?: (coords: { lat: number; lng: number }) => void;
};

function suggestionSubtitle(loc: SearchLocation): string {
  if (loc.kind === "area" || (loc.area && loc.area !== loc.city)) {
    return loc.city;
  }
  return loc.region ?? loc.city;
}

export function CitySearchInput({
  name = "city",
  inputId,
  defaultValue = "",
  placeholder = "π.χ. Αθήνα, Κουκάκι",
  className,
  inputClassName,
  variant = "hero",
  onSelect,
  onValueChange,
  onNearbySelect,
}: CitySearchInputProps) {
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showEmptyMenu, setShowEmptyMenu] = useState(false);
  const [locating, setLocating] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState<SearchLocation[]>([]);
  const [popularCities, setPopularCities] = useState<SearchLocation[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLUListElement>(null);

  const trimmed = value.trim();
  const queryLen = trimmed.length;

  const emptyMenuItems = showEmptyMenu && !trimmed;

  const menuItemsCount =
    (emptyMenuItems ? 1 : 0) +
    popularCities.length +
    locationSuggestions.length;

  const hint =
    queryLen > 0 && queryLen < MIN_LOCATION_QUERY_LENGTH
      ? `Πληκτρολόγησε τουλάχιστον ${MIN_LOCATION_QUERY_LENGTH} χαρακτήρες`
      : null;

  const dropdownOpen =
    open &&
    (emptyMenuItems || queryLen >= MIN_LOCATION_QUERY_LENGTH || Boolean(hint));

  const dropdownStyle = useFloatingDropdown(dropdownOpen, wrapperRef);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    if (emptyMenuItems) {
      setPopularCities(getInstantLocationSuggestions("", { limit: 6 }).suggestions);
      return;
    }

    if (queryLen >= MIN_LOCATION_QUERY_LENGTH) {
      const instant = getInstantLocationSuggestions(trimmed, {
        limit: MAX_LOCATION_SUGGESTIONS,
      });
      setLocationSuggestions(instant.suggestions);

      const timer = window.setTimeout(() => {
        fetchLocationSuggestions(trimmed, { limit: MAX_LOCATION_SUGGESTIONS }).then(
          ({ suggestions }) => {
            if (!cancelled && suggestions.length > 0) setLocationSuggestions(suggestions);
          }
        );
      }, 350);

      return () => {
        cancelled = true;
        window.clearTimeout(timer);
      };
    }

    setLocationSuggestions([]);
    return undefined;
  }, [trimmed, open, emptyMenuItems, queryLen]);

  useEffect(() => {
    function handlePointerDown(e: PointerEvent) {
      const target = e.target as Node;
      if (wrapperRef.current?.contains(target)) return;
      if (dropdownRef.current?.contains(target)) return;
      setOpen(false);
      setShowEmptyMenu(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  function closeMenu() {
    setOpen(false);
    setShowEmptyMenu(false);
  }

  async function canonicalizeInput() {
    const { resolved, suggestions } = await fetchLocationSuggestions(trimmed, { limit: 1 });
    if (resolved) {
      const text = resolved.area ?? resolved.city;
      setValue(text);
      onValueChange?.(text);
      if (suggestions[0]) onSelect?.(suggestions[0]);
      return;
    }
    if (suggestions[0]) {
      pick(suggestions[0]);
    }
  }

  function pick(loc: SearchLocation) {
    const text = formatLocationSelection(loc);
    setValue(text);
    onValueChange?.(text);
    closeMenu();
    onSelect?.(loc);
  }

  function requestNearby() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setValue(NEARBY_LOCATION.label);
        onValueChange?.(NEARBY_LOCATION.label);
        closeMenu();
        onNearbySelect?.({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        onSelect?.(NEARBY_LOCATION);
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }

  function clearInput() {
    setValue("");
    onValueChange?.("");
    closeMenu();
  }

  const inputProps = {
    id: inputId,
    name,
    type: "text" as const,
    value,
    autoComplete: "off" as const,
    placeholder,
    role: "combobox" as const,
    "aria-expanded": dropdownOpen,
    "aria-autocomplete": "list" as const,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      setValue(e.target.value);
      onValueChange?.(e.target.value);
      setOpen(true);
      setShowEmptyMenu(false);
      setActiveIndex(0);
    },
    onFocus: () => {
      if (trimmed) {
        setOpen(true);
        setShowEmptyMenu(false);
      } else {
        setShowEmptyMenu(true);
        setOpen(true);
        setActiveIndex(0);
      }
    },
    onBlur: () => {
      window.setTimeout(() => {
        if (trimmed.length >= MIN_LOCATION_QUERY_LENGTH) {
          canonicalizeInput();
        }
      }, 150);
    },
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        closeMenu();
        return;
      }
      if (!open || menuItemsCount === 0) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % menuItemsCount);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => (i - 1 + menuItemsCount) % menuItemsCount);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (emptyMenuItems) {
          if (activeIndex === 0) {
            requestNearby();
          } else if (popularCities[activeIndex - 1]) {
            pick(popularCities[activeIndex - 1]);
          }
        } else if (locationSuggestions[activeIndex]) {
          pick(locationSuggestions[activeIndex]);
        } else if (locationSuggestions.length > 0) {
          pick(locationSuggestions[0]);
        } else {
          canonicalizeInput();
        }
      }
    },
  };

  let itemIndex = 0;

  const dropdown =
    mounted && dropdownOpen ? (
      <ul
        ref={dropdownRef}
        role="listbox"
        style={dropdownStyle}
        className="max-h-80 overflow-y-auto rounded-xl border border-border bg-white shadow-[0_12px_40px_-8px_rgba(26,26,26,0.22)]"
      >
        {emptyMenuItems && (
          <>
            <li className="flex items-center gap-2 border-b border-border px-4 py-2 text-[10px] font-medium tracking-wider text-muted uppercase">
              <TrendingUp className="h-3 w-3" />
              Δημοφιλείς περιοχές
            </li>
            <li role="option">
              {(() => {
                const idx = itemIndex++;
                return (
                  <button
                    type="button"
                    className={cn(
                      "flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors",
                      idx === activeIndex ? "bg-sand" : "hover:bg-sand/60"
                    )}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      requestNearby();
                    }}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal/10 text-teal">
                      <Navigation className="h-4 w-4" />
                    </span>
                    <span className="block font-semibold text-teal">
                      {locating ? "Εντοπισμός..." : NEARBY_LOCATION.label}
                    </span>
                  </button>
                );
              })()}
            </li>
            {popularCities.map((loc, i) => {
              const idx = itemIndex++;
              return (
                <li key={`pop-${loc.city}-${i}`} role="option" aria-selected={idx === activeIndex}>
                  <button
                    type="button"
                    className={cn(
                      "flex w-full min-h-11 items-start gap-3 px-4 py-3 text-left text-sm transition-colors",
                      idx === activeIndex ? "bg-sand" : "hover:bg-sand/60"
                    )}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      pick(loc);
                    }}
                  >
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium text-charcoal">
                        {formatLocationSelection(loc)}
                      </span>
                      <span className="text-xs text-muted">{suggestionSubtitle(loc)}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </>
        )}

        {hint && (
          <li className="border-b border-border px-4 py-2.5 text-xs text-muted">{hint}</li>
        )}

        {queryLen >= MIN_LOCATION_QUERY_LENGTH &&
          locationSuggestions.length === 0 &&
          !hint && (
            <li className="px-4 py-3 text-sm text-muted">
              Δεν βρέθηκε περιοχή. Δοκίμασε άλλη γραφή.
            </li>
          )}

        {queryLen >= MIN_LOCATION_QUERY_LENGTH &&
          locationSuggestions.map((loc, i) => {
            const idx = emptyMenuItems ? itemIndex + i : i;
            return (
              <li
                key={`${loc.city}-${loc.area ?? loc.district}-${i}`}
                role="option"
                aria-selected={idx === activeIndex}
              >
                <button
                  type="button"
                  className={cn(
                    "flex w-full items-start gap-3 px-4 py-3 text-left text-sm transition-colors",
                    idx === activeIndex ? "bg-sand" : "hover:bg-sand/60"
                  )}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    pick(loc);
                  }}
                >
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold/80" />
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-charcoal">
                      {formatLocationSelection(loc)}
                    </span>
                    <span className="text-xs text-muted">{suggestionSubtitle(loc)}</span>
                  </span>
                </button>
              </li>
            );
          })}
      </ul>
    ) : null;

  const portalDropdown = dropdown ? createPortal(dropdown, document.body) : null;

  const clearBtn =
    value.trim().length > 0 ? (
      <button
        type="button"
        onClick={clearInput}
        className="shrink-0 rounded-full p-2 text-muted hover:bg-sand hover:text-charcoal"
        aria-label="Καθαρισμός"
      >
        <X className="h-4 w-4" />
      </button>
    ) : null;

  if (variant === "embedded") {
    return (
      <div ref={wrapperRef} className={cn("relative w-full min-w-0", className)}>
        <div className="flex min-w-0 items-center gap-1">
          <input
            {...inputProps}
            className={cn(
              "min-h-9 w-full min-w-0 flex-1 bg-transparent text-sm text-charcoal outline-none placeholder:text-muted/50",
              inputClassName
            )}
          />
          {clearBtn}
        </div>
        {portalDropdown}
      </div>
    );
  }

  if (variant === "hero") {
    return (
      <div ref={wrapperRef} className={cn("relative w-full", className)}>
        <label className="group flex min-h-[3.5rem] w-full items-center gap-3 px-4 py-2.5 sm:px-4">
          <MapPin className="h-5 w-5 shrink-0 text-gold" strokeWidth={1.75} />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="whitespace-nowrap text-[10px] font-medium tracking-wider text-muted uppercase">
              Πού ψάχνεις;
            </span>
            <div className="flex min-w-0 items-center gap-1">
              <input
                {...inputProps}
                className={cn(
                  "min-h-10 w-full min-w-0 flex-1 bg-transparent text-sm text-charcoal outline-none placeholder:text-muted/50",
                  inputClassName
                )}
              />
              {clearBtn}
            </div>
          </div>
        </label>
        {portalDropdown}
      </div>
    );
  }

  if (variant === "dock") {
    return (
      <div ref={wrapperRef} className={cn("relative w-full min-w-0", className)}>
        <div className="flex min-w-0 items-center gap-1.5">
          <input
            {...inputProps}
            className={cn(
              "min-h-[22px] w-full min-w-0 flex-1 border-0 bg-transparent p-0 text-[15px] leading-snug text-charcoal outline-none placeholder:text-charcoal/45",
              inputClassName
            )}
          />
          {clearBtn && (
            <div className="shrink-0 [&_button]:p-1">{clearBtn}</div>
          )}
        </div>
        {portalDropdown}
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className={cn("relative", className)}>
      <div className="relative flex items-center">
        <input
          {...inputProps}
          className={cn(
            "w-full min-h-11 rounded-xl border border-border bg-white py-2 pl-4 pr-9 text-sm text-charcoal outline-none focus:border-gold/50",
            inputClassName
          )}
        />
        {clearBtn && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">{clearBtn}</div>
        )}
      </div>
      {portalDropdown}
    </div>
  );
}
