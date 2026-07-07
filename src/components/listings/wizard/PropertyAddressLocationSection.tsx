"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AddressSuggestion } from "@/lib/geocoding/types";
import {
  extractAreaFromPinResult,
  isKnownSuburbOfCity,
  parseStreetAndNumber,
  postalCodeForCity,
  streetSuggestionMatchesScope,
} from "@/lib/geocoding/geocode-utils";
import { PropertyStreetSearchField } from "@/components/listings/wizard/PropertyStreetSearchField";
import { LocationConfirmMap } from "@/components/listings/wizard/LocationConfirmMap";

export type PropertyLocationState = {
  addressSearch: string;
  addressStreet: string;
  addressNumber: string;
  addressPostalCode: string;
  city: string;
  area: string;
  cityDisplayName: string;
  areaDisplayName: string;
  formattedAddress: string;
  providerPlaceId: string;
  latitude: number | null;
  longitude: number | null;
  locationConfirmedByOwner: boolean;
  locationPinMovedManually: boolean;
  suggestedLat: number | null;
  suggestedLng: number | null;
  locationConfirmedAt: string | null;
  /** Η περιοχή επιλέχθηκε χειροκίνητα — δεν αντικαθίσταται από οδό/pin. */
  areaLockedByUser?: boolean;
};

type Props = {
  state: PropertyLocationState;
  onChange: (patch: Partial<PropertyLocationState>) => void;
  inputClassName: string;
  onCityChange: (city: string) => void;
  onAreaChange: (area: string) => void;
};

type MetaMode = "none" | "street";

function hasValidCoords(lat: number | null, lng: number | null): boolean {
  return lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng);
}

async function fetchCityCenter(name: string): Promise<AddressSuggestion | null> {
  const res = await fetch(`/api/geocode/city?name=${encodeURIComponent(name)}`);
  const data = await res.json();
  return data.result ?? null;
}

async function fetchAreaCenter(
  city: string,
  area: string
): Promise<{ lat: number; lng: number } | null> {
  const res = await fetch(
    `/api/geocode/area?city=${encodeURIComponent(city)}&area=${encodeURIComponent(area)}`
  );
  const data = await res.json();
  if (typeof data.lat === "number" && typeof data.lng === "number") {
    return { lat: data.lat, lng: data.lng };
  }
  return null;
}

function formatPostalDisplay(code: string | undefined): string | undefined {
  if (!code) return undefined;
  const digits = code.replace(/\D/g, "");
  if (digits.length === 5) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  return code.trim();
}

async function fetchGeocodeSuggestions(
  query: string,
  city: string,
  options?: {
    streetNumber?: string;
    postalCode?: string;
    area?: string;
    full?: boolean;
    center?: { lat: number; lng: number };
  }
): Promise<AddressSuggestion[]> {
  if (query.trim().length < 1) return [];
  const safePostal = postalCodeForCity(options?.postalCode, city);
  const params = new URLSearchParams({ q: query, city });
  if (options?.full) params.set("mode", "full");
  if (safePostal) params.set("postalCode", safePostal);
  if (options?.area?.trim()) params.set("area", options.area.trim());
  if (options?.streetNumber?.trim()) {
    params.set("streetNumber", options.streetNumber.trim());
  }
  if (options?.center) {
    params.set("lat", String(options.center.lat));
    params.set("lng", String(options.center.lng));
  }
  const res = await fetch(`/api/geocode/autocomplete?${params}`);
  const data = await res.json();
  return (data.suggestions ?? []) as AddressSuggestion[];
}

async function fetchGeocode(
  query: string,
  city: string,
  options?: {
    streetNumber?: string;
    postalCode?: string;
    area?: string;
    full?: boolean;
    center?: { lat: number; lng: number };
  }
): Promise<AddressSuggestion | null> {
  let suggestions = await fetchGeocodeSuggestions(query, city, options);
  if (!suggestions.length && !options?.full) {
    suggestions = await fetchGeocodeSuggestions(query, city, { ...options, full: true });
  }
  if (!suggestions.length) return null;
  if (options?.streetNumber?.trim()) {
    const exact = suggestions.find((s) => s.streetNumber === options.streetNumber!.trim());
    if (exact) return exact;
  }
  return suggestions[0];
}

