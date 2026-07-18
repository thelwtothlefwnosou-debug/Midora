/**
 * Create-listing wizard step config (Phase A architecture).
 * Not yet wired into NewListingWizard — see docs/CREATE_LISTING_WIZARD_ARCHITECTURE.md.
 *
 * Midora = listings + inquiry (no bookings/checkout). Do not copy Airbnb brand/copy.
 */

export type WizardPhaseId = "about" | "stand_out" | "finish";

export type WizardStepId =
  | "welcome"
  | "rental_mode"
  | "property_type"
  | "location"
  | "map_pin"
  | "capacity"
  | "basics"
  | "amenities"
  | "photos"
  | "title"
  | "description"
  | "pricing"
  | "availability"
  | "registry"
  | "contact"
  | "declarations"
  | "review";

export type WizardStepDef = {
  id: WizardStepId;
  phase: WizardPhaseId;
  /** Greek UI label (Midora voice — not Airbnb copy). */
  label: string;
  /** Maps to existing completeness / portal field groups. */
  fieldGroups: string[];
  /** Required before advancing (soft for drafts). */
  requiredForContinue: boolean;
  /** Required before submit for review. */
  requiredForSubmit: boolean;
};

export type WizardPhaseDef = {
  id: WizardPhaseId;
  label: string;
  hint: string;
  stepIds: WizardStepId[];
};

/** Three host-facing phases; ~16 guided steps. */
export const WIZARD_PHASES: WizardPhaseDef[] = [
  {
    id: "about",
    label: "Το ακίνητό σου",
    hint: "Τύπος μίσθωσης, τοποθεσία και βασικά χαρακτηριστικά.",
    stepIds: [
      "welcome",
      "rental_mode",
      "property_type",
      "location",
      "map_pin",
      "capacity",
      "basics",
    ],
  },
  {
    id: "stand_out",
    label: "Να ξεχωρίζει",
    hint: "Φωτογραφίες, παροχές και κείμενο αγγελίας.",
    stepIds: ["amenities", "photos", "title", "description"],
  },
  {
    id: "finish",
    label: "Ολοκλήρωση",
    hint: "Τιμή, διαθεσιμότητα, επικοινωνία και υποβολή.",
    stepIds: [
      "pricing",
      "availability",
      "registry",
      "contact",
      "declarations",
      "review",
    ],
  },
];

export const WIZARD_STEPS: WizardStepDef[] = [
  {
    id: "welcome",
    phase: "about",
    label: "Έναρξη",
    fieldGroups: [],
    requiredForContinue: false,
    requiredForSubmit: false,
  },
  {
    id: "rental_mode",
    phase: "about",
    label: "Τύπος μίσθωσης",
    fieldGroups: ["rental_type", "supports_short_term", "supports_monthly"],
    requiredForContinue: true,
    requiredForSubmit: true,
  },
  {
    id: "property_type",
    phase: "about",
    label: "Τύπος ακινήτου",
    fieldGroups: ["property_type"],
    requiredForContinue: true,
    requiredForSubmit: true,
  },
  {
    id: "location",
    phase: "about",
    label: "Πόλη και διεύθυνση",
    fieldGroups: [
      "city",
      "area",
      "address_street",
      "address_number",
      "address_postal_code",
    ],
    requiredForContinue: true,
    requiredForSubmit: true,
  },
  {
    id: "map_pin",
    phase: "about",
    label: "Θέση στον χάρτη",
    fieldGroups: ["latitude", "longitude", "location_confirmed_by_owner"],
    requiredForContinue: false,
    requiredForSubmit: true,
  },
  {
    id: "capacity",
    phase: "about",
    label: "Χωρητικότητα",
    fieldGroups: ["bedrooms", "bathrooms", "max_guests", "sqm", "floor"],
    requiredForContinue: true,
    requiredForSubmit: true,
  },
  {
    id: "basics",
    phase: "about",
    label: "Βασικά στοιχεία",
    fieldGroups: ["furnished", "has_balcony", "has_elevator"],
    requiredForContinue: false,
    requiredForSubmit: false,
  },
  {
    id: "amenities",
    phase: "stand_out",
    label: "Παροχές",
    fieldGroups: ["amenities"],
    requiredForContinue: false,
    requiredForSubmit: false,
  },
  {
    id: "photos",
    phase: "stand_out",
    label: "Φωτογραφίες",
    fieldGroups: ["listing_images"],
    requiredForContinue: false,
    requiredForSubmit: true,
  },
  {
    id: "title",
    phase: "stand_out",
    label: "Τίτλος",
    fieldGroups: ["title"],
    requiredForContinue: true,
    requiredForSubmit: true,
  },
  {
    id: "description",
    phase: "stand_out",
    label: "Περιγραφή",
    fieldGroups: ["description"],
    requiredForContinue: false,
    requiredForSubmit: true,
  },
  {
    id: "pricing",
    phase: "finish",
    label: "Τιμή",
    fieldGroups: [
      "price_monthly",
      "price_per_night",
      "included_guests",
      "extra_guest_fee_per_night",
      "min_stay_label",
    ],
    requiredForContinue: true,
    requiredForSubmit: true,
  },
  {
    id: "availability",
    phase: "finish",
    label: "Διαθεσιμότητα",
    fieldGroups: ["availability_status", "availability_note"],
    requiredForContinue: false,
    requiredForSubmit: true,
  },
  {
    id: "registry",
    phase: "finish",
    label: "Αριθμός καταχώρισης",
    fieldGroups: ["ama_number", "legal_registry_type", "accepts_under_60_days"],
    requiredForContinue: false,
    requiredForSubmit: false,
  },
  {
    id: "contact",
    phase: "finish",
    label: "Επικοινωνία",
    fieldGroups: [
      "contact_name",
      "contact_phone",
      "contact_email",
      "preferred_contact",
    ],
    requiredForContinue: false,
    requiredForSubmit: true,
  },
  {
    id: "declarations",
    phase: "finish",
    label: "Δηλώσεις",
    fieldGroups: [
      "owner_responsibility_accepted",
      "platform_role_accepted",
      "terms_privacy_accepted",
      "ama_declaration_accepted",
    ],
    requiredForContinue: true,
    requiredForSubmit: true,
  },
  {
    id: "review",
    phase: "finish",
    label: "Έλεγχος πριν την υποβολή",
    fieldGroups: [],
    requiredForContinue: false,
    requiredForSubmit: true,
  },
];

/** Legacy 7-step wizard (current NewListingWizard) → target step ids. */
export const LEGACY_STEP_TO_TARGET: Record<number, WizardStepId[]> = {
  1: ["location", "map_pin", "capacity", "basics", "title", "description"],
  2: ["rental_mode"],
  3: ["pricing", "availability", "registry"],
  4: ["photos"],
  5: ["contact"],
  6: ["declarations"],
  7: ["review"],
};

export function wizardStepById(id: WizardStepId): WizardStepDef | undefined {
  return WIZARD_STEPS.find((s) => s.id === id);
}

export function wizardPhaseById(id: WizardPhaseId): WizardPhaseDef | undefined {
  return WIZARD_PHASES.find((p) => p.id === id);
}

export function wizardStepIndex(id: WizardStepId): number {
  return WIZARD_STEPS.findIndex((s) => s.id === id);
}
