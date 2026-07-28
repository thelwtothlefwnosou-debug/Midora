/**
 * Single source of truth for create-listing wizard step + review + publish checks.
 * Numeric fields use null/undefined/'' checks — never falsy `!value` for 0-valid numbers.
 */

import { MIN_LISTING_PHOTOS_FOR_REVIEW } from "@/lib/constants";
import { hasCallablePhone } from "@/lib/listing-contact";
import type { PortalListingFields } from "@/lib/listing-portal-payload";
import { needsAmaForFields } from "@/lib/listing-portal-payload";
import {
  isListingTitleLongEnough,
  isValidRegistryNumber,
  listingDescriptionValidationError,
  listingTitleValidationError,
  resolveWizardArea,
  resolveWizardCity,
} from "@/lib/listing-wizard-validation";
import {
  photoCountStepError,
  photoCountSubmitError,
} from "@/lib/listing-photo-validation";

function areWizardDeclarationsComplete(input: {
  needsRegistryDeclaration: boolean;
  ownerAccepted: boolean;
  registryAccepted: boolean;
  platformAccepted: boolean;
  taxAccepted: boolean;
  authorityAccepted: boolean;
  termsAccepted: boolean;
}): boolean {
  return (
    input.ownerAccepted &&
    input.platformAccepted &&
    input.taxAccepted &&
    input.authorityAccepted &&
    input.termsAccepted &&
    (!input.needsRegistryDeclaration || input.registryAccepted)
  );
}

export type WizardValidationSource = "step" | "review" | "publish";

export type ReviewCheckGroupId = "basics" | "presentation" | "publish";

export type ReviewCheckItem = {
  id: string;
  labelKey: string;
  step: number;
  status: "complete" | "warning" | "pending" | "optional";
  group: ReviewCheckGroupId;
  /** Supporting line under the title — Wizard.review.checklist.subtext key. */
  subtextKey?: string;
  subtextParams?: Record<string, string | number>;
  /** Optional items never block submit. */
  optional?: boolean;
  /** Short reason when warning — no PII. */
  detail?: string;
};

export const REVIEW_CHECK_GROUPS: {
  id: ReviewCheckGroupId;
  labelKey: string;
}[] = [
  { id: "basics", labelKey: "basics" },
  { id: "presentation", labelKey: "presentation" },
  { id: "publish", labelKey: "publish" },
];

/** Parse int without treating 0 as missing. Empty → null. */
export function parseOptionalInt(raw: unknown): number | null {
  if (raw == null) return null;
  if (typeof raw === "number") {
    return Number.isFinite(raw) ? Math.trunc(raw) : null;
  }
  const s = String(raw).trim();
  if (s === "") return null;
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : null;
}

