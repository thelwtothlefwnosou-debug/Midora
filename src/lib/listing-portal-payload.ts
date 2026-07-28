import type { LegalRegistryType } from "@/lib/types";
import {
  MONTHLY_MIN_STAY_FLOOR,
  parseMonthsFromLabel,
  parseNightsFromLabel,
} from "@/lib/listing-rental-modes";
import {
  buildPrivateAddress,
  isValidRegistryNumber,
  resolveWizardArea,
  resolveWizardCity,
} from "@/lib/listing-wizard-validation";
import { parseWizardResumeStep } from "@/lib/listing-wizard-resume";
import {
  validateMonthlyOccupancyPricing,
  type MonthlyPricingMode,
} from "@/lib/listing-monthly-price";
import { appendHouseRulesToDescription } from "@/lib/listing-description";

export type PortalListingFields = ReturnType<typeof parsePortalListingFields>;

export function parsePortalListingFields(formData: FormData) {
  const rawRentalType = (formData.get("rental_type") as string)?.trim();
  const supportsShortTermRaw = formData.get("supports_short_term") === "on";
  const supportsMonthlyRaw = formData.get("supports_monthly") === "on";

  const rentalType =
    rawRentalType === "short_term"
      ? "short_term"
      : rawRentalType === "monthly"
        ? "monthly"
        : supportsShortTermRaw && !supportsMonthlyRaw
          ? "short_term"
          : supportsMonthlyRaw && !supportsShortTermRaw
            ? "monthly"
            : "monthly";

  const supportsShortTerm = rentalType === "short_term";
  const supportsMonthly = rentalType === "monthly";

  const rawCity = (formData.get("city") as string)?.trim() ?? "";
  const rawArea = (formData.get("area") as string)?.trim() ?? "";
  const { city, needsReview: cityNeedsReview } = resolveWizardCity(rawCity);
  const { area } = resolveWizardArea(city || rawCity, rawArea);

  const addressStreet = (formData.get("address_street") as string)?.trim() ?? "";
  const addressNumber = (formData.get("address_number") as string)?.trim() ?? "";
  const addressPostalCode = (formData.get("address_postal_code") as string)?.trim() ?? "";
  const addressFloor = (formData.get("address_floor") as string)?.trim() ?? "";
  const addressUnit = (formData.get("address_unit") as string)?.trim() ?? "";
  const legacyAddress = (formData.get("address") as string)?.trim() ?? "";

  const privateAddress =
    addressStreet || addressNumber
      ? buildPrivateAddress({
          addressStreet,
          addressNumber,
          addressPostalCode,
          addressFloor,
          addressUnit,
          city: city || rawCity,
          area: area || rawArea,
        })
      : legacyAddress || null;

  const pricePerNightRaw = formData.get("price_per_night") as string;
  const priceMonthlyRaw = formData.get("price_monthly") as string;
  const price_per_night = pricePerNightRaw ? parseInt(pricePerNightRaw, 10) : null;
  const price_monthly = priceMonthlyRaw
    ? parseInt(priceMonthlyRaw, 10)
    : price_per_night ?? 0;

  const includedGuestsRaw = formData.get("included_guests") as string;
  const extraGuestFeeRaw = formData.get("extra_guest_fee_per_night") as string;
  const maxGuestsRaw = formData.get("max_guests") as string;

  const acceptsUnder60 =
    supportsShortTerm || formData.get("accepts_under_60_days") === "yes";

  let description = (formData.get("description") as string) ?? "";
  const houseRules = (formData.get("house_rules") as string)?.trim();
  description = appendHouseRulesToDescription(description, houseRules);

  const legalRegistryType = ((formData.get("legal_registry_type") as string) ||
    "none") as LegalRegistryType;

  const shortMinStayLabel = (formData.get("short_min_stay_label") as string)?.trim() || null;
  const monthlyMinStayLabel = (formData.get("monthly_min_stay_label") as string)?.trim() || null;
  const legacyMinStayLabel = (formData.get("min_stay_label") as string)?.trim() || null;

  const minimum_stay_nights = supportsShortTerm
    ? parseNightsFromLabel(shortMinStayLabel ?? legacyMinStayLabel) ?? null
    : null;

  const parsedMonthlyMonths = supportsMonthly
    ? parseMonthsFromLabel(monthlyMinStayLabel ?? legacyMinStayLabel)
    : null;
  const minimum_stay_months =
    supportsMonthly && parsedMonthlyMonths != null
      ? Math.max(MONTHLY_MIN_STAY_FLOOR, parsedMonthlyMonths)
      : supportsMonthly
        ? MONTHLY_MIN_STAY_FLOOR
        : null;

  const monthly_terms = (formData.get("monthly_terms") as string)?.trim() || null;

  const monthlyPricingModeRaw = (formData.get("monthly_pricing_mode") as string)?.trim();
  const monthly_pricing_mode: MonthlyPricingMode | null =
    monthlyPricingModeRaw === "fixed" ||
    monthlyPricingModeRaw === "extra_person" ||
    monthlyPricingModeRaw === "tiers"
      ? monthlyPricingModeRaw
      : supportsMonthly
        ? "extra_person"
        : null;

  const monthlyBaseRaw = (formData.get("monthly_base_price") as string)?.trim();
  const monthly_base_price = monthlyBaseRaw
    ? parseInt(monthlyBaseRaw, 10)
    : supportsMonthly
      ? price_monthly
      : null;

  const monthlyIncludedRaw = (formData.get("monthly_included_people") as string)?.trim();
  const monthly_included_people = monthlyIncludedRaw
    ? parseInt(monthlyIncludedRaw, 10)
    : null;

  const monthlyMaxPeopleRaw = (formData.get("monthly_max_people") as string)?.trim();
  const monthly_max_people = monthlyMaxPeopleRaw
    ? parseInt(monthlyMaxPeopleRaw, 10)
    : null;

  const monthlyExtraRaw = (formData.get("monthly_extra_person_price") as string)?.trim();
  const monthly_extra_person_price =
    monthlyExtraRaw !== "" && monthlyExtraRaw != null
      ? parseInt(monthlyExtraRaw, 10)
      : null;

  const monthlyMaxPriceRaw = (formData.get("monthly_max_price") as string)?.trim();
  const monthly_max_price = monthlyMaxPriceRaw ? parseInt(monthlyMaxPriceRaw, 10) : null;

  let monthly_price_tiers: {
    people_from: number;
    people_to: number;
    monthly_price: number;
  }[] = [];
  const tiersJson = (formData.get("monthly_price_tiers_json") as string)?.trim();
  if (tiersJson) {
    try {
      const parsed = JSON.parse(tiersJson) as unknown;
      if (Array.isArray(parsed)) {
        monthly_price_tiers = parsed
          .map((row) => ({
            people_from: Number((row as { people_from?: number }).people_from) || 0,
            people_to: Number((row as { people_to?: number }).people_to) || 0,
            monthly_price: Number((row as { monthly_price?: number }).monthly_price) || 0,
          }))
          .filter((t) => t.people_from >= 1 && t.people_to >= t.people_from && t.monthly_price > 0);
      }
    } catch {
      monthly_price_tiers = [];
    }
  }

  const resolvedMaxGuests = (() => {
    const fromForm = maxGuestsRaw ? parseInt(maxGuestsRaw, 10) : null;
    if (supportsMonthly && monthly_max_people && monthly_max_people > 0) {
      return monthly_max_people;
    }
    return fromForm;
  })();

  const resolvedPriceMonthly = (() => {
    if (supportsMonthly && monthly_pricing_mode === "tiers" && monthly_price_tiers.length > 0) {
      const minTier = Math.min(...monthly_price_tiers.map((t) => t.monthly_price));
      if (Number.isFinite(minTier) && minTier > 0) return minTier;
    }
    if (supportsMonthly && monthly_base_price && monthly_base_price > 0) {
      return monthly_base_price;
    }
    return price_monthly;
  })();

  const min_months = supportsMonthly
    ? (minimum_stay_months ?? MONTHLY_MIN_STAY_FLOOR)
    : supportsShortTerm
      ? (minimum_stay_nights ?? 1)
      : parseInt((formData.get("min_months") as string) || "1", 10) || 1;

  const min_stay_label = supportsShortTerm
    ? shortMinStayLabel ?? legacyMinStayLabel
    : monthlyMinStayLabel ?? legacyMinStayLabel;

  return {
    supports_short_term: supportsShortTerm,
    supports_monthly: supportsMonthly,
    rental_type: rentalType,
    price_type: rentalType === "short_term" ? ("per_night" as const) : ("per_month" as const),
    title: (formData.get("title") as string)?.trim() ?? "",
    city: city || rawCity,
    area: area || rawArea,
    location_needs_review: cityNeedsReview,
    address: privateAddress,
    address_street: addressStreet || null,
    address_number: addressNumber || null,
    address_postal_code: addressPostalCode || null,
    address_floor: addressFloor || null,
    address_unit: addressUnit || null,
    description,
    description_en: (formData.get("description_en") as string)?.trim() || null,
    price_monthly: resolvedPriceMonthly,
    price_per_night,
    monthly_pricing_mode,
    monthly_base_price,
    monthly_included_people,
    monthly_max_people,
    monthly_extra_person_price,
    monthly_max_price,
    monthly_price_tiers,
    included_guests: includedGuestsRaw ? parseInt(includedGuestsRaw, 10) : null,
    extra_guest_fee_per_night: extraGuestFeeRaw
      ? parseInt(extraGuestFeeRaw, 10)
      : null,
    bedrooms: parseInt((formData.get("bedrooms") as string) || "0", 10),
    bathrooms: (() => {
      const raw = (formData.get("bathrooms") as string)?.trim() ?? "";
      if (raw === "") return null;
      const n = parseInt(raw, 10);
      return Number.isFinite(n) ? n : null;
    })(),
    sqm: parseInt((formData.get("sqm") as string) || "0", 10) || null,
    floor: (() => {
      const raw = (formData.get("floor") as string)?.trim() ?? "";
      if (raw === "") return null;
      const n = parseInt(raw, 10);
      return Number.isFinite(n) ? n : null;
    })(),
    total_floors: (() => {
      const raw = (formData.get("total_floors") as string)?.trim() ?? "";
      if (raw === "") return null;
      const n = parseInt(raw, 10);
      return Number.isFinite(n) && n > 0 ? n : null;
    })(),
    year_built: parseInt((formData.get("year_built") as string) || "", 10) || null,
    year_renovated: parseInt((formData.get("year_renovated") as string) || "", 10) || null,
    furnished: formData.get("furnished") === "on",
    has_balcony: formData.get("has_balcony") === "on",
    has_elevator: formData.get("has_elevator") === "on",
    heating_type: (formData.get("heating_type") as string) || null,
    energy_class: (formData.get("energy_class") as string) || null,
    utilities_included: formData.get("utilities_included") === "on",
    has_parking: formData.get("has_parking") === "on",
    pets_allowed: formData.get("pets_allowed") === "on",
    max_guests:
      resolvedMaxGuests != null && Number.isFinite(resolvedMaxGuests)
        ? resolvedMaxGuests
        : null,
    cleaning_included: formData.get("cleaning_included") === "on",
    min_months,
    property_type: (formData.get("property_type") as string) || "apartment",
    ama_number: (formData.get("ama_number") as string)?.trim() || null,
    legal_registry_type: legalRegistryType,
    accepts_under_60_days: acceptsUnder60,
    min_stay_label,
    minimum_stay_nights,
    minimum_stay_months,
    monthly_includes_bills: supportsMonthly
      ? formData.get("utilities_included") === "on"
      : null,
    monthly_terms,
    availability_status: (formData.get("availability_status") as string) || "upon_request",
    availability_note: (formData.get("availability_note") as string)?.trim() || null,
    external_listing_url: (formData.get("external_listing_url") as string)?.trim() || null,
    property_verification_method:
      (formData.get("property_verification_method") as string) || null,
    midora_verification_code:
      (formData.get("midora_verification_code") as string)?.trim() || null,
    owner_responsibility_accepted:
      formData.get("owner_responsibility_accepted") === "on",
    platform_role_accepted: formData.get("platform_role_accepted") === "on",
    tax_obligation_accepted: formData.get("tax_obligation_accepted") === "on",
    authority_disclosure_accepted:
      formData.get("authority_disclosure_accepted") === "on",
    ama_declaration_accepted: formData.get("ama_declaration_accepted") === "on",
    terms_privacy_accepted: formData.get("terms_privacy_accepted") === "on",
    contact_name: (formData.get("contact_name") as string)?.trim() || null,
    contact_phone: (formData.get("contact_phone") as string)?.trim() || null,
    contact_email: (formData.get("contact_email") as string)?.trim() || null,
    preferred_contact: (formData.get("preferred_contact") as string) || null,
    city_display_name: (formData.get("city_display_name") as string)?.trim() || city || rawCity,
    area_display_name: (formData.get("area_display_name") as string)?.trim() || area || rawArea,
    formatted_address: (formData.get("formatted_address") as string)?.trim() || null,
    provider_place_id: (formData.get("provider_place_id") as string)?.trim() || null,
    latitude: parseFloat((formData.get("latitude") as string) || "") || null,
    longitude: parseFloat((formData.get("longitude") as string) || "") || null,
    location_confirmed_by_owner: formData.get("location_confirmed_by_owner") === "on",
    location_pin_moved_manually: formData.get("location_pin_moved_manually") === "on",
    location_confirmed_at: (formData.get("location_confirmed_at") as string)?.trim() || null,
    private_street: addressStreet || null,
    private_street_number: addressNumber || null,
    private_postal_code: addressPostalCode || null,
    use_profile_contact: formData.get("use_profile_contact") !== "off",
    allow_phone_contact: formData.get("allow_phone_contact") === "on",
    allow_whatsapp: formData.get("allow_whatsapp") === "on",
    allow_viber: formData.get("allow_viber") === "on",
    allow_message: formData.get("allow_message") !== "off",
    contact_whatsapp_phone: (formData.get("contact_whatsapp_phone") as string)?.trim() || null,
    contact_viber_phone: (formData.get("contact_viber_phone") as string)?.trim() || null,
    contact_whatsapp_use_primary: formData.get("contact_whatsapp_use_primary") !== "off",
    contact_viber_use_primary: formData.get("contact_viber_use_primary") !== "off",
    wizard_resume_step: parseWizardResumeStep(formData.get("wizard_resume_step")),
  };
}

