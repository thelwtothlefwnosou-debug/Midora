/**

 * Create-listing wizard step config (Phase A architecture).

 * Not yet wired into NewListingWizard — see docs/CREATE_LISTING_WIZARD_ARCHITECTURE.md.

 *

 * Midora = listings + inquiry (no bookings/checkout). Do not copy Airbnb brand/copy.

 *

 * Labels resolve via `useTranslations("Wizard.catalog")` — keys in messages/en.json + el.json.

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

  | "trust_links"

  | "review";



/** Wizard.catalog.steps key (camelCase). */

export type WizardStepLabelKey =

  | "welcome"

  | "rentalMode"

  | "propertyType"

  | "location"

  | "mapPin"

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

  | "trustLinks"

  | "review";



/** Wizard.catalog.phases key for label + hint. */

export type WizardPhaseCatalogKey = "about" | "standOut" | "finish";



export type WizardStepDef = {

  id: WizardStepId;

  phase: WizardPhaseId;

  /** Wizard.catalog.steps message key. */

  labelKey: WizardStepLabelKey;

  /** Maps to existing completeness / portal field groups. */

  fieldGroups: string[];

  /** Required before advancing (soft for drafts). */

  requiredForContinue: boolean;

  /** Required before submit for review. */

  requiredForSubmit: boolean;

};



export type WizardPhaseDef = {

  id: WizardPhaseId;

  /** Wizard.catalog.phases message key. */

  catalogKey: WizardPhaseCatalogKey;

  stepIds: WizardStepId[];

};



/** Three host-facing phases; ~16 guided steps. */

export const WIZARD_PHASES: WizardPhaseDef[] = [

  {

    id: "about",

    catalogKey: "about",

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

    catalogKey: "standOut",

    stepIds: ["amenities", "photos", "title", "description"],

  },

  {

    id: "finish",

    catalogKey: "finish",

    stepIds: [

      "pricing",

      "availability",

      "registry",

      "contact",

      "declarations",

      "trust_links",

      "review",

    ],

  },

];



export const WIZARD_STEPS: WizardStepDef[] = [

  {

    id: "welcome",

    phase: "about",

    labelKey: "welcome",

    fieldGroups: [],

    requiredForContinue: false,

    requiredForSubmit: false,

  },

  {

    id: "rental_mode",

    phase: "about",

    labelKey: "rentalMode",

    fieldGroups: ["rental_type", "supports_short_term", "supports_monthly"],

    requiredForContinue: true,

    requiredForSubmit: true,

  },

  {

    id: "property_type",

    phase: "about",

    labelKey: "propertyType",

    fieldGroups: ["property_type"],

    requiredForContinue: true,

    requiredForSubmit: true,

  },

  {

    id: "location",

    phase: "about",

    labelKey: "location",

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

    labelKey: "mapPin",

    fieldGroups: ["latitude", "longitude", "location_confirmed_by_owner"],

    requiredForContinue: false,

    requiredForSubmit: true,

  },

  {

    id: "capacity",

    phase: "about",

    labelKey: "capacity",

    fieldGroups: ["bedrooms", "bathrooms", "max_guests", "sqm", "floor"],

    requiredForContinue: true,

    requiredForSubmit: true,

  },

  {

    id: "basics",

    phase: "about",

    labelKey: "basics",

    fieldGroups: ["furnished", "has_balcony", "has_elevator"],

    requiredForContinue: false,

    requiredForSubmit: false,

  },

  {

    id: "amenities",

    phase: "stand_out",

    labelKey: "amenities",

    fieldGroups: ["amenities"],

    requiredForContinue: false,

    requiredForSubmit: false,

  },

  {

    id: "photos",

    phase: "stand_out",

    labelKey: "photos",

    fieldGroups: ["listing_images"],

    requiredForContinue: false,

    requiredForSubmit: true,

  },

  {

    id: "title",

    phase: "stand_out",

    labelKey: "title",

    fieldGroups: ["title"],

    requiredForContinue: true,

    requiredForSubmit: true,

  },

  {

    id: "description",

    phase: "stand_out",

    labelKey: "description",

    fieldGroups: ["description"],

    requiredForContinue: false,

    requiredForSubmit: true,

  },

  {

    id: "pricing",

    phase: "finish",

    labelKey: "pricing",

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

    labelKey: "availability",

    fieldGroups: ["availability_status", "availability_note"],

    requiredForContinue: false,

    requiredForSubmit: true,

  },

  {

    id: "registry",

    phase: "finish",

    labelKey: "registry",

    fieldGroups: ["ama_number", "legal_registry_type", "accepts_under_60_days"],

    requiredForContinue: false,

    requiredForSubmit: false,

  },

  {

    id: "contact",

    phase: "finish",

    labelKey: "contact",

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

    labelKey: "declarations",

    fieldGroups: [

      "owner_responsibility_accepted",

      "platform_role_accepted",

      "tax_obligation_accepted",

      "authority_disclosure_accepted",

      "terms_privacy_accepted",

      "ama_declaration_accepted",

    ],

    requiredForContinue: true,

    requiredForSubmit: true,

  },

  {

    id: "trust_links",

    phase: "finish",

    labelKey: "trustLinks",

    fieldGroups: ["listing_external_links"],

    requiredForContinue: false,

    requiredForSubmit: false,

  },

  {

    id: "review",

    phase: "finish",

    labelKey: "review",

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


