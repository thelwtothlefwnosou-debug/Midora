import { normalizeLocationQuery } from "@/lib/locations/normalize";
import { CURATED_LOCATION_DATASET } from "@/lib/locations/greece-dataset-curated";
import {
  resolveLocation,
  searchGreekLocations,
  searchWizardAreas as searchAreas,
  searchWizardCities as searchCities,
} from "@/lib/locations/search";
import type { LegalRegistryType } from "@/lib/types";

import { MIN_LISTING_PHOTOS_FOR_REVIEW } from "@/lib/constants";

export const MIN_LISTING_TITLE_LENGTH = 10;
export const MIN_LISTING_DESCRIPTION_LENGTH = 10;
export { MIN_LISTING_PHOTOS_FOR_REVIEW as MIN_PHOTOS_FOR_REVIEW };

export const LISTING_SAVE_ERROR_MSG =
  "Δεν ήταν δυνατή η αποθήκευση της αγγελίας. Δοκίμασε ξανά ή επικοινώνησε με την υποστήριξη.";

const REGISTRY_PATTERNS: Record<Exclude<LegalRegistryType, "none">, RegExp> = {
  ama: /^\d{11}$/,
  esl: /^[A-Z0-9]{6,20}$/i,
  mag: /^[A-Z0-9]{6,20}$/i,
};

export function isValidRegistryNumber(
  type: LegalRegistryType,
  value: string
): boolean {
  if (type === "none") return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  const pattern = REGISTRY_PATTERNS[type];
  return pattern ? pattern.test(trimmed.replace(/\s/g, "")) : trimmed.length >= 4;
}

export function resolveWizardCity(input: string): {
  city: string;
  needsReview: boolean;
} {
  const trimmed = input.trim();
  if (!trimmed) return { city: "", needsReview: true };

  const resolved = resolveLocation(trimmed);
  if (resolved?.strongMatch) {
    return { city: resolved.city, needsReview: false };
  }

  const suggestions = searchGreekLocations(trimmed, 1);
  if (suggestions.length > 0) {
    return { city: suggestions[0].city, needsReview: false };
  }

  return { city: trimmed, needsReview: true };
}

export function resolveWizardArea(
  city: string,
  areaInput: string
): { area: string; mismatch: boolean } {
  const area = areaInput.trim();
  if (!area || !city.trim()) return { area, mismatch: false };

  const cityNorm = normalizeLocationQuery(city);
  const areaNorm = normalizeLocationQuery(area);

  const catalogMatch = CURATED_LOCATION_DATASET.find(
    (e) =>
      (e.locationType === "neighborhood" ||
        e.locationType === "settlement" ||
        e.locationType === "town") &&
      e.parentCity &&
      normalizeLocationQuery(e.parentCity) === cityNorm &&
      (normalizeLocationQuery(e.nameEl) === areaNorm ||
        e.aliases.some((a) => normalizeLocationQuery(a) === areaNorm))
  );
  if (catalogMatch) return { area: catalogMatch.nameEl, mismatch: false };

  const wrongCity = CURATED_LOCATION_DATASET.find(
    (e) =>
      (e.locationType === "neighborhood" ||
        e.locationType === "settlement" ||
        e.locationType === "town") &&
      e.parentCity &&
      normalizeLocationQuery(e.parentCity) !== cityNorm &&
      (normalizeLocationQuery(e.nameEl) === areaNorm ||
        e.aliases.some((a) => normalizeLocationQuery(a) === areaNorm))
  );
  if (wrongCity) {
    return { area, mismatch: true };
  }

  return { area, mismatch: false };
}

export function searchWizardCities(query: string, limit = 10): string[] {
  return searchCities(query, limit);
}

export function searchWizardAreas(city: string, query: string, limit = 12): string[] {
  return searchAreas(city, query, limit);
}

export function validateBasicDetails(input: {
  title: string;
  city: string;
  area: string;
  addressStreet: string;
  addressNumber: string;
  addressPostalCode: string;
  propertyType: string;
  sqm: string;
  bedrooms: string;
  bathrooms: string;
  floor: string;
  description: string;
  forSubmission: boolean;
}): string | null {
  const title = input.title.trim();
  if (!title) return "Συμπλήρωσε τον τίτλο της αγγελίας.";
  if (input.forSubmission && title.length < MIN_LISTING_TITLE_LENGTH) {
    return `Ο τίτλος πρέπει να έχει τουλάχιστον ${MIN_LISTING_TITLE_LENGTH} χαρακτήρες.`;
  }

  if (!input.city.trim()) return "Συμπλήρωσε την πόλη.";

  const effectiveArea = input.area.trim() || input.city.trim();
  const { city: canonicalCity } = resolveWizardCity(input.city);
  if (input.area.trim()) {
    const { mismatch } = resolveWizardArea(canonicalCity, input.area);
    if (mismatch) {
      return "Η περιοχή δεν ταιριάζει με την επιλεγμένη πόλη.";
    }
  } else if (!effectiveArea) {
    return "Συμπλήρωσε την πόλη.";
  }

  if (input.forSubmission) {
    if (!input.addressStreet.trim()) return "Συμπλήρωσε την οδό.";
    if (!input.addressNumber.trim()) return "Συμπλήρωσε τον αριθμό.";
    if (!input.addressPostalCode.trim()) return "Συμπλήρωσε τον ταχυδρομικό κώδικα.";
    if (!input.propertyType) return "Επίλεξε τύπο ακινήτου.";

    const sqm = parseInt(input.sqm, 10);
    if (!Number.isFinite(sqm) || sqm <= 0) {
      return "Τα τετραγωνικά μέτρα πρέπει να είναι θετικός ακέραιος αριθμός.";
    }

    const bedrooms = parseInt(input.bedrooms, 10);
    if (!Number.isFinite(bedrooms) || bedrooms < 0) {
      return "Τα υπνοδωμάτια πρέπει να είναι ακέραιος ≥ 0 (0 = στούντιο).";
    }

    const bathrooms = parseInt(input.bathrooms, 10);
    if (!Number.isFinite(bathrooms) || bathrooms < 0) {
      return "Συμπλήρωσε τον αριθμό μπάνιων (0 αν δεν υπάρχει ξεχωριστό).";
    }

    const floor = parseInt(input.floor, 10);
    if (!Number.isFinite(floor) || floor < 0) {
      return "Συμπλήρωσε τον όροφο (0 = ισόγειο).";
    }

    const description = input.description.trim();
    if (!description) return "Συμπλήρωσε την περιγραφή.";
    if (description.length < MIN_LISTING_DESCRIPTION_LENGTH) {
      return `Η περιγραφή πρέπει να έχει τουλάχιστον ${MIN_LISTING_DESCRIPTION_LENGTH} χαρακτήρες.`;
    }
  }

  return null;
}

export function buildPrivateAddress(fields: {
  addressStreet: string;
  addressNumber: string;
  addressPostalCode: string;
  addressFloor?: string;
  addressUnit?: string;
  city: string;
  area: string;
}): string {
  const parts = [
    [fields.addressStreet.trim(), fields.addressNumber.trim()].filter(Boolean).join(" "),
    fields.addressPostalCode.trim() ? `ΤΚ ${fields.addressPostalCode.trim()}` : "",
    fields.addressFloor?.trim() ? `Όροφος ${fields.addressFloor.trim()}` : "",
    fields.addressUnit?.trim() ? `Διαμ. ${fields.addressUnit.trim()}` : "",
    fields.area.trim(),
    fields.city.trim(),
  ].filter(Boolean);
  return parts.join(", ");
}
