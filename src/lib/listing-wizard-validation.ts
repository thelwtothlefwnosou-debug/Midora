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
import { countGraphemes } from "@/lib/text-graphemes";

export const MIN_LISTING_TITLE_LENGTH = 5;
export const MIN_LISTING_DESCRIPTION_LENGTH = 10;
/** Max grapheme length for listing description (wizard + API). */
export const MAX_LISTING_DESCRIPTION_LENGTH = 1000;
export { MIN_LISTING_PHOTOS_FOR_REVIEW as MIN_PHOTOS_FOR_REVIEW };

/** Wizard.errors message keys — translate in UI via useTranslations("Wizard.errors"). */
export const LISTING_TITLE_MIN_ERROR = "titleMinLength";
export const LISTING_DESCRIPTION_MAX_ERROR = "descriptionMaxLength";
export const LISTING_SAVE_ERROR_MSG = "listingSaveFailed";

/** Trimmed title grapheme length — whitespace-only is 0. */
export function listingTitleGraphemeLength(title: string): number {
  return countGraphemes(title.trim());
}

export function isListingTitleLongEnough(title: string): boolean {
  return listingTitleGraphemeLength(title) >= MIN_LISTING_TITLE_LENGTH;
}

export function listingTitleValidationError(
  title: string,
  options?: { requireNonEmpty?: boolean }
): string | null {
  const trimmed = title.trim();
  if (!trimmed) {
    return options?.requireNonEmpty === false ? null : "titleRequired";
  }
  if (listingTitleGraphemeLength(trimmed) < MIN_LISTING_TITLE_LENGTH) {
    return LISTING_TITLE_MIN_ERROR;
  }
  return null;
}

/** Description grapheme length (includes whitespace / newlines as typed). */
export function listingDescriptionGraphemeLength(description: string): number {
  return countGraphemes(description);
}

export function isListingDescriptionWithinMax(description: string): boolean {
  return (
    listingDescriptionGraphemeLength(description) <= MAX_LISTING_DESCRIPTION_LENGTH
  );
}

/**
 * Description validation.
 * - Empty is allowed unless `forSubmission` (min length applies only then).
 * - Over max always errors; never truncates.
 */
export function listingDescriptionValidationError(
  description: string,
  options?: { forSubmission?: boolean }
): string | null {
  if (!isListingDescriptionWithinMax(description)) {
    return LISTING_DESCRIPTION_MAX_ERROR;
  }
  if (options?.forSubmission) {
    const trimmed = description.trim();
    if (!trimmed) return "descriptionRequired";
    if (countGraphemes(trimmed) < MIN_LISTING_DESCRIPTION_LENGTH) {
      return "descriptionMinLength";
    }
  }
  return null;
}

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
  if (!title) return "titleRequired";
  if (input.forSubmission) {
    const titleError = listingTitleValidationError(title);
    if (titleError) return titleError;
  }

  if (!input.city.trim()) return "cityRequired";

  const effectiveArea = input.area.trim() || input.city.trim();
  const { city: canonicalCity } = resolveWizardCity(input.city);
  if (input.area.trim()) {
    const { mismatch } = resolveWizardArea(canonicalCity, input.area);
    if (mismatch) {
      return "areaCityMismatch";
    }
  } else if (!effectiveArea) {
    return "cityRequired";
  }

  if (input.forSubmission) {
    if (!input.addressStreet.trim()) return "streetRequired";
    if (!input.addressNumber.trim()) return "addressNumberRequired";
    if (!input.addressPostalCode.trim()) return "postalCodeRequired";
    if (!input.propertyType) return "propertyTypeRequired";

    const sqm = parseInt(input.sqm, 10);
    if (!Number.isFinite(sqm) || sqm <= 0) {
      return "sqmInvalid";
    }

    const bedrooms = parseInt(input.bedrooms, 10);
    if (!Number.isFinite(bedrooms) || bedrooms < 0) {
      return "bedroomsInvalid";
    }

    const bathrooms = parseInt(input.bathrooms, 10);
    if (!Number.isFinite(bathrooms) || bathrooms < 0) {
      return "bathroomsRequired";
    }

    const floor = parseInt(input.floor, 10);
    if (!Number.isFinite(floor) || floor < 0) {
      return "floorRequired";
    }
  }

  const descriptionError = listingDescriptionValidationError(input.description, {
    forSubmission: input.forSubmission,
  });
  if (descriptionError) return descriptionError;

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
