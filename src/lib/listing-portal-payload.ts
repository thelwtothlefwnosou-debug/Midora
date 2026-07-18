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
  if (houseRules) {
    description = `${description}\n\nΚανόνες σπιτιού:\n${houseRules}`;
  }

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
    price_monthly,
    price_per_night,
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
    total_floors: parseInt((formData.get("total_floors") as string) || "", 10) || null,
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
    max_guests: maxGuestsRaw ? parseInt(maxGuestsRaw, 10) : null,
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
    return "Επίλεξε τύπο μίσθωσης (βραχυχρόνια ή μηνιαία).";
  }

  if (fields.supports_short_term && fields.supports_monthly) {
    return "Η αγγελία μπορεί να είναι είτε βραχυχρόνια είτε μηνιαία, όχι και τα δύο.";
  }

  if (fields.supports_short_term) {
    if (!fields.price_per_night || fields.price_per_night <= 0) {
      return "Συμπλήρωσε τη βασική τιμή ανά βράδυ.";
    }
    if (!fields.included_guests || fields.included_guests <= 0) {
      return "Συμπλήρωσε πόσα άτομα περιλαμβάνει η τιμή.";
    }
    if (fields.extra_guest_fee_per_night == null || fields.extra_guest_fee_per_night < 0) {
      return "Συμπλήρωσε τη χρέωση ανά επιπλέον άτομο / βράδυ.";
    }
    if (!fields.max_guests || fields.max_guests <= 0) {
      return "Συμπλήρωσε τον μέγιστο αριθμό ατόμων.";
    }
    if (!fields.min_stay_label?.trim()) {
      return "Επίλεξε την ελάχιστη διαμονή σε νύχτες.";
    }
  }

  if (fields.supports_monthly) {
    if (!fields.price_monthly || fields.price_monthly <= 0) {
      return "Συμπλήρωσε τιμή ανά μήνα.";
    }
    if (!fields.max_guests || fields.max_guests <= 0) {
      return "Συμπλήρωσε τον μέγιστο αριθμό ατόμων.";
    }
    if (
      fields.minimum_stay_months != null &&
      fields.minimum_stay_months < MONTHLY_MIN_STAY_FLOOR
    ) {
      return "Η ελάχιστη διάρκεια για μηνιαία διαμονή είναι 2 μήνες.";
    }
  }

  const needsAma = needsAmaForFields(fields);
  if (needsAma) {
    if (!fields.ama_number) return "Συμπλήρωσε τον αριθμό καταχώρισης.";
    if (!fields.legal_registry_type || fields.legal_registry_type === "none") {
      return "Επίλεξε τύπο αριθμού καταχώρισης (ΑΜΑ, ΕΣΛ ή ΜΑΓ).";
    }
    if (
      options.forSubmission &&
      !isValidRegistryNumber(fields.legal_registry_type, fields.ama_number)
    ) {
      if (fields.legal_registry_type === "ama") {
        return "Ο ΑΜΑ πρέπει να είναι ακριβώς 11 ψηφία.";
      }
      return "Ο αριθμός καταχώρισης δεν έχει έγκυρη μορφή.";
    }
  }

  if (options.forSubmission) {
    if (!fields.contact_name) return "Συμπλήρωσε όνομα αγγελιοδότη.";
    if (!fields.contact_phone && !fields.contact_email) {
      return "Συμπλήρωσε τηλέφωνο ή email επικοινωνίας.";
    }
    if (fields.latitude == null || fields.longitude == null) {
      return "Ορίσε την ακριβή θέση του ακινήτου στον χάρτη για να συνεχίσεις.";
    }
    if (!fields.owner_responsibility_accepted || !fields.platform_role_accepted) {
      return "Επίλεξε όλες τις απαιτούμενες δηλώσεις για να συνεχίσεις.";
    }
    if (!fields.terms_privacy_accepted) {
      return "Επίλεξε όλες τις απαιτούμενες δηλώσεις για να συνεχίσεις.";
    }
    if (needsAma && !fields.ama_declaration_accepted) {
      return "Επίλεξε όλες τις απαιτούμενες δηλώσεις για να συνεχίσεις.";
    }
  }

  return null;
}

/**
 * DB requires listings.price_monthly > 0 (NOT NULL). Wizard steps 1–2 save drafts
 * before pricing is filled — use a placeholder on insert, and omit unset prices on
 * update so we don't wipe a previously saved price.
 */
export function withDraftSafePrices<T extends Record<string, unknown>>(
  row: T,
  mode: "insert" | "update"
): T {
  const next = { ...row };
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
    status: "pending" as const,
    approval_status: approvalStatus,
    property_verification_status: "pending" as const,
  };
}