export function parseOptionalFloat(raw: unknown): number | null {
  if (raw == null) return null;
  if (typeof raw === "number") {
    return Number.isFinite(raw) ? raw : null;
  }
  const s = String(raw).trim();
  if (s === "") return null;
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

/** True when a numeric field is present (0 allowed). */
export function isPresentNumber(value: number | null | undefined): boolean {
  return value !== null && value !== undefined && Number.isFinite(value);
}

export function isNonEmptyString(value: unknown): boolean {
  return typeof value === "string" && value.trim() !== "";
}

export function logWizardValidation(entry: {
  stepId: string | number;
  field: string;
  rawValue: unknown;
  normalizedValue: unknown;
  isValid: boolean;
  source: WizardValidationSource;
}): void {
  if (process.env.NODE_ENV === "production") return;
  // Dev-only — never log PII (no street/phone/email/name contents).
  const safeRaw =
    typeof entry.rawValue === "string"
      ? { type: "string", length: entry.rawValue.trim().length }
      : entry.rawValue;
  console.log("[MIDORA_WIZARD_VALIDATION]", {
    stepId: entry.stepId,
    field: entry.field,
    rawValue: safeRaw,
    normalizedValue: entry.normalizedValue,
    isValid: entry.isValid,
    source: entry.source,
  });
}

export type CapacityNormalized = {
  maxGuests: number | null;
  sqm: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  floor: number | null;
};

export function normalizeCapacityFields(input: {
  maxGuests?: unknown;
  sqm?: unknown;
  bedrooms?: unknown;
  bathrooms?: unknown;
  floor?: unknown;
}): CapacityNormalized {
  return {
    maxGuests: parseOptionalInt(input.maxGuests),
    sqm: parseOptionalInt(input.sqm),
    bedrooms: parseOptionalInt(input.bedrooms),
    bathrooms: parseOptionalInt(input.bathrooms),
    floor: parseOptionalInt(input.floor),
  };
}

export function capacityValidationError(
  cap: CapacityNormalized,
  source: WizardValidationSource = "step"
): string | null {
  const guestsOk = isPresentNumber(cap.maxGuests) && (cap.maxGuests as number) >= 1;
  logWizardValidation({
    stepId: 4,
    field: "max_guests",
    rawValue: cap.maxGuests,
    normalizedValue: cap.maxGuests,
    isValid: guestsOk,
    source,
  });
  if (!guestsOk) {
    return "maxGuestsMin";
  }

  const sqmOk = isPresentNumber(cap.sqm) && (cap.sqm as number) > 0;
  logWizardValidation({
    stepId: 4,
    field: "sqm",
    rawValue: cap.sqm,
    normalizedValue: cap.sqm,
    isValid: sqmOk,
    source,
  });
  if (!sqmOk) {
    return "sqmInvalid";
  }

  const bedsOk = isPresentNumber(cap.bedrooms) && (cap.bedrooms as number) >= 0;
  logWizardValidation({
    stepId: 4,
    field: "bedrooms",
    rawValue: cap.bedrooms,
    normalizedValue: cap.bedrooms,
    isValid: bedsOk,
    source,
  });
  if (!bedsOk) {
    return "bedroomsInvalid";
  }

  const bathsOk = isPresentNumber(cap.bathrooms) && (cap.bathrooms as number) >= 0;
  logWizardValidation({
    stepId: 4,
    field: "bathrooms",
    rawValue: cap.bathrooms,
    normalizedValue: cap.bathrooms,
    isValid: bathsOk,
    source,
  });
  if (!bathsOk) {
    return "bathroomsRequired";
  }

  const floorOk = isPresentNumber(cap.floor) && (cap.floor as number) >= 0;
  logWizardValidation({
    stepId: 4,
    field: "floor",
    rawValue: cap.floor,
    normalizedValue: cap.floor,
    isValid: floorOk,
    source,
  });
  if (!floorOk) {
    return "floorRequired";
  }

  return null;
}

export function isCapacityComplete(fields: PortalListingFields): boolean {
  return (
    capacityValidationError(
      normalizeCapacityFields({
        maxGuests: fields.max_guests,
        sqm: fields.sqm,
        bedrooms: fields.bedrooms,
        bathrooms: fields.bathrooms,
        floor: fields.floor,
      }),
      "review"
    ) === null
  );
}

export function locationBasicsOk(fields: PortalListingFields): boolean {
  return isNonEmptyString(fields.city) && isNonEmptyString(fields.area);
}

export function addressFieldsOk(fields: PortalListingFields): boolean {
  return (
    isNonEmptyString(fields.address_street) &&
    isNonEmptyString(fields.address_number)
  );
}

export function exactPinOk(fields: PortalListingFields): boolean {
  return isPresentNumber(fields.latitude) && isPresentNumber(fields.longitude);
}

export function validateLocationStepInput(input: {
  city: string;
  area: string;
  addressStreet: string;
  addressNumber: string;
  addressPostalCode: string;
  latitude: number | null;
  longitude: number | null;
  forSubmission: boolean;
  source?: WizardValidationSource;
}): string | null {
  const source = input.source ?? "step";
  if (!input.city.trim()) {
    logWizardValidation({
      stepId: 3,
      field: "city",
      rawValue: { length: 0 },
      normalizedValue: null,
      isValid: false,
      source,
    });
    return "cityRequired";
  }
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
    const pinOk =
      isPresentNumber(input.latitude) && isPresentNumber(input.longitude);
    logWizardValidation({
      stepId: 3,
      field: "lat_lng",
      rawValue: {
        hasLat: input.latitude != null,
        hasLng: input.longitude != null,
      },
      normalizedValue: pinOk,
      isValid: pinOk,
      source,
    });
    if (!pinOk) {
      return "mapPinRequired";
    }
  }
  return null;
}