export function PropertyAddressLocationSection({
  state,
  onChange,
  inputClassName,
  onAreaChange,
}: Props) {
  const [mapError, setMapError] = useState<string | null>(null);
  const [streetGeocodeHint, setStreetGeocodeHint] = useState<string | null>(null);
  const [reverseLoading, setReverseLoading] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [cityCenterLoading, setCityCenterLoading] = useState(false);
  const [cityCenterCoords, setCityCenterCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [areaCenterCoords, setAreaCenterCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const pinDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const geocodeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cityScopeRef = useRef<string | null>(null);
  const addressLiveRef = useRef({
    street: "",
    number: "",
    postal: "",
    area: "",
  });

  const lockedCity = state.city.trim();
  const lockedArea = state.area.trim();
  const areaLockedByUser = state.areaLockedByUser === true;
  const cityReady = lockedCity.length >= 2;

  addressLiveRef.current = {
    street: state.addressStreet.trim(),
    number: state.addressNumber.trim(),
    postal: state.addressPostalCode.trim(),
    area: lockedArea,
  };
  const postalMismatch =
    state.addressPostalCode.trim().length >= 5 &&
    !postalCodeForCity(state.addressPostalCode, lockedCity);

  const mapLat = hasValidCoords(state.latitude, state.longitude)
    ? state.latitude!
    : areaCenterCoords?.lat ?? cityCenterCoords?.lat ?? null;
  const mapLng = hasValidCoords(state.latitude, state.longitude)
    ? state.longitude!
    : areaCenterCoords?.lng ?? cityCenterCoords?.lng ?? null;
  const showMap = hasValidCoords(mapLat, mapLng);

  const streetSearchCenter = hasValidCoords(state.latitude, state.longitude)
    ? { lat: state.latitude!, lng: state.longitude! }
    : areaCenterCoords ?? cityCenterCoords;

  const geocodeCenter = streetSearchCenter ?? undefined;

  const buildStreetMeta = useCallback(
    (result: AddressSuggestion): Partial<PropertyLocationState> => {
      if (!lockedCity || areaLockedByUser) return {};
      const patch: Partial<PropertyLocationState> = {};
      const areaName = extractAreaFromPinResult(result, lockedCity);
      if (areaName) {
        patch.area = areaName;
        patch.areaDisplayName = areaName;
        addressLiveRef.current.area = areaName;
        onAreaChange(areaName);
      }
      const safePostal = postalCodeForCity(result.postalCode ?? undefined, lockedCity);
      if (safePostal) patch.addressPostalCode = safePostal;
      return patch;
    },
    [areaLockedByUser, lockedCity, onAreaChange]
  );

  const applyCoords = useCallback(
    (
      result: AddressSuggestion,
      options?: { preserveFields?: boolean; metaMode?: MetaMode }
    ) => {
      if (
        lockedCity &&
        !streetSuggestionMatchesScope(
          result,
          lockedCity,
          areaLockedByUser ? lockedArea || undefined : undefined,
          areaCenterCoords
        )
      ) {
        const scopeLabel = lockedArea || lockedCity;
        setStreetGeocodeHint(
          `Η διεύθυνση μπορεί να είναι εκτός ${scopeLabel}. Έλεγξε τον χάρτη.`
        );
      } else {
        setStreetGeocodeHint(null);
      }

      const patch: Partial<PropertyLocationState> = {
        latitude: result.lat,
        longitude: result.lng,
        suggestedLat: result.lat,
        suggestedLng: result.lng,
        formattedAddress: result.formattedAddress,
        providerPlaceId: result.placeId,
        locationConfirmedByOwner: true,
        locationConfirmedAt: new Date().toISOString(),
        locationPinMovedManually: false,
        ...(options?.metaMode === "street" ? buildStreetMeta(result) : {}),
      };

      if (!options?.preserveFields) {
        if (result.street) patch.addressStreet = result.street;
        if (result.streetNumber) patch.addressNumber = result.streetNumber;
        const safePostal = postalCodeForCity(result.postalCode ?? undefined, lockedCity);
        if (safePostal) patch.addressPostalCode = safePostal;
      }

      onChange(patch);
      setMapError(null);
    },
    [buildStreetMeta, areaLockedByUser, lockedArea, lockedCity, onChange, areaCenterCoords]
  );

  const applyGeocodeFields = useCallback(
    (
      result: AddressSuggestion,
      options?: { keepTypedStreet?: boolean; typedStreet?: string; typedNumber?: string }
    ) => {
      const typedStreet = options?.typedStreet?.trim() || addressLiveRef.current.street;
      const typedNumber = options?.typedNumber?.trim() || addressLiveRef.current.number;

      const patch: Partial<PropertyLocationState> = {
        latitude: result.lat,
        longitude: result.lng,
        suggestedLat: result.lat,
        suggestedLng: result.lng,
        formattedAddress: result.formattedAddress,
        providerPlaceId: result.placeId,
        locationConfirmedByOwner: true,
        locationConfirmedAt: new Date().toISOString(),
        locationPinMovedManually: false,
      };

      if (options?.keepTypedStreet && typedStreet) {
        patch.addressStreet = typedStreet;
        patch.addressSearch = typedStreet;
      } else if (result.street) {
        patch.addressStreet = result.street;
        patch.addressSearch = result.street;
      }

      if (result.streetNumber) {
        patch.addressNumber = result.streetNumber;
      } else if (typedNumber) {
        patch.addressNumber = typedNumber;
      }

      const safePostal = postalCodeForCity(result.postalCode ?? undefined, lockedCity);
      if (safePostal) {
        patch.addressPostalCode = formatPostalDisplay(safePostal) ?? safePostal;
      }

      if (!areaLockedByUser) {
        const areaName = extractAreaFromPinResult(result, lockedCity);
        if (areaName) {
          patch.area = areaName;
          patch.areaDisplayName = areaName;
          addressLiveRef.current.area = areaName;
          onAreaChange(areaName);
        }
      }

      onChange(patch);
      setStreetGeocodeHint(null);
      setMapError(null);
    },
    [areaLockedByUser, lockedCity, onAreaChange, onChange]
  );

  const runAddressGeocode = useCallback(
    async (overrides?: {
      street?: string;
      number?: string;
      postalCode?: string;
      keepTypedStreet?: boolean;
    }) => {
      const live = addressLiveRef.current;
      const street = (overrides?.street ?? live.street).trim();
      if (!street || !cityReady) return;

      const number = (overrides?.number ?? live.number).trim();
      const postalCode = postalCodeForCity(
        overrides?.postalCode ?? live.postal,
        lockedCity
      );
      const geocodeArea = areaLockedByUser ? live.area || state.area : undefined;

      setGeocoding(true);
      try {
        let result = await fetchGeocode(street, lockedCity, {
          postalCode,
          area: geocodeArea,
          center: geocodeCenter,
        });

        if (number) {
          const exact = await fetchGeocode(`${street} ${number}`, lockedCity, {
            streetNumber: number,
            postalCode,
            area: geocodeArea,
            center: geocodeCenter,
            full: true,
          });
          if (exact) result = exact;
        }

        if (result) {
          applyGeocodeFields(result, {
            keepTypedStreet: overrides?.keepTypedStreet ?? true,
            typedStreet: street,
            typedNumber: number,
          });
          return;
        }

        setStreetGeocodeHint(
          areaLockedByUser && lockedArea
            ? `Δεν βρέθηκε η διεύθυνση στην ${lockedArea}. Διόρθωσε τα πεδία ή μετακίνησε τον πείρο.`
            : `Δεν βρέθηκε η διεύθυνση στην ${lockedCity}. Διόρθωσε τα πεδία ή μετακίνησε τον πείρο.`
        );
      } finally {
        setGeocoding(false);
      }
    },
    [applyGeocodeFields, areaLockedByUser, cityReady, geocodeCenter, lockedArea, lockedCity, state.area]
  );

  const scheduleAddressGeocode = useCallback(
    (delay = 700, overrides?: Parameters<typeof runAddressGeocode>[0]) => {
      if (geocodeDebounceRef.current) clearTimeout(geocodeDebounceRef.current);
      geocodeDebounceRef.current = setTimeout(() => {
        const live = addressLiveRef.current;
        void runAddressGeocode({
          street: overrides?.street ?? live.street,
          number: overrides?.number ?? live.number,
          postalCode: overrides?.postalCode ?? live.postal,
          keepTypedStreet: overrides?.keepTypedStreet ?? true,
        });
      }, delay);
    },
    [runAddressGeocode]
  );

  const flushAddressGeocode = useCallback(() => {
    if (geocodeDebounceRef.current) {
      clearTimeout(geocodeDebounceRef.current);
      geocodeDebounceRef.current = null;
    }
    void runAddressGeocode({ keepTypedStreet: true });
  }, [runAddressGeocode]);

  function handleStreetChange(raw: string) {
    const parsed = parseStreetAndNumber(raw);
    addressLiveRef.current = {
      ...addressLiveRef.current,
      street: parsed.street,
      number: parsed.number || addressLiveRef.current.number,
    };
    onChange({
      addressStreet: parsed.street,
      addressSearch: raw,
      ...(parsed.number ? { addressNumber: parsed.number } : {}),
      locationConfirmedByOwner: false,
      locationPinMovedManually: false,
    });
    scheduleAddressGeocode(parsed.number ? 500 : 700, {
      street: parsed.street,
      number: parsed.number || addressLiveRef.current.number,
      keepTypedStreet: true,
    });
  }

  function handleNumberChange(raw: string) {
    addressLiveRef.current = { ...addressLiveRef.current, number: raw };
    onChange({
      addressNumber: raw,
      locationConfirmedByOwner: false,
      locationPinMovedManually: false,
    });
    if (addressLiveRef.current.street) {
      scheduleAddressGeocode(500, { number: raw, keepTypedStreet: true });
    }
  }

  function handlePostalChange(raw: string) {
    addressLiveRef.current = { ...addressLiveRef.current, postal: raw };
    onChange({ addressPostalCode: raw });
    if (addressLiveRef.current.street) {
      scheduleAddressGeocode(700, { postalCode: raw, keepTypedStreet: true });
    }
  }

  const ensureCityCenterOnMap = useCallback(async (city: string) => {
    setCityCenterLoading(true);
    try {
      const result = await fetchCityCenter(city);
      if (!result) return null;
      setCityCenterCoords({ lat: result.lat, lng: result.lng });
      return result;
    } finally {
      setCityCenterLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!cityReady) {
      setCityCenterCoords(null);
      return;
    }
    let cancelled = false;
    void ensureCityCenterOnMap(lockedCity).then((result) => {
      if (cancelled || !result) return;
      if (!hasValidCoords(state.latitude, state.longitude)) {
        applyCoords(result, { preserveFields: true, metaMode: "none" });
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cityReady, lockedCity, ensureCityCenterOnMap, applyCoords]);

  useEffect(() => {
    if (cityScopeRef.current === null) {
      cityScopeRef.current = lockedCity;
      return;
    }
    if (cityScopeRef.current === lockedCity) return;
    cityScopeRef.current = lockedCity;

    if (geocodeDebounceRef.current) clearTimeout(geocodeDebounceRef.current);
    if (pinDebounceRef.current) clearTimeout(pinDebounceRef.current);

    addressLiveRef.current = { street: "", number: "", postal: "", area: "" };
    setStreetGeocodeHint(null);
    setAreaCenterCoords(null);

    onChange({
      addressStreet: "",
      addressSearch: "",
      addressNumber: "",
      addressPostalCode: "",
      area: "",
      areaDisplayName: "",
      areaLockedByUser: false,
      formattedAddress: "",
      providerPlaceId: "",
      latitude: null,
      longitude: null,
      suggestedLat: null,
      suggestedLng: null,
      locationConfirmedByOwner: false,
      locationPinMovedManually: false,
      locationConfirmedAt: null,
    });
  }, [lockedCity, onChange]);

  useEffect(() => {
    return () => {
      if (pinDebounceRef.current) clearTimeout(pinDebounceRef.current);
      if (geocodeDebounceRef.current) clearTimeout(geocodeDebounceRef.current);
    };
  }, []);

  useEffect(() => {
    if (!cityReady || !lockedArea) {
      setAreaCenterCoords(null);
      return;
    }
    let cancelled = false;
    void fetchAreaCenter(lockedCity, lockedArea).then((center) => {
      if (cancelled) return;
      setAreaCenterCoords(center);
      if (areaLockedByUser && center) {
        onChange({
          latitude: center.lat,
          longitude: center.lng,
          suggestedLat: center.lat,
          suggestedLng: center.lng,
          locationConfirmedByOwner: false,
          locationPinMovedManually: false,
          locationConfirmedAt: null,
        });
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cityReady, lockedArea, lockedCity, areaLockedByUser]);

  function applyStreetSuggestion(s: AddressSuggestion) {
    const suburbName = s.area?.trim();
    if (
      !areaLockedByUser &&
      !lockedArea &&
      !s.street &&
      suburbName &&
      isKnownSuburbOfCity(suburbName, lockedCity)
    ) {
      applyCoords(s, { preserveFields: true, metaMode: "street" });
      onChange({
        area: suburbName,
        areaDisplayName: suburbName,
        addressStreet: "",
        addressSearch: "",
        addressNumber: "",
        locationConfirmedByOwner: false,
        locationPinMovedManually: false,
      });
      onAreaChange(suburbName);
      return;
    }

    applyCoords(s, { preserveFields: true, metaMode: "street" });
    const streetName = s.street ?? s.primary;
    addressLiveRef.current = {
      ...addressLiveRef.current,
      street: streetName,
      number: s.streetNumber ?? addressLiveRef.current.number,
    };
    const patch: Partial<PropertyLocationState> = {
      addressStreet: streetName,
      addressSearch: streetName,
      ...(s.streetNumber ? { addressNumber: s.streetNumber } : {}),
      ...(s.postalCode
        ? {
            addressPostalCode:
              formatPostalDisplay(postalCodeForCity(s.postalCode, lockedCity)) ??
              s.postalCode,
          }
        : {}),
    };
    if (!areaLockedByUser) {
      const areaName = extractAreaFromPinResult(s, lockedCity);
      if (areaName) {
        patch.area = areaName;
        patch.areaDisplayName = areaName;
        addressLiveRef.current.area = areaName;
        onAreaChange(areaName);
      }
    }
    onChange(patch);
  }

  const applyPinLocation = useCallback(
    (lat: number, lng: number, r: AddressSuggestion, matchesScope: boolean) => {
      const areaName = extractAreaFromPinResult(r, lockedCity);
      const safePostal = postalCodeForCity(r.postalCode ?? undefined, lockedCity);

      const patch: Partial<PropertyLocationState> = {
        latitude: lat,
        longitude: lng,
        suggestedLat: lat,
        suggestedLng: lng,
        formattedAddress: r.formattedAddress,
        providerPlaceId: r.placeId,
        locationConfirmedByOwner: matchesScope,
        locationConfirmedAt: matchesScope ? new Date().toISOString() : null,
        locationPinMovedManually: true,
      };

      if (r.street) {
        patch.addressStreet = r.street;
        patch.addressSearch = r.street;
        addressLiveRef.current = {
          ...addressLiveRef.current,
          street: r.street,
          number: r.streetNumber ?? addressLiveRef.current.number,
        };
      }
      if (r.streetNumber) patch.addressNumber = r.streetNumber;
      if (safePostal) {
        patch.addressPostalCode = formatPostalDisplay(safePostal) ?? safePostal;
      }
      if (!areaLockedByUser && areaName) {
        patch.area = areaName;
        patch.areaDisplayName = areaName;
        addressLiveRef.current.area = areaName;
        onAreaChange(areaName);
      }

      onChange(patch);
      if (!matchesScope) {
        const scopeLabel = lockedArea || lockedCity;
        setStreetGeocodeHint(
          `Ο πείρος φαίνεται εκτός ${scopeLabel}. Έλεγξε τη διεύθυνση ή μετακίνησέ τον.`
        );
      } else {
        setStreetGeocodeHint(null);
      }
      setMapError(null);
    },
    [areaLockedByUser, lockedArea, lockedCity, onAreaChange, onChange]
  );

  const reverseGeocode = useCallback(
    async (lat: number, lng: number) => {
      setReverseLoading(true);
      try {
        const params = new URLSearchParams({
          lat: String(lat),
          lng: String(lng),
          city: lockedCity,
        });
        if (areaLockedByUser && lockedArea) params.set("area", lockedArea);
        const res = await fetch(`/api/geocode/reverse?${params}`);
        const data = await res.json();
        if (data.result) {
          applyPinLocation(
            lat,
            lng,
            data.result as AddressSuggestion,
            data.matchesCity !== false
          );
        } else {
          onChange({
            latitude: lat,
            longitude: lng,
            locationConfirmedByOwner: false,
            locationPinMovedManually: true,
          });
        }
      } finally {
        setReverseLoading(false);
      }
    },
    [applyPinLocation, areaLockedByUser, lockedArea, lockedCity, onChange]
  );

  function handlePinMove(lat: number, lng: number) {
    if (pinDebounceRef.current) clearTimeout(pinDebounceRef.current);
    pinDebounceRef.current = setTimeout(() => {
      void reverseGeocode(lat, lng);
    }, 350);
  }

  return (
    <div className="space-y-4">
      <PropertyStreetSearchField
        city={lockedCity}
        area={areaLockedByUser ? state.area : undefined}
        postalCode={state.addressPostalCode}
        searchCenter={streetSearchCenter}
        areaCenter={areaCenterCoords}
        value={state.addressSearch || state.addressStreet}
        onChange={handleStreetChange}
        onBlur={flushAddressGeocode}
        onSelectStreet={applyStreetSuggestion}
        inputClassName={inputClassName}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs text-muted uppercase">Αριθμός (οδού) *</span>
          <input
            value={state.addressNumber}
            onChange={(e) => handleNumberChange(e.target.value)}
            onBlur={flushAddressGeocode}
            placeholder="π.χ. 17"
            className={inputClassName}
          />
          <span className="mt-1 block text-[10px] text-muted">
            Αριθμός κτιρίου — όχι διαμέρισμα
          </span>
        </label>
        <label className="block">
          <span className="text-xs text-muted uppercase">Ταχυδρομικός κώδικας *</span>
          <input
            value={state.addressPostalCode}
            onChange={(e) => handlePostalChange(e.target.value)}
            onBlur={flushAddressGeocode}
            className={inputClassName}
          />
          {postalMismatch && (
            <span className="mt-1 block text-[10px] text-amber-800">
              Ο ΤΚ δεν ταιριάζει με την {lockedCity} — διόρθωσέ τον.
            </span>
          )}
        </label>
      </div>

      {streetGeocodeHint && (
        <p className="text-xs text-amber-800">{streetGeocodeHint}</p>
      )}

      {cityReady && (
        <div className="rounded-xl border border-border bg-sand/20 p-4">
          <h3 className="text-sm font-semibold text-charcoal">Ακριβής θέση στον χάρτη</h3>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            Κλικ ή σύρε τον πείρο — συμπληρώνονται αυτόματα οδός, αριθμός, ΤΚ και περιοχή
            (μέσα στην <strong>{lockedArea || lockedCity}</strong>).
          </p>

          {showMap ? (
            <>
              <div className="mt-4 overflow-hidden rounded-xl border border-border">
                <LocationConfirmMap
                  lat={mapLat!}
                  lng={mapLng!}
                  zoom={state.addressNumber.trim() ? 18 : 16}
                  onPositionChange={handlePinMove}
                />
              </div>
              {state.formattedAddress && (
                <p className="mt-3 text-xs text-muted">
                  <span className="font-medium text-charcoal">Τοποθεσία:</span>{" "}
                  {state.formattedAddress}
                  {geocoding || reverseLoading || cityCenterLoading ? " (ενημέρωση...)" : ""}
                </p>
              )}
              {mapError && <p className="mt-2 text-xs text-red-600">{mapError}</p>}
            </>
          ) : (
            <p className="mt-3 text-xs text-muted">
              {cityCenterLoading || geocoding ? "Φόρτωση χάρτη..." : "Φόρτωση χάρτη πόλης..."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
