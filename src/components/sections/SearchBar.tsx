"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Search } from "lucide-react";
import { LocationSearchField } from "@/components/search/LocationSearchField";
import {
  RentalTypeSearchFields,
  appendRentalSearchParams,
} from "@/components/search/RentalTypeSearchFields";
import type { LatLng } from "@/lib/geo/polygon";
import type { SearchLocation } from "@/lib/data/locations-shared";
import { appendLocationToParams } from "@/lib/search-params";
import { RENTAL_TYPE_SEARCH_TABS } from "@/lib/homepage-content";
import type { RentalType } from "@/lib/rental-types";
import { cn } from "@/lib/utils";

const HERO_SUGGESTIONS = [
  { label: "Αθήνα", href: "/listings?city=%CE%91%CE%B8%CE%AE%CE%BD%CE%B1" },
  {
    label: "Θεσσαλονίκη",
    href: "/listings?city=%CE%98%CE%B5%CF%83%CF%83%CE%B1%CE%BB%CE%BD%CE%AF%CE%BA%CE%B7",
  },
  { label: "Βραχυχρόνια", href: "/listings?rentalType=short_term" },
  { label: "Μηνιαία", href: "/listings?rentalType=monthly" },
] as const;

const LOCATION_PLACEHOLDERS: Record<"short_term" | "monthly", string> = {
  short_term: "Αθήνα, Πάρος, Θεσσαλονίκη…",
  monthly: "Αθήνα, Πάτρα, Ηράκλειο…",
};

const HERO_LOCATION_INPUT_ID = "hero-search-location";

export function SearchBar() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [rentalType, setRentalType] = useState<RentalType>("short_term");
  const [selectedLocation, setSelectedLocation] = useState<SearchLocation | null>(null);
  const [nearbyCoords, setNearbyCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  function navigate(extra?: {
    polygon?: LatLng[];
    location?: SearchLocation | null;
    nearby?: { lat: number; lng: number } | null;
  }) {
    const form = formRef.current;
    if (!form) return;

    const data = new FormData(form);
    const params = new URLSearchParams();
    const cityText = data.get("city") as string;

    appendLocationToParams(params, {
      polygon: extra?.polygon,
      location: extra?.location ?? selectedLocation,
      nearby: extra?.nearby ?? nearbyCoords,
      cityText,
    });

    const rt = (data.get("rentalType") as string) || rentalType;
    if (rt) params.set("rentalType", rt);

    const propertyType = (data.get("propertyType") as string)?.trim();
    if (propertyType) params.set("type", propertyType);

    appendRentalSearchParams(params, data, rt);

    router.push(`/listings?${params.toString()}`);
  }

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    navigate();
  }

  return (
    <div className="space-y-3 sm:space-y-3.5">
      <div
        className={cn(
          "rounded-2xl border border-border bg-white/97 p-2.5 shadow-[0_8px_32px_-12px_rgba(26,26,26,0.14)] backdrop-blur-md sm:p-3.5",
          "ring-1 ring-white/60"
        )}
      >
        <form
          ref={formRef}
          id="hero-search-form"
          onSubmit={handleSearch}
          className="home-hero-search-form"
        >
          <input type="hidden" name="rentalType" value={rentalType} />

          {/* Row 1 — rental type tabs */}
          <div className="home-hero-search-tabs" role="tablist" aria-label="Τύπος μίσθωσης">
            {RENTAL_TYPE_SEARCH_TABS.map((tab) => {
              const active = rentalType === tab.value;
              return (
                <button
                  key={tab.value}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setRentalType(tab.value)}
                  className={cn(
                    "flex h-full min-h-[3.75rem] min-w-[8.5rem] shrink-0 flex-col justify-center rounded-xl border px-3 py-2 text-left transition-all sm:min-h-[4rem] sm:min-w-0",
                    active
                      ? "border-gold/40 bg-[#f7f0e6] ring-1 ring-gold/20"
                      : "border-border bg-white hover:border-gold/20 hover:bg-sand/30"
                  )}
                >
                  <span className="block text-sm font-semibold leading-snug text-charcoal">
                    {tab.label}
                  </span>
                  <span className="mt-0.5 block text-[11px] leading-snug text-muted/90 sm:text-xs">
                    {tab.description}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Row 2 — location + filters in one grid row */}
          <div className="home-hero-search-fields">
            <label
              htmlFor={HERO_LOCATION_INPUT_ID}
              className={cn(
                "home-hero-search-cell home-search-field relative w-full cursor-text text-left transition-colors hover:bg-[#faf6ef]",
                "focus-within:z-[1] focus-within:bg-[#f7f0e6] focus-within:ring-1 focus-within:ring-inset focus-within:ring-gold/55"
              )}
            >
              <MapPin
                className="pointer-events-none h-[18px] w-[18px] shrink-0 text-gold/85"
                strokeWidth={1.75}
              />
              <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
                <span className="home-search-field-label pointer-events-none">
                  Πού ψάχνεις;
                </span>
                <div className="min-w-0">
                  <LocationSearchField
                    variant="embedded"
                    inputId={HERO_LOCATION_INPUT_ID}
                    placeholder={
                      rentalType === "short_term"
                        ? LOCATION_PLACEHOLDERS.short_term
                        : LOCATION_PLACEHOLDERS.monthly
                    }
                    onSelect={(loc) => {
                      setSelectedLocation(loc);
                      if (loc.kind !== "nearby") setNearbyCoords(null);
                    }}
                    onNearbySelect={(coords) => {
                      setNearbyCoords(coords);
                      setSelectedLocation(null);
                    }}
                    onDrawSearch={(polygon) => navigate({ polygon })}
                  />
                </div>
              </div>
            </label>

            <RentalTypeSearchFields rentalType={rentalType} showPropertyType />
          </div>

          <button type="submit" className="home-btn-primary home-hero-search-submit mt-0.5">
            <Search className="h-4 w-4" />
            Αναζήτηση
          </button>
        </form>
      </div>

      <div className="flex flex-wrap items-center gap-x-2 gap-y-2 pt-0.5">
        <span className="mr-0.5 text-[10px] font-medium tracking-[0.1em] text-muted/75 uppercase">
          Δημοφιλή
        </span>
        {HERO_SUGGESTIONS.map((item) => (
          <Link key={item.label} href={item.href} className="home-chip">
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
