import { normalizeLocationQuery } from "@/lib/locations/normalize";
import { resolveLocation } from "@/lib/locations/search";

type CityCenter = { lat: number; lng: number; label: string };

export type KnownCityCenterResult = {
  placeId: string;
  primary: string;
  secondary: string;
  formattedAddress: string;
  lat: number;
  lng: number;
  street: string | null;
  streetNumber: string | null;
  city: string | null;
  area: string | null;
  postalCode: string | null;
};

/** Instant fallback when Nominatim is slow or returns no match. */
const KNOWN_CITY_CENTERS: Record<string, CityCenter> = {
  αθηνα: { lat: 37.9838, lng: 23.7275, label: "Αθήνα" },
  θεσσαλονικη: { lat: 40.6401, lng: 22.9444, label: "Θεσσαλονίκη" },
  πατρα: { lat: 38.2466, lng: 21.7346, label: "Πάτρα" },
  ηρακλειο: { lat: 35.3387, lng: 25.1442, label: "Ηράκλειο" },
  λαρισα: { lat: 39.639, lng: 22.4191, label: "Λάρισα" },
  βολος: { lat: 39.361, lng: 22.942, label: "Βόλος" },
  ιωαννινα: { lat: 39.665, lng: 20.8537, label: "Ιωάννινα" },
  χανια: { lat: 35.5138, lng: 24.018, label: "Χανιά" },
  ρεθυμνο: { lat: 35.3662, lng: 24.4824, label: "Ρέθυμνο" },
  "αγιος νικολαος": { lat: 35.1906, lng: 25.7153, label: "Άγιος Νικόλαος" },
  ιεραπετρα: { lat: 35.0119, lng: 25.7425, label: "Ιεράπετρα" },
  σητεια: { lat: 35.2085, lng: 26.1056, label: "Σητεία" },
  ροδος: { lat: 36.4341, lng: 28.2176, label: "Ρόδος" },
  κερκυρα: { lat: 39.6243, lng: 19.9217, label: "Κέρκυρα" },
  καλαματα: { lat: 37.039, lng: 22.1142, label: "Καλαμάτα" },
  κοζανη: { lat: 40.3006, lng: 21.7889, label: "Κοζάνη" },
  πτολεμαιδα: { lat: 40.5147, lng: 21.6786, label: "Πτολεμαΐδα" },
  καβαλα: { lat: 40.936, lng: 24.408, label: "Καβάλα" },
  αλεξανδρουπολη: { lat: 40.8475, lng: 25.8743, label: "Αλεξανδρούπολη" },
  κομοτηνη: { lat: 41.122, lng: 25.405, label: "Κομοτηνή" },
  ξανθη: { lat: 41.1342, lng: 24.888, label: "Ξάνθη" },
  σερρες: { lat: 41.085, lng: 23.547, label: "Σέρρες" },
  κατερινη: { lat: 40.2694, lng: 22.5061, label: "Κατερίνη" },
  πειραιας: { lat: 37.942, lng: 23.646, label: "Πειραιάς" },
  χαλκιδα: { lat: 38.4636, lng: 23.6, label: "Χαλκίδα" },
  λαμια: { lat: 38.899, lng: 22.434, label: "Λαμία" },
  τρικαλα: { lat: 39.555, lng: 21.767, label: "Τρίκαλα" },
  αγρινιο: { lat: 38.621, lng: 21.407, label: "Αγρίνιο" },
  ναυπλιο: { lat: 37.568, lng: 22.801, label: "Ναύπλιο" },
  μυκονος: { lat: 37.4467, lng: 25.3289, label: "Μύκονος" },
  σαντορινη: { lat: 36.3932, lng: 25.4615, label: "Σαντορίνη" },
};

/** Γνωστά προάστια — άμεση τοποθέτηση χάρτη χωρίς αναμονή geocoder. */
const KNOWN_SUBURB_CENTERS: Record<string, CityCenter> = {
  "θεσσαλονικη|ευοσμος": { lat: 40.6656, lng: 22.9078, label: "Εύοσμος" },
  "θεσσαλονικη|θερμη": { lat: 40.5472, lng: 23.0197, label: "Θέρμη" },
  "θεσσαλονικη|καλαμαρια": { lat: 40.5825, lng: 22.9500, label: "Καλαμαριά" },
  "θεσσαλονικη|σταυρουπολη": { lat: 40.6647, lng: 22.9389, label: "Σταυρούπολη" },
  "θεσσαλονικη|νεαπολη": { lat: 40.6519, lng: 22.9442, label: "Νεάπολη" },
  "θεσσαλονικη|τουμπα": { lat: 40.6147, lng: 22.9703, label: "Τούμπα" },
  "θεσσαλονικη|μενεμενη": { lat: 40.6589, lng: 22.8917, label: "Μενεμένη" },
  "θεσσαλονικη|πυλαια": { lat: 40.5992, lng: 23.0125, label: "Πυλαία" },
  "θεσσαλονικη|πανοραμα": { lat: 40.5875, lng: 23.0314, label: "Πανόραμα" },
  "θεσσαλονικη|περαια": { lat: 40.5556, lng: 22.9267, label: "Περαία" },
  "αθηνα|κουκακι": { lat: 37.9668, lng: 23.7281, label: "Κουκάκι" },
  "αθηνα|γλυφαδα": { lat: 37.8625, lng: 23.7547, label: "Γλυφάδα" },
  "αθηνα|κολωνακι": { lat: 37.9778, lng: 23.7418, label: "Κολωνάκι" },
};

function suburbLookupKey(cityName: string, suburbName: string): string {
  const cityKey = lookupKey(cityName);
  const suburbKey = normalizeLocationQuery(suburbName);
  return `${cityKey}|${suburbKey}`;
}

export function getKnownSuburbCenter(
  suburbName: string,
  cityName: string
): KnownCityCenterResult | null {
  const key = suburbLookupKey(cityName, suburbName);
  const center = KNOWN_SUBURB_CENTERS[key];
  if (!center) return null;

  const cityLabel = resolveLocation(cityName.trim())?.city ?? cityName.trim();
  return {
    placeId: `known-suburb-${key}`,
    primary: center.label,
    secondary: cityLabel,
    formattedAddress: `${center.label}, ${cityLabel}, Ελλάδα`,
    lat: center.lat,
    lng: center.lng,
    street: null,
    streetNumber: null,
    city: cityLabel,
    area: center.label,
    postalCode: null,
  };
}

export function getKnownSuburbCoords(
  suburbName: string,
  cityName: string
): { lat: number; lng: number } | null {
  const center = getKnownSuburbCenter(suburbName, cityName);
  return center ? { lat: center.lat, lng: center.lng } : null;
}

function lookupKey(cityName: string): string {
  const canonical = resolveLocation(cityName.trim())?.city ?? cityName.trim();
  return normalizeLocationQuery(canonical);
}

export function getKnownCityCenter(cityName: string): KnownCityCenterResult | null {
  const key = lookupKey(cityName);
  const center = KNOWN_CITY_CENTERS[key];
  if (!center) return null;

  return {
    placeId: `known-city-${key}`,
    primary: center.label,
    secondary: "Ελλάδα",
    formattedAddress: `${center.label}, Ελλάδα`,
    lat: center.lat,
    lng: center.lng,
    street: null,
    streetNumber: null,
    city: center.label,
    area: null,
    postalCode: null,
  };
}

export function getKnownCityCoords(
  cityName: string
): { lat: number; lng: number } | null {
  const key = lookupKey(cityName);
  const center = KNOWN_CITY_CENTERS[key];
  return center ? { lat: center.lat, lng: center.lng } : null;
}