export type ReviewChecklistContext = {
  fields: PortalListingFields;
  savedPhotoCount: number;
  /** When false, photos row shows pending — never false-missing during hydrate. */
  photosHydrated?: boolean;
  /** Count of saved trust / external links (optional checklist). */
  trustLinksCount?: number;
  needsAma: boolean;
  ownerDeclarationAccepted: boolean;
  registryDeclarationAccepted: boolean;
  platformDeclarationAccepted: boolean;
  taxDeclarationAccepted: boolean;
  authorityDeclarationAccepted: boolean;
  termsPrivacyAccepted: boolean;
  listingPhoneReady: boolean;
};

export function buildReviewChecklist(
  ctx: ReviewChecklistContext
): ReviewCheckItem[] {
  const { fields, savedPhotoCount, needsAma, listingPhoneReady } = ctx;

  const propertyTypeOk = isNonEmptyString(fields.property_type);
  const titleDescOk =
    isListingTitleLongEnough(fields.title) &&
    !listingDescriptionValidationError(fields.description, { forSubmission: true });
  const capacityOk = isCapacityComplete(fields);
  const locationOk = locationBasicsOk(fields);
  const addressOk = addressFieldsOk(fields);
  const pinOk = exactPinOk(fields);

  const shortTermPricingOk =
    !fields.supports_short_term ||
    (isPresentNumber(fields.price_per_night) &&
      (fields.price_per_night as number) > 0 &&
      isPresentNumber(fields.max_guests) &&
      (fields.max_guests as number) > 0 &&
      isNonEmptyString(fields.min_stay_label));

  const monthlyPricingOk =
    !fields.supports_monthly ||
    (isPresentNumber(fields.price_monthly) &&
      (fields.price_monthly as number) > 0 &&
      isPresentNumber(fields.max_guests) &&
      (fields.max_guests as number) > 0);

  const pricingOk = shortTermPricingOk && monthlyPricingOk;
  const photosHydrated = ctx.photosHydrated !== false;
  const photosOk = savedPhotoCount >= MIN_LISTING_PHOTOS_FOR_REVIEW;
  const availabilityOk = isNonEmptyString(fields.availability_status);

  const registryOk =
    !needsAma ||
    (isNonEmptyString(fields.ama_number) &&
      fields.legal_registry_type !== "none" &&
      isValidRegistryNumber(fields.legal_registry_type, fields.ama_number ?? ""));

  const contactOk =
    isNonEmptyString(fields.contact_name) &&
    (isNonEmptyString(fields.contact_phone) || isNonEmptyString(fields.contact_email)) &&
    (!isNonEmptyString(fields.contact_phone) ||
      hasCallablePhone(fields.contact_phone ?? "")) &&
    listingPhoneReady;

  const declarationsOk = areWizardDeclarationsComplete({
    needsRegistryDeclaration: needsAma,
    ownerAccepted: ctx.ownerDeclarationAccepted,
    registryAccepted: ctx.registryDeclarationAccepted,
    platformAccepted: ctx.platformDeclarationAccepted,
    taxAccepted: ctx.taxDeclarationAccepted,
    authorityAccepted: ctx.authorityDeclarationAccepted,
    termsAccepted: ctx.termsPrivacyAccepted,
  });

  const trustCount = ctx.trustLinksCount ?? 0;
  const trustOk = trustCount > 0;

  const items: ReviewCheckItem[] = [
    {
      id: "property_type",
      labelKey: "propertyType",
      step: 2,
      group: "basics",
      status: propertyTypeOk ? "complete" : "warning",
      detail: propertyTypeOk ? undefined : "missing_property_type",
    },
    {
      id: "location",
      labelKey: "location",
      step: 3,
      group: "basics",
      status: locationOk ? "complete" : "warning",
      detail: locationOk ? undefined : "missing_city_area",
    },
    {
      id: "address",
      labelKey: "address",
      step: 3,
      group: "basics",
      status: addressOk ? "complete" : "warning",
      detail: addressOk ? undefined : "missing_street_number",
    },
    {
      id: "exact_pin",
      labelKey: "exactPin",
      step: 3,
      group: "basics",
      status: pinOk ? "complete" : "warning",
      detail: pinOk ? undefined : "missing_lat_lng",
    },
    {
      id: "capacity",
      labelKey: "capacity",
      step: 4,
      group: "basics",
      status: capacityOk ? "complete" : "warning",
      detail: capacityOk ? undefined : "incomplete_capacity",
    },
    {
      id: "title_description",
      labelKey: "titleDescription",
      step: 5,
      group: "presentation",
      status: titleDescOk ? "complete" : "warning",
    },
    {
      id: "photos",
      labelKey: photosHydrated ? "photos" : "photosChecking",
      step: 8,
      group: "presentation",
      status: !photosHydrated ? "pending" : photosOk ? "complete" : "warning",
      subtextKey: !photosHydrated
        ? undefined
        : photosOk
          ? "photosAdded"
          : "photosNeedMore",
      subtextParams: !photosHydrated
        ? undefined
        : photosOk
          ? { count: MIN_LISTING_PHOTOS_FOR_REVIEW }
          : { count: MIN_LISTING_PHOTOS_FOR_REVIEW },
    },
    {
      id: "pricing",
      labelKey: "pricing",
      step: 7,
      group: "presentation",
      status: pricingOk ? "complete" : "warning",
    },
    {
      id: "availability",
      labelKey: "availability",
      step: 7,
      group: "presentation",
      status: availabilityOk ? "complete" : "warning",
    },
    {
      id: "registry",
      labelKey: "registry",
      step: 7,
      group: "publish",
      status: registryOk ? "complete" : "warning",
      subtextKey: fields.supports_short_term
        ? "registryShortTerm"
        : "registryNotRequired",
    },
    {
      id: "contact",
      labelKey: "contact",
      step: 9,
      group: "publish",
      status: contactOk ? "complete" : "warning",
    },
    {
      id: "declarations",
      labelKey: "declarations",
      step: 10,
      group: "publish",
      status: declarationsOk ? "complete" : "warning",
    },
    {
      id: "trust_links",
      labelKey: "trustLinks",
      step: 11,
      group: "publish",
      optional: true,
      status: trustOk ? "complete" : "optional",
      subtextKey: trustOk ? "trustAdded" : "trustOptional",
    },
  ];

  return items;
}