export function needsAmaForFields(
  fields: Pick<
    PortalListingFields,
    "rental_type" | "accepts_under_60_days" | "supports_short_term"
  >
): boolean {
  return (
    fields.rental_type === "short_term" ||
    fields.supports_short_term ||
    (fields.rental_type === "monthly" && fields.accepts_under_60_days)
  );
}

export function validatePortalListingFields(
  fields: PortalListingFields,
  options: { forSubmission: boolean; forDraft?: boolean }
): string | null {
  if (options.forDraft) {
    return null;
  }

  if (!fields.supports_short_term && !fields.supports_monthly) {
    return "selectRentalType";
  }

  if (fields.supports_short_term && fields.supports_monthly) {
    return "rentalTypeExclusive";
  }

  if (fields.supports_short_term) {
    if (!fields.price_per_night || fields.price_per_night <= 0) {
      return "pricePerNightRequired";
    }
    if (!fields.included_guests || fields.included_guests <= 0) {
      return "includedGuestsRequired";
    }
    if (fields.extra_guest_fee_per_night == null || fields.extra_guest_fee_per_night < 0) {
      return "extraGuestFeeRequired";
    }
    if (!fields.max_guests || fields.max_guests <= 0) {
      return "maxGuestsMin";
    }
    if (!fields.min_stay_label?.trim()) {
      return "minStayNightsRequired";
    }
  }

  if (fields.supports_monthly) {
    if (!fields.price_monthly || fields.price_monthly <= 0) {
      return "priceMonthlyRequired";
    }
    if (!fields.max_guests || fields.max_guests <= 0) {
      return "maxGuestsMin";
    }
    if (
      fields.minimum_stay_months != null &&
      fields.minimum_stay_months < MONTHLY_MIN_STAY_FLOOR
    ) {
      return "monthlyMinStayFloor";
    }
    const occupancyError = validateMonthlyOccupancyPricing({
      pricingMode: fields.monthly_pricing_mode,
      monthlyBasePrice: fields.monthly_base_price ?? fields.price_monthly,
      priceMonthly: fields.price_monthly,
      includedPeople: fields.monthly_included_people,
      maxPeople: fields.monthly_max_people ?? fields.max_guests,
      maxGuests: fields.max_guests,
      extraPersonPrice: fields.monthly_extra_person_price,
      maxPrice: fields.monthly_max_price,
      tiers: fields.monthly_price_tiers,
    });
    if (occupancyError) return occupancyError;
  }

  const needsAma = needsAmaForFields(fields);
  if (needsAma) {
    if (!fields.ama_number) return "registryNumberRequired";
    if (!fields.legal_registry_type || fields.legal_registry_type === "none") {
      return "registryTypeRequired";
    }
    if (
      options.forSubmission &&
      !isValidRegistryNumber(fields.legal_registry_type, fields.ama_number)
    ) {
      if (fields.legal_registry_type === "ama") {
        return "amaInvalid";
      }
      return "registryInvalid";
    }
  }

  if (options.forSubmission) {
    if (!fields.contact_name) return "contactNameRequired";
    if (!fields.contact_phone && !fields.contact_email) {
      return "contactPhoneOrEmail";
    }
    if (fields.latitude == null || fields.longitude == null) {
      return "mapPinRequired";
    }
    if (!fields.owner_responsibility_accepted || !fields.platform_role_accepted) {
      return "declarationsRequired";
    }
    if (!fields.tax_obligation_accepted || !fields.authority_disclosure_accepted) {
      return "declarationsRequired";
    }
    if (!fields.terms_privacy_accepted) {
      return "declarationsRequired";
    }
    if (needsAma && !fields.ama_declaration_accepted) {
      return "declarationsRequired";
    }
  }

  return null;
}

