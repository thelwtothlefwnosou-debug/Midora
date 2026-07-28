"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
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

export function PropertyAddressLocationSection({
  state,
  onChange,
  inputClassName,
  onAreaChange,
}: Props) {
  const t = useTranslations("Wizard.location");
  const [mapError, setMapError] = useState<string | null>(null);
  const [streetGeocodeHint, setStreetGeocodeHint] = useState<string | null>(null);
  const [reverseLoading, setReverseLoading] = useState(false);
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
      options?: { preserveFields?: boolean; metaMode?: MetaMode; confirmLocation?: boolean }
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
        setStreetGeocodeHint(t("outsideScope", { scope: scopeLabel }));
      } else {
        setStreetGeocodeHint(null);
      }

      const confirm = options?.confirmLocation === true;
      const patch: Partial<PropertyLocationState> = {
        latitude: result.lat,
        longitude: result.lng,
        suggestedLat: result.lat,
        suggestedLng: result.lng,
        formattedAddress: result.formattedAddress,
        providerPlaceId: result.placeId,
        locationConfirmedByOwner: confirm,
        locationConfirmedAt: confirm ? new Date().toISOString() : null,
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
    [buildStreetMeta, areaLockedByUser, lockedArea, lockedCity, onChange, areaCenterCoords, t]
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
        // Suggestion/pin apply coords — public visibility stays opt-in via checkbox.
        locationConfirmedByOwner: false,
        locationConfirmedAt: null,
        locationPinMovedManually: false,
      };

      if (options?.keepTypedStreet && typedStreet) {
        patch.addressStreet = typedStreet;
        patch.addressSearch = typedStreet;
      } else if (result.street) {
        patch.addressStreet = result.street;
        patch.addressSearch = result.street;
      }

      // Only fill number/postal when the selected result actually provides them.
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
      locationConfirmedAt: null,
      locationPinMovedManually: false,
    });
    setStreetGeocodeHint(null);
    scheduleAddressGeocode(
      parsed.street,
      parsed.number || addressLiveRef.current.number
    );
  }

  function handleNumberChange(raw: string) {
    addressLiveRef.current = { ...addressLiveRef.current, number: raw };
    onChange({
      addressNumber: raw,
      locationConfirmedByOwner: false,
      locationConfirmedAt: null,
      locationPinMovedManually: false,
    });
    scheduleAddressGeocode(addressLiveRef.current.street, raw);
  }

  function handlePostalChange(raw: string) {
    addressLiveRef.current = { ...addressLiveRef.current, postal: raw };
    onChange({
      addressPostalCode: raw,
      locationConfirmedByOwner: false,
      locationConfirmedAt: null,
    });
    scheduleAddressGeocode(
      addressLiveRef.current.street,
      addressLiveRef.current.number
    );
  }

  function scheduleAddressGeocode(street: string, number: string) {
    if (geocodeDebounceRef.current) {
      clearTimeout(geocodeDebounceRef.current);
      geocodeDebounceRef.current = null;
    }
    const streetTrim = street.trim();
    const numberTrim = number.trim();
    if (!cityReady || streetTrim.length < 2 || !numberTrim) {
      return;
    }
    geocodeDebounceRef.current = setTimeout(() => {
      void forwardGeocodeStreet(streetTrim, numberTrim);
    }, 450);
  }

  async function forwardGeocodeStreet(street: string, number: string) {
    try {
      const params = new URLSearchParams({
        q: street,
        city: lockedCity,
        streetNumber: number,
        mode: "full",
      });
      if (areaLockedByUser && lockedArea) params.set("area", lockedArea);
      if (state.addressPostalCode.trim()) {
        params.set("postalCode", state.addressPostalCode.trim());
      }
      if (streetSearchCenter) {
        params.set("lat", String(streetSearchCenter.lat));
        params.set("lng", String(streetSearchCenter.lng));
      }
      const res = await fetch(`/api/geocode/autocomplete?${params}`);
      const data = await res.json();
      const suggestions = (data.suggestions ?? []) as AddressSuggestion[];
      const exact =
        suggestions.find(
          (s) =>
            s.streetNumber === number &&
            (s.street ?? "").toLowerCase().includes(street.toLowerCase().slice(0, 4))
        ) ??
        suggestions.find((s) => s.streetNumber === number) ??
        suggestions[0];
      if (exact && Number.isFinite(exact.lat) && Number.isFinite(exact.lng)) {
        applyGeocodeFields(exact, {
          keepTypedStreet: true,
          typedStreet: street,
          typedNumber: number,
        });
        setStreetGeocodeHint(t("confirmOnMap"));
        return;
      }
      // Keep existing lat/lng — ask owner to move the pin.
      setStreetGeocodeHint(t("noExactPosition"));
    } catch {
      setStreetGeocodeHint(t("noExactPosition"));
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
      // Map preview only — never rewrite street/number/postal/confirmation on initial center.
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cityReady, lockedCity, ensureCityCenterOnMap]);

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
      applyCoords(s, { preserveFields: true, metaMode: "street", confirmLocation: false });
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

    const streetName = s.street ?? s.primary;
    addressLiveRef.current = {
      ...addressLiveRef.current,
      street: streetName,
      number: s.streetNumber ?? addressLiveRef.current.number,
    };
    applyGeocodeFields(s, {
      keepTypedStreet: false,
      typedStreet: streetName,
      typedNumber: s.streetNumber ?? undefined,
    });
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
        setStreetGeocodeHint(t("pinOutsideScope", { scope: scopeLabel }));
      } else {
        setStreetGeocodeHint(null);
      }
      setMapError(null);
    },
    [areaLockedByUser, lockedArea, lockedCity, onAreaChange, onChange, t]
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
        onSelectStreet={applyStreetSuggestion}
        inputClassName={inputClassName}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs text-muted uppercase">{t("streetNumber")}</span>
          <input
            value={state.addressNumber}
            onChange={(e) => handleNumberChange(e.target.value)}
            placeholder={t("streetNumberPlaceholder")}
            className={inputClassName}
          />
          <span className="mt-1 block text-[10px] text-muted">
            {t("streetNumberHint")}
          </span>
        </label>
        <label className="block">
          <span className="text-xs text-muted uppercase">{t("postalCode")}</span>
          <input
            value={state.addressPostalCode}
            onChange={(e) => handlePostalChange(e.target.value)}
            className={inputClassName}
          />
          {postalMismatch && (
            <span className="mt-1 block text-[10px] text-amber-800">
              {t("postalMismatch", { city: lockedCity })}
            </span>
          )}
        </label>
      </div>

      {streetGeocodeHint && (
        <p className="text-xs text-amber-800">{streetGeocodeHint}</p>
      )}

      {cityReady && (
        <div className="rounded-xl border border-border bg-sand/20 p-4">
          <h3 className="text-sm font-semibold text-charcoal">{t("mapTitle")}</h3>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            {t("mapHint", { scope: lockedArea || lockedCity })}
          </p>
          {!state.locationConfirmedByOwner &&
            (state.addressStreet.trim() || state.addressNumber.trim()) && (
              <p className="mt-2 text-xs font-medium text-amber-800">
                {t("mapConfirmNeeded")}
              </p>
            )}
          {state.locationConfirmedByOwner && (
            <p className="mt-2 text-xs font-medium text-teal">{t("mapConfirmed")}</p>
          )}

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
                  <span className="font-medium text-charcoal">{t("locationLabel")}</span>{" "}
                  {state.formattedAddress}
                  {reverseLoading || cityCenterLoading ? t("updating") : ""}
                </p>
              )}
              {mapError && <p className="mt-2 text-xs text-red-600">{mapError}</p>}
            </>
          ) : (
            <p className="mt-3 text-xs text-muted">
              {cityCenterLoading ? t("loadingMap") : t("loadingCityMap")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