export function isReviewChecklistReady(ctx: ReviewChecklistContext): boolean {
  return buildReviewChecklist(ctx)
    .filter((item) => !item.optional)
    .every((item) => item.status === "complete");
}

export function countRequiredReviewWarnings(ctx: ReviewChecklistContext): number {
  return buildReviewChecklist(ctx).filter(
    (item) => !item.optional && (item.status === "warning" || item.status === "pending")
  ).length;
}

/** Validate a live wizard step number (1–12 catalog). */
export function validateActiveWizardStep(options: {
  step: number;
  forSubmission: boolean;
  fields: PortalListingFields;
  /** Raw UI strings for steps that are not yet fully in portal fields. */
  rentalTypeChoice: string | null;
  propertyType: string;
  city: string;
  area: string;
  addressStreet: string;
  addressNumber: string;
  addressPostalCode: string;
  latitude: number | null;
  longitude: number | null;
  maxGuests: string;
  sqm: string;
  bedrooms: string;
  bathrooms: string;
  floor: string;
  title: string;
  description: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  allDeclarationsChecked: boolean;
  savedPhotoCount: number;
  amenitiesStep: number;
  trustLinksStep: number;
  pricingStep: number;
  photosStep: number;
  contactStep: number;
  declarationsStep: number;
  reviewStep: number;
  validatePricingFields: (
    fields: PortalListingFields,
    forSubmission: boolean
  ) => string | null;
  source?: WizardValidationSource;
}): string | null {
  const source = options.source ?? (options.forSubmission ? "publish" : "step");
  const s = options.step;

  if (s === 1) {
    if (!options.rentalTypeChoice) {
      return "selectRentalType";
    }
    return null;
  }
  if (s === 2) {
    if (!options.propertyType) return "selectPropertyType";
    return null;
  }
  if (s === 3) {
    return validateLocationStepInput({
      city: options.city,
      area: options.area,
      addressStreet: options.addressStreet,
      addressNumber: options.addressNumber,
      addressPostalCode: options.addressPostalCode,
      latitude: options.latitude,
      longitude: options.longitude,
      forSubmission: options.forSubmission,
      source,
    });
  }
  if (s === 4) {
    return capacityValidationError(
      normalizeCapacityFields({
        maxGuests: options.maxGuests,
        sqm: options.sqm,
        bedrooms: options.bedrooms,
        bathrooms: options.bathrooms,
        floor: options.floor,
      }),
      source
    );
  }
  if (s === 5) {
    const titleError = listingTitleValidationError(options.title);
    if (titleError) return titleError;
    return listingDescriptionValidationError(options.description, {
      forSubmission: options.forSubmission,
    });
  }
  if (s === options.amenitiesStep || s === options.trustLinksStep) {
    return null;
  }
  if (s === options.pricingStep) {
    return options.validatePricingFields(options.fields, options.forSubmission);
  }
  if (s === options.photosStep) {
    return options.forSubmission
      ? photoCountSubmitError(options.savedPhotoCount)
      : photoCountStepError(options.savedPhotoCount);
  }
  if (s === options.contactStep) {
    if (!options.contactName.trim()) return "contactNameRequired";
    if (!options.contactPhone.trim() && !options.contactEmail.trim()) {
      return "contactPhoneOrEmail";
    }
    if (options.contactPhone.trim() && !hasCallablePhone(options.contactPhone)) {
      return "contactPhoneInvalid";
    }
    return null;
  }
  if (s === options.declarationsStep) {
    if (!options.allDeclarationsChecked) {
      return "declarationsRequired";
    }
    return null;
  }
  if (s === options.reviewStep && options.forSubmission) {
    const needsAma = needsAmaForFields(options.fields);
    if (
      !isReviewChecklistReady({
        fields: options.fields,
        savedPhotoCount: options.savedPhotoCount,
        needsAma,
        ownerDeclarationAccepted: options.fields.owner_responsibility_accepted === true,
        registryDeclarationAccepted: options.fields.ama_declaration_accepted === true,
        platformDeclarationAccepted: options.fields.platform_role_accepted === true,
        taxDeclarationAccepted: options.fields.tax_obligation_accepted === true,
        authorityDeclarationAccepted:
          options.fields.authority_disclosure_accepted === true,
        termsPrivacyAccepted: options.fields.terms_privacy_accepted === true,
        listingPhoneReady: true,
      })
    ) {
      return "reviewIncomplete";
    }
  }
  return null;
}