/**
 * DB requires listings.price_monthly > 0 (NOT NULL). Wizard steps 1–2 save drafts
 * before pricing is filled — use a placeholder on insert, and omit unset prices on
 * update so we don't wipe a previously saved price.
 */
export function withDraftSafePrices(
  row: Record<string, unknown>,
  mode: "insert" | "update"
): Record<string, unknown> {
  const next: Record<string, unknown> = { ...row };
  const monthly = Number(next.price_monthly);
  const nightly = next.price_per_night == null ? null : Number(next.price_per_night);

  if (!Number.isFinite(monthly) || monthly <= 0) {
    if (mode === "insert") {
      next.price_monthly = 1;
    } else {
      delete next.price_monthly;
    }
  }

  if (nightly != null && (!Number.isFinite(nightly) || nightly <= 0)) {
    if (mode === "update") {
      delete next.price_per_night;
    } else {
      next.price_per_night = null;
    }
  }

  return next;
}

export function buildPortalListingRow(
  fields: PortalListingFields,
  userId: string,
  verificationCode: string,
  approvalStatus: "draft" | "pending_review"
) {
  return {
    user_id: userId,
    city: fields.city,
    area: fields.area,
    city_display_name: fields.city_display_name,
    area_display_name: fields.area_display_name,
    formatted_address: fields.formatted_address,
    provider_place_id: fields.provider_place_id,
    location_confirmed_at: fields.location_confirmed_at,
    location_confirmed_by_owner: fields.location_confirmed_by_owner ?? false,
    location_pin_moved_manually: fields.location_pin_moved_manually ?? false,
    private_street: fields.private_street,
    private_street_number: fields.private_street_number,
    private_postal_code: fields.private_postal_code,
    location_needs_review: fields.location_needs_review,
    address: fields.address,
    address_street: fields.address_street,
    address_number: fields.address_number,
    address_postal_code: fields.address_postal_code,
    address_floor: fields.address_floor,
    address_unit: fields.address_unit,
    title: fields.title,
    description: fields.description,
    description_en: fields.description_en,
    price_monthly: fields.price_monthly,
    price_per_night: fields.price_per_night,
    monthly_pricing_mode: fields.supports_monthly ? fields.monthly_pricing_mode : null,
    monthly_base_price: fields.supports_monthly
      ? (fields.monthly_base_price ?? fields.price_monthly)
      : null,
    monthly_included_people: fields.supports_monthly
      ? fields.monthly_included_people
      : null,
    monthly_max_people: fields.supports_monthly
      ? (fields.monthly_max_people ?? fields.max_guests)
      : null,
    monthly_extra_person_price: fields.supports_monthly
      ? fields.monthly_extra_person_price
      : null,
    monthly_max_price: fields.supports_monthly ? fields.monthly_max_price : null,
    included_guests: fields.included_guests,
    extra_guest_fee_per_night: fields.extra_guest_fee_per_night,
    rental_type: fields.rental_type,
    price_type: fields.price_type,
    ama_number: fields.ama_number,
    legal_registry_type: fields.legal_registry_type,
    accepts_under_60_days: fields.accepts_under_60_days,
    min_stay_label: fields.min_stay_label,
    supports_short_term: fields.supports_short_term,
    supports_monthly: fields.supports_monthly,
    minimum_stay_nights: fields.minimum_stay_nights,
    minimum_stay_months: fields.minimum_stay_months,
    monthly_includes_bills: fields.monthly_includes_bills,
    monthly_terms: fields.monthly_terms,
    availability_status: fields.availability_status,
    availability_note: fields.availability_note,
    external_listing_url: fields.external_listing_url,
    property_verification_method: fields.property_verification_method,
    midora_verification_code: verificationCode,
    owner_responsibility_accepted: fields.owner_responsibility_accepted,
    platform_role_accepted: fields.platform_role_accepted,
    tax_obligation_accepted: fields.tax_obligation_accepted,
    authority_disclosure_accepted: fields.authority_disclosure_accepted,
    ama_declaration_accepted: fields.ama_declaration_accepted,
    terms_privacy_accepted: fields.terms_privacy_accepted,
    contact_name: fields.contact_name,
    contact_phone: fields.contact_phone,
    contact_email: fields.contact_email,
    preferred_contact: fields.preferred_contact,
    use_profile_contact: fields.use_profile_contact,
    allow_phone_contact: fields.allow_phone_contact,
    allow_whatsapp: fields.allow_whatsapp,
    allow_viber: fields.allow_viber,
    allow_message: fields.allow_message,
    contact_whatsapp_phone: fields.contact_whatsapp_phone,
    contact_viber_phone: fields.contact_viber_phone,
    contact_whatsapp_use_primary: fields.contact_whatsapp_use_primary,
    contact_viber_use_primary: fields.contact_viber_use_primary,
    bedrooms: fields.bedrooms,
    bathrooms: fields.bathrooms,
    sqm: fields.sqm,
    floor: fields.floor,
    total_floors: fields.total_floors,
    year_built: fields.year_built,
    year_renovated: fields.year_renovated,
    furnished: fields.furnished,
    has_balcony: fields.has_balcony,
    has_elevator: fields.has_elevator,
    heating_type: fields.heating_type,
    energy_class: fields.energy_class,
    utilities_included: fields.utilities_included,
    has_parking: fields.has_parking,
    pets_allowed: fields.pets_allowed,
    max_guests: fields.max_guests,
    cleaning_included: fields.cleaning_included,
    min_months: fields.min_months,
    property_type: fields.property_type,
    latitude: fields.latitude,
    longitude: fields.longitude,
    wizard_resume_step: fields.wizard_resume_step,
    status: "pending" as const,
    approval_status: approvalStatus,
    property_verification_status: "pending" as const,
  };
}
