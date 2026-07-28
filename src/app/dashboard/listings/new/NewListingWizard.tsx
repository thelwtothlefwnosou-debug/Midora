"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { useTranslations } from "next-intl";
import {
  CreateListingWizardShell,
  WizardChoiceCard,
  WizardCounter,
} from "@/components/listings/wizard/CreateListingWizardShell";
import { ListingCityField } from "@/components/listings/wizard/ListingCityField";
import { ListingAreaField } from "@/components/listings/wizard/ListingAreaField";
import { cityHasSubAreas, getCityAreaExamples } from "@/lib/data/greek-areas";
import { ListingWizardContactStep } from "@/components/listings/wizard/ListingWizardContactStep";
import {
  PropertyAddressLocationSection,
  type PropertyLocationState,
} from "@/components/listings/wizard/PropertyAddressLocationSection";
import { ListingWizardPhotosStep } from "@/components/listings/wizard/ListingWizardPhotosStep";
import {
  phaseIdForWizardStep,
  WizardPhaseIntro,
  WIZARD_PHASE_INTROS,
} from "@/components/listings/wizard/WizardPhaseIntro";
import { ShortTermRegistryComplianceCard } from "@/components/listings/wizard/ShortTermRegistryComplianceCard";
import { AadeGuideHelperCard } from "@/components/aade/AadeGuideHelperCard";
import {
  areWizardDeclarationsComplete,
  ListingWizardDeclarationsStep,
} from "@/components/listings/wizard/ListingWizardDeclarationsStep";
import { ListingWizardTrustLinksStep } from "@/components/listings/wizard/ListingWizardTrustLinksStep";
import {
  isReviewReady,
  ListingWizardReviewStep,
} from "@/components/listings/wizard/ListingWizardReviewStep";
import {
  EMPTY_MONTHLY_OCCUPANCY_PRICING,
  MonthlyOccupancyPricingFields,
  type MonthlyOccupancyPricingValue,
} from "@/components/listings/wizard/MonthlyOccupancyPricingFields";
import type { WizardPhaseId } from "@/lib/listing-wizard-steps";
import {
  ACTIVE_WIZARD_STEP_IDS,
  activeWizardStepIdFromNumber,
  activeWizardStepNumber,
  decideWizardStepChange,
  parseWizardResumeStep,
  preferHigherResumeStep,
  preferSessionWizardStep,
  resolveInitialWizardStep,
  resumeStepForAutosave,
  type ActiveWizardStepId,
  type WizardResumeListingSnapshot,
  type WizardStepChangeReason,
} from "@/lib/listing-wizard-resume";
import type { ListingExternalLink } from "@/lib/listing-external-links";
import {
  getMyListingExternalLinks,
} from "@/lib/listing-external-links-db";
import { getSuggestPhotoRooms } from "@/lib/photo-rooms-catalog";
import {
  getOwnerListingImages,
  getSavedListingImageCount,
  getWizardListingDraft,
  savePortalListingDraft,
  submitPortalListingForReview,
} from "@/lib/actions";
import {
  logListingImageValidationDebug,
  photoCountStepError,
  photoCountSubmitError,
} from "@/lib/listing-photo-validation";
import { MIN_LISTING_PHOTOS_FOR_REVIEW } from "@/lib/constants";
import {
  LISTING_DESCRIPTION_MAX_ERROR,
  LISTING_TITLE_MIN_ERROR,
  MAX_LISTING_DESCRIPTION_LENGTH,
  MIN_LISTING_DESCRIPTION_LENGTH,
  MIN_LISTING_TITLE_LENGTH,
  listingDescriptionGraphemeLength,
  listingDescriptionValidationError,
  listingTitleValidationError,
  isValidRegistryNumber,
} from "@/lib/listing-wizard-validation";
import {
  capacityValidationError,
  isReviewChecklistReady,
  normalizeCapacityFields,
  validateLocationStepInput,
} from "@/lib/listing-wizard-step-validation";
import {
  parsePortalListingFields,
  validatePortalListingFields,
  needsAmaForFields,
} from "@/lib/listing-portal-payload";
import { PROPERTY_TYPES, type ListingImage, type Profile } from "@/lib/types";
import {
  generateMidoraVerificationCode,
  MONTHLY_MIN_STAY_OPTIONS,
  MVP_LISTING_TYPE_OPTIONS,
  SHORT_TERM_MIN_STAY_OPTIONS,
} from "@/lib/rental-types";
import { LISTING_AVAILABILITY_STATUS_OPTIONS as AVAIL_OPTS } from "@/lib/listing-availability-status";
import { hasCallablePhone, listingPhoneReadyForCalls } from "@/lib/listing-contact";
import { normalizeAmenityKey } from "@/lib/amenities-catalog";
import {
  getOwnerListingAmenities,
  saveOwnerListingAmenities,
} from "@/lib/listing-amenities";
import { ListingWizardAmenitiesStep } from "@/components/listings/wizard/ListingWizardAmenitiesStep";
import { WizardLeaveConfirmModal } from "@/components/listings/wizard/WizardLeaveConfirmModal";

const STEP_KEYS = [
  "rentalType",
  "propertyType",
  "location",
  "capacity",
  "titleDesc",
  "amenities",
  "pricing",
  "photos",
  "contact",
  "declarations",
  "trustLinks",
  "review",
] as const;

const STEP_PHASE_KEYS = [
  "about",
  "about",
  "about",
  "about",
  "standOut",
  "standOut",
  "finish",
  "standOut",
  "finish",
  "finish",
  "finish",
  "finish",
] as const;

const STEP_HINT_KEYS = [
  "stepHintRentalType",
  "stepHintPropertyType",
  "stepHintLocation",
  "stepHintCapacity",
  "stepHintTitleDesc",
  "stepHintAmenities",
  "stepHintPricing",
  "stepHintPhotos",
  "stepHintContact",
  "stepHintDeclarations",
  "stepHintTrustLinks",
  "stepHintReview",
] as const;

const TOTAL_STEPS = STEP_KEYS.length;
const WIZARD_SCROLL_OFFSET = 112;
const WIZARD_DRAFT_STORAGE_KEY = "midora_new_listing_draft_id";
const WIZARD_STEP_STORAGE_PREFIX = "midora_new_listing_wizard_step:";
const AUTOSAVE_DEBOUNCE_MS = 800;
/** Soft unlock if an explicit nav save never clears navBusy. */
const NAV_BUSY_UNLOCK_MS = 12_000;
const TITLE_STEP = 5;
const AMENITIES_STEP = 6;
const PRICING_STEP = 7;
const PHOTOS_STEP = 8;
const CONTACT_STEP = 9;
const DECLARATIONS_STEP = 10;
const TRUST_LINKS_STEP = 11;
const REVIEW_STEP = 12;

function clearWizardDraftSession(
  setListingId: (id: string | null) => void,
  listingIdRef?: { current: string | null }
) {
  if (listingIdRef) listingIdRef.current = null;
  setListingId(null);
  try {
    sessionStorage.removeItem(WIZARD_DRAFT_STORAGE_KEY);
  } catch {
    // ignore storage errors
  }
}

function wizardStepSessionKey(draftId: string) {
  return `${WIZARD_STEP_STORAGE_PREFIX}${draftId}`;
}

function readSessionWizardStepId(draftId: string): ActiveWizardStepId | null {
  try {
    const raw = sessionStorage.getItem(wizardStepSessionKey(draftId));
    if (!raw) return null;
    const asId = parseWizardResumeStep(raw.trim());
    if (asId) return asId;
    return null;
  } catch {
    return null;
  }
}

function readSessionWizardStep(draftId: string): number | null {
  const id = readSessionWizardStepId(draftId);
  return id ? activeWizardStepNumber(id) : null;
}

function writeSessionWizardStep(draftId: string, stepNumber: number) {
  try {
    const id = activeWizardStepIdFromNumber(stepNumber);
    if (!id) return;
    sessionStorage.setItem(wizardStepSessionKey(draftId), id);
  } catch {
    // ignore storage errors
  }
}

function clearSessionWizardStep(draftId: string) {
  try {
    sessionStorage.removeItem(wizardStepSessionKey(draftId));
  } catch {
    // ignore storage errors
  }
}

function logWizardStepChange(
  payload: Record<string, unknown>,
  level: "log" | "warn" = "log"
) {
  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console -- intentional wizard step debug
    console[level]("[MIDORA_WIZARD_STEP_CHANGE]", payload);
  }
}

const inputClass =
  "mt-1 w-full rounded-xl border border-border bg-sand/40 px-4 py-3 text-sm text-charcoal outline-none focus:border-gold/50";

/** Max auto-grow height for description textarea (then internal scroll). */
const DESCRIPTION_TEXTAREA_MAX_HEIGHT_PX = 320;

type Props = {
  profile: Profile;
  email: string;
  initialListingId?: string | null;
  /** 1-based wizard step resolved server-side — avoids step-1 flash on resume. */
  initialResumeStep?: number | null;
  initialResumeMessage?: string | null;
  initialDraftListing?: Record<string, unknown> | null;
  initialPhotoCount?: number;
  /** Preloaded listing photos for resume — avoids empty flash on Φωτογραφίες. */
  initialImages?: ListingImage[];
};

type SaveStatus = "idle" | "saving" | "saved" | "error";

export function NewListingWizard({
  profile,
  email,
  initialListingId = null,
  initialResumeStep = null,
  initialResumeMessage = null,
  initialDraftListing = null,
  initialPhotoCount = 0,
  initialImages = [],
}: Props) {
  const t = useTranslations("Wizard");
  const tFields = useTranslations("Wizard.fields");
  const tPricing = useTranslations("Wizard.pricing");
  const tErrors = useTranslations("Wizard.errors");
  const tPropertyTypes = useTranslations("PropertyTypes");
  const tPhotoRooms = useTranslations("Listing.photoRooms");

  const WIZARD_ERROR_KEYS = new Set([
    "selectRentalType",
    "selectPropertyType",
    "registryInvalid",
    "contactNameRequired",
    "contactPhoneOrEmail",
    "contactPhoneInvalid",
    "declarationsRequired",
    "reviewIncomplete",
    "saveFailed",
    "saveTimeout",
    "waitPhotoUpload",
    "submitFailed",
    "saveBeforePreview",
    "titleRequired",
    "titleMinLength",
    "descriptionRequired",
    "descriptionMinLength",
    "descriptionMaxLength",
    "listingSaveFailed",
    "cityRequired",
    "areaCityMismatch",
    "streetRequired",
    "addressNumberRequired",
    "postalCodeRequired",
    "propertyTypeRequired",
    "sqmInvalid",
    "bedroomsInvalid",
    "bathroomsRequired",
    "floorRequired",
    "maxGuestsMin",
    "mapPinRequired",
    "photoMinOne",
    "photoMinForReview",
    "priorRequired",
    "rentalTypeExclusive",
    "pricePerNightRequired",
    "includedGuestsRequired",
    "extraGuestFeeRequired",
    "minStayNightsRequired",
    "priceMonthlyRequired",
    "monthlyMinStayFloor",
    "registryNumberRequired",
    "registryTypeRequired",
    "amaInvalid",
    "monthlyTierRequired",
    "monthlyTierInvalidRange",
    "monthlyTierExceedsMaxPeople",
    "monthlyTierPositivePrice",
    "monthlyTierOverlap",
    "monthlyMaxPeopleRequired",
    "monthlyBasePriceRequired",
    "monthlyIncludedPeopleRequired",
    "monthlyMaxPeopleBelowIncluded",
    "monthlyExtraPersonRequired",
    "monthlyMaxPriceBelowBase",
  ]);

  function translateWizardError(msg: string | null | undefined): string | null {
    if (!msg) return null;
    if (WIZARD_ERROR_KEYS.has(msg)) {
      if (msg === "descriptionMinLength") {
        return tErrors(msg, { count: MIN_LISTING_DESCRIPTION_LENGTH });
      }
      if (msg === "photoMinForReview") {
        return tErrors(msg, { count: MIN_LISTING_PHOTOS_FOR_REVIEW });
      }
      return tErrors(msg as Parameters<typeof tErrors>[0]);
    }
    return msg;
  }
  const [step, setStep] = useState(() => {
    if (
      typeof initialResumeStep === "number" &&
      initialResumeStep >= 1 &&
      initialResumeStep <= TOTAL_STEPS
    ) {
      return initialResumeStep;
    }
    return 1;
  });
  const [error, setError] = useState<string | null>(initialResumeMessage);
  const [success, setSuccess] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [navBusy, setNavBusy] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [formDirty, setFormDirty] = useState(false);
  const [listingId, setListingId] = useState<string | null>(initialListingId);
  const [savedPhotoCount, setSavedPhotoCount] = useState(initialPhotoCount);
  const [draftImages, setDraftImages] = useState<ListingImage[]>(() =>
    Array.isArray(initialImages) ? initialImages : []
  );
  /** SSR/draft fetch already resolved photo list (may be empty). */
  const [draftPhotosHydrated, setDraftPhotosHydrated] = useState(
    () => initialListingId != null
  );
  const [photosUploadBusy, setPhotosUploadBusy] = useState(false);
  /** When true, primary CTA returns to review after validating/saving this step. */
  const [returnToReview, setReturnToReview] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return new URLSearchParams(window.location.search).get("returnTo") === "review";
    } catch {
      return false;
    }
  });
  /** Phase D: calm interstitial when first entering a phase (skipped on ?draft= resume). */
  const [activePhaseIntro, setActivePhaseIntro] = useState<WizardPhaseId | null>(() =>
    initialListingId ? null : "about"
  );
  const [seenPhaseIntros, setSeenPhaseIntros] = useState<Set<WizardPhaseId>>(() =>
    initialListingId ? new Set(["about", "stand_out", "finish"]) : new Set()
  );

  const wizardTopRef = useRef<HTMLDivElement>(null);
  const stepHeadingRef = useRef<HTMLHeadingElement>(null);
  const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null);
  const skipInitialScrollRef = useRef(true);
  const draftLoadedRef = useRef(false);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autosaveSkipRef = useRef(true);
  const saveGenerationRef = useRef(0);
  const saveChainRef = useRef<Promise<unknown>>(Promise.resolve());
  const creatingDraftRef = useRef(false);
  const navBusyRef = useRef(false);
  const listingIdRef = useRef<string | null>(listingId);
  const latestFormDataRef = useRef<
    (opts?: { resumeMode?: "current" | "autosave" }) => FormData
  >(() => new FormData());
  const selectedAmenityKeysRef = useRef<string[]>([]);
  const formDirtyRef = useRef(false);
  /** Sync resume step into saves even when React state has not flushed yet. */
  const stepRef = useRef(step);
  /**
   * After first resume/session_sync/start, draft refetch must never call setStep.
   * Starts false until useLayoutEffect session sync (or fresh wizard with no draft).
   */
  const stepInitializedRef = useRef(false);
  /** One-shot session→UI sync for this mount — never re-apply after. */
  const sessionSyncedRef = useRef(false);
  /** High-water resume id so stale autosave cannot downgrade DB resume. */
  const persistedResumeHighWaterRef = useRef<ActiveWizardStepId | null>(
    (() => {
      const fromListing = parseWizardResumeStep(
        (initialDraftListing as WizardResumeListingSnapshot | null | undefined)
          ?.wizard_resume_step
      );
      const listingHw =
        fromListing && fromListing !== "rental_mode" ? fromListing : null;
      return preferHigherResumeStep(
        listingHw,
        typeof initialResumeStep === "number"
          ? activeWizardStepIdFromNumber(initialResumeStep)
          : null
      );
    })()
  );

  function resolveListingId(): string | null {
    return listingIdRef.current ?? listingId;
  }

  function persistListingId(id: string) {
    listingIdRef.current = id;
    setListingId(id);
    try {
      sessionStorage.setItem(WIZARD_DRAFT_STORAGE_KEY, id);
      const url = new URL(window.location.href);
      if (url.searchParams.get("draft") !== id) {
        url.searchParams.set("draft", id);
        url.searchParams.delete("fresh");
      }
      if (returnToReview) {
        url.searchParams.set("returnTo", "review");
      }
      window.history.replaceState(null, "", `${url.pathname}?${url.searchParams.toString()}`);
      writeSessionWizardStep(id, stepRef.current);
    } catch {
      // ignore storage errors
    }
  }

  function setReturnToReviewMode(enabled: boolean) {
    setReturnToReview(enabled);
    try {
      const url = new URL(window.location.href);
      if (enabled) {
        url.searchParams.set("returnTo", "review");
      } else {
        url.searchParams.delete("returnTo");
      }
      const draft =
        resolveListingId() ??
        url.searchParams.get("draft")?.trim() ??
        null;
      if (draft) url.searchParams.set("draft", draft);
      window.history.replaceState(null, "", `${url.pathname}?${url.searchParams.toString()}`);
    } catch {
      // ignore
    }
  }

  function enterFixFromReview(targetStep: number) {
    setError(null);
    setActivePhaseIntro(null);
    setReturnToReviewMode(true);
    goToStep(targetStep, "publish_missing_click");
  }

  function clearReturnToReviewAndGoReview() {
    setReturnToReviewMode(false);
    goToStep(REVIEW_STEP, "step_click");
  }

  function hydrateFromListing(listing: Record<string, unknown>) {
    if (typeof listing.title === "string") setTitle(listing.title);
    if (typeof listing.city === "string") setCity(listing.city);
    if (typeof listing.area === "string") setArea(listing.area);
    if (typeof listing.address_street === "string") setAddressStreet(listing.address_street);
    if (typeof listing.address_number === "string") setAddressNumber(listing.address_number);
    if (typeof listing.address_postal_code === "string") {
      setAddressPostalCode(listing.address_postal_code);
    }
    if (typeof listing.address_floor === "string") setAddressFloor(listing.address_floor);
    if (typeof listing.address_unit === "string") setAddressUnit(listing.address_unit);
    if (typeof listing.formatted_address === "string") {
      setFormattedAddress(listing.formatted_address);
      setAddressSearch(listing.formatted_address);
    }
    if (typeof listing.provider_place_id === "string") setProviderPlaceId(listing.provider_place_id);
    if (typeof listing.city_display_name === "string") setCityDisplayName(listing.city_display_name);
    if (typeof listing.area_display_name === "string") setAreaDisplayName(listing.area_display_name);
    if (listing.latitude != null) setLatitude(Number(listing.latitude));
    if (listing.longitude != null) setLongitude(Number(listing.longitude));
    if (listing.location_confirmed_by_owner === true) {
      setLocationConfirmedByOwner(true);
    }
    if (typeof listing.location_confirmed_at === "string") {
      setLocationConfirmedAt(listing.location_confirmed_at);
    }
    if (listing.location_pin_moved_manually === true) {
      setLocationPinMovedManually(true);
    }
    if (listing.use_profile_contact === false) setUseProfileContact(false);
    if (listing.allow_phone_contact != null) setAllowPhoneContact(listing.allow_phone_contact === true);
    if (listing.allow_whatsapp != null) setAllowWhatsApp(listing.allow_whatsapp === true);
    if (listing.allow_viber != null) setAllowViber(listing.allow_viber === true);
    if (listing.allow_message != null) setAllowMessage(listing.allow_message !== false);
    if (listing.contact_whatsapp_use_primary === false) setContactWhatsappUsePrimary(false);
    if (listing.contact_viber_use_primary === false) setContactViberUsePrimary(false);
    if (typeof listing.contact_whatsapp_phone === "string") {
      setContactWhatsappPhone(listing.contact_whatsapp_phone);
    }
    if (typeof listing.contact_viber_phone === "string") {
      setContactViberPhone(listing.contact_viber_phone);
    }
    if (typeof listing.property_type === "string") setPropertyType(listing.property_type);
    if (listing.sqm != null) setSqm(String(listing.sqm));
    if (listing.bedrooms != null) setBedrooms(String(listing.bedrooms));
    if (listing.bathrooms != null) setBathrooms(String(listing.bathrooms));
    // Accept number or numeric string; 0 = ισόγειο must hydrate (not stay on default "0" from a missed load)
    if (listing.floor != null && listing.floor !== "") {
      const n = typeof listing.floor === "number" ? listing.floor : parseInt(String(listing.floor), 10);
      if (Number.isFinite(n) && n >= 0) setFloor(String(n));
    } else if (typeof listing.address_floor === "string" && listing.address_floor.trim() !== "") {
      const n = parseInt(listing.address_floor.trim(), 10);
      if (Number.isFinite(n) && n >= 0) setFloor(String(n));
    }
    if (typeof listing.description === "string") setDescription(listing.description);
    if (listing.price_per_night != null) setPricePerNight(String(listing.price_per_night));
    if (listing.price_monthly != null) setPriceMonthly(String(listing.price_monthly));
    if (listing.included_guests != null) setIncludedGuests(String(listing.included_guests));
    if (listing.extra_guest_fee_per_night != null) {
      setExtraGuestFee(String(listing.extra_guest_fee_per_night));
    }
    if (listing.max_guests != null) setMaxGuests(String(listing.max_guests));
    {
      const mode =
        listing.monthly_pricing_mode === "fixed" ||
        listing.monthly_pricing_mode === "extra_person" ||
        listing.monthly_pricing_mode === "tiers"
          ? listing.monthly_pricing_mode
          : "extra_person";
      setMonthlyOccupancy({
        mode,
        basePrice: String(
          listing.monthly_base_price ?? listing.price_monthly ?? ""
        ),
        includedPeople: String(listing.monthly_included_people ?? 2),
        maxPeople: String(
          listing.monthly_max_people ?? listing.max_guests ?? ""
        ),
        extraPersonPrice:
          listing.monthly_extra_person_price != null
            ? String(listing.monthly_extra_person_price)
            : "",
        maxPrice:
          listing.monthly_max_price != null
            ? String(listing.monthly_max_price)
            : "",
        tiers: Array.isArray(listing.monthly_price_tiers)
          ? listing.monthly_price_tiers.map((t) => ({
              people_from: t.people_from,
              people_to: t.people_to,
              monthly_price: t.monthly_price,
            }))
          : [],
      });
    }
    if (typeof listing.min_stay_label === "string") {
      setShortMinStay(listing.min_stay_label);
      setMonthlyMinStay(listing.min_stay_label);
    }
    if (typeof listing.legal_registry_type === "string") {
      setLegalRegistryType(listing.legal_registry_type);
    }
    if (typeof listing.ama_number === "string") setAmaNumber(listing.ama_number);
    if (typeof listing.availability_status === "string") {
      setAvailabilityStatus(listing.availability_status);
    }
    if (typeof listing.availability_note === "string") {
      setAvailabilityNote(listing.availability_note);
    }
    if (typeof listing.contact_name === "string") setContactName(listing.contact_name);
    if (typeof listing.contact_phone === "string") setContactPhone(listing.contact_phone);
    if (typeof listing.contact_email === "string") setContactEmail(listing.contact_email);
    if (typeof listing.preferred_contact === "string") {
      setPreferredContact(listing.preferred_contact);
    }
    if (listing.accepts_under_60_days === true) setAcceptsUnder60(true);
    if (listing.owner_responsibility_accepted === true) {
      setOwnerDeclarationAccepted(true);
    }
    if (listing.ama_declaration_accepted === true) {
      setRegistryDeclarationAccepted(true);
    }
    if (listing.platform_role_accepted === true) {
      setPlatformDeclarationAccepted(true);
    }
    if (listing.tax_obligation_accepted === true) {
      setTaxDeclarationAccepted(true);
    }
    if (listing.authority_disclosure_accepted === true) {
      setAuthorityDeclarationAccepted(true);
    }
    if (listing.terms_privacy_accepted === true) {
      setTermsPrivacyAccepted(true);
    }

    const rentalType = listing.rental_type;
    if (listing.supports_short_term === true && listing.supports_monthly === true) {
      setRentalTypeChoice(rentalType === "monthly" ? "monthly" : "short_term");
    } else if (listing.supports_short_term === true) {
      setRentalTypeChoice("short_term");
    } else if (listing.supports_monthly === true) {
      setRentalTypeChoice("monthly");
    } else if (rentalType === "short_term") {
      setRentalTypeChoice("short_term");
    } else if (rentalType === "monthly") {
      setRentalTypeChoice("monthly");
    }
    if (typeof listing.monthly_terms === "string") setMonthlyTerms(listing.monthly_terms);
  }

  const [rentalTypeChoice, setRentalTypeChoice] = useState<"short_term" | "monthly">("short_term");
  const supportsShortTerm = rentalTypeChoice === "short_term";
  const supportsMonthly = rentalTypeChoice === "monthly";
  const [title, setTitle] = useState("");
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [addressStreet, setAddressStreet] = useState("");
  const [addressNumber, setAddressNumber] = useState("");
  const [addressPostalCode, setAddressPostalCode] = useState("");
  const [addressFloor, setAddressFloor] = useState("");
  const [addressUnit, setAddressUnit] = useState("");
  const [addressSearch, setAddressSearch] = useState("");
  const [formattedAddress, setFormattedAddress] = useState("");
  const [providerPlaceId, setProviderPlaceId] = useState("");
  const [cityDisplayName, setCityDisplayName] = useState("");
  const [areaDisplayName, setAreaDisplayName] = useState("");
  const [areaLockedByUser, setAreaLockedByUser] = useState(false);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [suggestedLat, setSuggestedLat] = useState<number | null>(null);
  const [suggestedLng, setSuggestedLng] = useState<number | null>(null);
  const [locationConfirmedByOwner, setLocationConfirmedByOwner] = useState(false);
  const [locationPinMovedManually, setLocationPinMovedManually] = useState(false);
  const [locationConfirmedAt, setLocationConfirmedAt] = useState<string | null>(null);
  const [useProfileContact, setUseProfileContact] = useState(true);
  const [allowPhoneContact, setAllowPhoneContact] = useState(true);
  const [allowWhatsApp, setAllowWhatsApp] = useState(profile.allow_whatsapp === true);
  const [allowViber, setAllowViber] = useState(profile.allow_viber === true);
  const [allowMessage, setAllowMessage] = useState(profile.allow_message !== false);
  const [contactWhatsappUsePrimary, setContactWhatsappUsePrimary] = useState(true);
  const [contactViberUsePrimary, setContactViberUsePrimary] = useState(true);
  const [contactWhatsappPhone, setContactWhatsappPhone] = useState("");
  const [contactViberPhone, setContactViberPhone] = useState("");
  const [propertyType, setPropertyType] = useState<string>(PROPERTY_TYPES[0].value);
  const [sqm, setSqm] = useState("");
  const [bedrooms, setBedrooms] = useState("1");
  const [bathrooms, setBathrooms] = useState("1");
  const [floor, setFloor] = useState("0");
  const [description, setDescription] = useState("");
  const [pricePerNight, setPricePerNight] = useState("");
  const [includedGuests, setIncludedGuests] = useState("2");
  const [extraGuestFee, setExtraGuestFee] = useState("0");
  const [maxGuests, setMaxGuests] = useState("2");
  const [shortMinStay, setShortMinStay] = useState("");
  const [priceMonthly, setPriceMonthly] = useState("");
  const [monthlyOccupancy, setMonthlyOccupancy] =
    useState<MonthlyOccupancyPricingValue>(EMPTY_MONTHLY_OCCUPANCY_PRICING);
  const [monthlyMinStay, setMonthlyMinStay] = useState("");
  const [monthlyTerms, setMonthlyTerms] = useState("");
  const [acceptsUnder60, setAcceptsUnder60] = useState(false);
  const [legalRegistryType, setLegalRegistryType] = useState("ama");
  const [amaNumber, setAmaNumber] = useState("");
  const [availabilityStatus, setAvailabilityStatus] = useState("upon_request");
  const [availabilityNote, setAvailabilityNote] = useState("");
  const [contactName, setContactName] = useState(profile.full_name ?? "");
  const [contactPhone, setContactPhone] = useState(profile.phone ?? "");
  const [contactEmail, setContactEmail] = useState(email);
  const [preferredContact, setPreferredContact] = useState("phone");
  const verificationCode = useMemo(() => generateMidoraVerificationCode(), []);
  const [ownerDeclarationAccepted, setOwnerDeclarationAccepted] = useState(false);
  const [registryDeclarationAccepted, setRegistryDeclarationAccepted] = useState(false);
  const [platformDeclarationAccepted, setPlatformDeclarationAccepted] = useState(false);
  const [taxDeclarationAccepted, setTaxDeclarationAccepted] = useState(false);
  const [authorityDeclarationAccepted, setAuthorityDeclarationAccepted] = useState(false);
  const [termsPrivacyAccepted, setTermsPrivacyAccepted] = useState(false);
  const [selectedAmenityKeys, setSelectedAmenityKeys] = useState<string[]>([]);
  const amenitiesHydratedForRef = useRef<string | null>(null);
  const [externalLinks, setExternalLinks] = useState<ListingExternalLink[]>([]);
  const externalLinksHydratedForRef = useRef<string | null>(null);

  const needsAma =
    supportsShortTerm || (supportsMonthly && acceptsUnder60);

  const allDeclarationsChecked = areWizardDeclarationsComplete({
    needsRegistryDeclaration: needsAma,
    ownerAccepted: ownerDeclarationAccepted,
    registryAccepted: registryDeclarationAccepted,
    platformAccepted: platformDeclarationAccepted,
    taxAccepted: taxDeclarationAccepted,
    authorityAccepted: authorityDeclarationAccepted,
    termsAccepted: termsPrivacyAccepted,
  });
  const listingPhoneReady = listingPhoneReadyForCalls(
    contactPhone,
    allowPhoneContact,
    profile
  );

  const buildFormData = useCallback((opts?: { resumeMode?: "current" | "autosave" }): FormData => {
    const fd = new FormData();
    fd.set("rental_type", rentalTypeChoice);
    if (supportsShortTerm) fd.set("supports_short_term", "on");
    if (supportsMonthly) fd.set("supports_monthly", "on");
    fd.set("title", title.trim());
    fd.set("city", city);
    fd.set("area", (area.trim() || city.trim()));
    fd.set("address_street", addressStreet.trim());
    fd.set("address_number", addressNumber.trim());
    fd.set("address_postal_code", addressPostalCode.trim());
    fd.set("address_floor", addressFloor.trim() || floor.trim());
    fd.set("address_unit", addressUnit.trim());
    fd.set("city_display_name", (cityDisplayName || city).trim());
    fd.set("area_display_name", (areaDisplayName || area).trim());
    if (formattedAddress) fd.set("formatted_address", formattedAddress);
    if (providerPlaceId) fd.set("provider_place_id", providerPlaceId);
    if (latitude != null) fd.set("latitude", String(latitude));
    if (longitude != null) fd.set("longitude", String(longitude));
    if (locationConfirmedByOwner) fd.set("location_confirmed_by_owner", "on");
    if (locationPinMovedManually) fd.set("location_pin_moved_manually", "on");
    if (locationConfirmedAt) fd.set("location_confirmed_at", locationConfirmedAt);
    if (useProfileContact) fd.set("use_profile_contact", "on");
    else fd.set("use_profile_contact", "off");
    if (allowPhoneContact) fd.set("allow_phone_contact", "on");
    if (allowWhatsApp) fd.set("allow_whatsapp", "on");
    if (allowViber) fd.set("allow_viber", "on");
    if (allowMessage) fd.set("allow_message", "on");
    if (contactWhatsappUsePrimary) fd.set("contact_whatsapp_use_primary", "on");
    else fd.set("contact_whatsapp_use_primary", "off");
    if (contactViberUsePrimary) fd.set("contact_viber_use_primary", "on");
    else fd.set("contact_viber_use_primary", "off");
    if (contactWhatsappPhone.trim()) fd.set("contact_whatsapp_phone", contactWhatsappPhone.trim());
    if (contactViberPhone.trim()) fd.set("contact_viber_phone", contactViberPhone.trim());
    fd.set("property_type", propertyType);
    fd.set("sqm", sqm.trim());
    fd.set("bedrooms", bedrooms);
    fd.set("bathrooms", bathrooms);
    fd.set("floor", floor.trim() === "" ? "0" : floor.trim());
    fd.set("description", description.trim());
    fd.set("max_guests", supportsMonthly ? monthlyOccupancy.maxPeople || maxGuests : maxGuests);
    if (supportsShortTerm) {
      fd.set("price_per_night", pricePerNight);
      fd.set("included_guests", includedGuests);
      fd.set("extra_guest_fee_per_night", extraGuestFee);
      fd.set("short_min_stay_label", shortMinStay);
    }
    if (supportsMonthly) {
      const base = monthlyOccupancy.basePrice || priceMonthly;
      fd.set("price_monthly", base);
      fd.set("monthly_pricing_mode", monthlyOccupancy.mode);
      fd.set("monthly_base_price", base);
      fd.set("monthly_included_people", monthlyOccupancy.includedPeople || "2");
      fd.set("monthly_max_people", monthlyOccupancy.maxPeople || maxGuests);
      if (monthlyOccupancy.extraPersonPrice !== "") {
        fd.set("monthly_extra_person_price", monthlyOccupancy.extraPersonPrice);
      } else if (monthlyOccupancy.mode === "extra_person") {
        fd.set("monthly_extra_person_price", "0");
      }
      if (monthlyOccupancy.maxPrice) {
        fd.set("monthly_max_price", monthlyOccupancy.maxPrice);
      }
      if (monthlyOccupancy.mode === "tiers") {
        fd.set("monthly_price_tiers_json", JSON.stringify(monthlyOccupancy.tiers));
      }
      if (monthlyMinStay) fd.set("monthly_min_stay_label", monthlyMinStay);
      if (monthlyTerms.trim()) fd.set("monthly_terms", monthlyTerms.trim());
    } else if (supportsShortTerm) {
      fd.set("price_monthly", pricePerNight);
    }
    fd.set("accepts_under_60_days", acceptsUnder60 ? "yes" : "no");
    if (needsAma) {
      fd.set("ama_number", amaNumber.trim());
      fd.set("legal_registry_type", legalRegistryType);
    }
    fd.set("availability_status", availabilityStatus);
    if (availabilityNote) fd.set("availability_note", availabilityNote);
    fd.set("contact_name", contactName.trim());
    fd.set("contact_phone", contactPhone.trim());
    fd.set("contact_email", contactEmail.trim());
    fd.set("preferred_contact", preferredContact);
    fd.set("midora_verification_code", verificationCode);
    if (ownerDeclarationAccepted) {
      fd.set("owner_responsibility_accepted", "on");
    }
    if (needsAma && registryDeclarationAccepted) {
      fd.set("ama_declaration_accepted", "on");
    }
    if (platformDeclarationAccepted) {
      fd.set("platform_role_accepted", "on");
    }
    if (taxDeclarationAccepted) {
      fd.set("tax_obligation_accepted", "on");
    }
    if (authorityDeclarationAccepted) {
      fd.set("authority_disclosure_accepted", "on");
    }
    if (termsPrivacyAccepted) {
      fd.set("terms_privacy_accepted", "on");
    }
    fd.set("furnished", "on");
    fd.set("min_months", supportsShortTerm && !supportsMonthly ? "1" : "2");
    const uiResumeId =
      activeWizardStepIdFromNumber(stepRef.current) ?? ACTIVE_WIZARD_STEP_IDS[0];
    const resumeId =
      opts?.resumeMode === "autosave"
        ? resumeStepForAutosave(uiResumeId, persistedResumeHighWaterRef.current)
        : uiResumeId;
    fd.set("wizard_resume_step", resumeId);
    return fd;
  }, [
    rentalTypeChoice,
    supportsShortTerm,
    supportsMonthly,
    title,
    city,
    area,
    addressStreet,
    addressNumber,
    addressPostalCode,
    addressFloor,
    addressUnit,
    cityDisplayName,
    areaDisplayName,
    formattedAddress,
    providerPlaceId,
    latitude,
    longitude,
    locationConfirmedByOwner,
    locationPinMovedManually,
    locationConfirmedAt,
    useProfileContact,
    allowPhoneContact,
    allowWhatsApp,
    allowViber,
    allowMessage,
    contactWhatsappUsePrimary,
    contactViberUsePrimary,
    contactWhatsappPhone,
    contactViberPhone,
    propertyType,
    sqm,
    bedrooms,
    bathrooms,
    floor,
    description,
    pricePerNight,
    includedGuests,
    extraGuestFee,
    maxGuests,
    shortMinStay,
    priceMonthly,
    monthlyOccupancy,
    monthlyMinStay,
    monthlyTerms,
    acceptsUnder60,
    needsAma,
    amaNumber,
    legalRegistryType,
    availabilityStatus,
    availabilityNote,
    contactName,
    contactPhone,
    contactEmail,
    preferredContact,
    verificationCode,
    ownerDeclarationAccepted,
    registryDeclarationAccepted,
    platformDeclarationAccepted,
    taxDeclarationAccepted,
    authorityDeclarationAccepted,
    termsPrivacyAccepted,
  ]);

  // Keep refs in sync during render so debounced autosave never reads stale closures.
  listingIdRef.current = listingId;
  latestFormDataRef.current = buildFormData;
  stepRef.current = step;
  navBusyRef.current = navBusy;

  useEffect(() => {
    selectedAmenityKeysRef.current = selectedAmenityKeys;
  }, [selectedAmenityKeys]);

  useEffect(() => {
    formDirtyRef.current = formDirty;
  }, [formDirty]);

  /**
   * Before paint: reconcile in-tab session with SSR/DB resume.
   * Session may win when ahead (remount). Lower/stale session (e.g. rental_mode)
   * must not beat SSR — that caused Continue-from-dashboard to open step 1.
   * session_sync is one-shot per mount.
   */
  useLayoutEffect(() => {
    if (sessionSyncedRef.current) return;

    let draftId =
      initialListingId ??
      (typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("draft")?.trim() || null
        : null);

    if (!draftId && typeof window !== "undefined") {
      try {
        draftId = sessionStorage.getItem(WIZARD_DRAFT_STORAGE_KEY);
      } catch {
        draftId = null;
      }
    }

    if (!draftId) {
      // Fresh wizard — UI owns step 1; lock out late resume.
      sessionSyncedRef.current = true;
      stepInitializedRef.current = true;
      return;
    }

    const sessionId = readSessionWizardStepId(draftId);
    const preferred = preferSessionWizardStep(sessionId, stepRef.current);
    if (preferred.stepNumber !== stepRef.current) {
      goToStep(preferred.stepNumber, "session_sync");
      return;
    }

    sessionSyncedRef.current = true;
    // Never lock init on step 1 while a draft payload is present — useEffect must
    // still apply DB resume / stale rental_mode recovery. Lock when past step 1
    // or when there is no draft listing to reconcile (fresh wizard / empty SSR).
    if (preferred.stepNumber > 1) {
      stepInitializedRef.current = true;
    } else if (!initialDraftListing) {
      stepInitializedRef.current = true;
    }
    writeSessionWizardStep(draftId, stepRef.current);
    const hw = activeWizardStepIdFromNumber(stepRef.current);
    if (hw) {
      persistedResumeHighWaterRef.current = preferHigherResumeStep(
        persistedResumeHighWaterRef.current,
        hw
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot mount sync
  }, []);

  function goToStep(target: number, reason: WizardStepChangeReason): boolean {
    const clamped = Math.min(Math.max(target, 1), TOTAL_STEPS);
    const decision = decideWizardStepChange({
      currentStep: stepRef.current,
      nextStep: clamped,
      reason,
      stepInitialized: stepInitializedRef.current,
      sessionSynced: sessionSyncedRef.current,
    });

    logWizardStepChange(
      {
        from: stepRef.current,
        to: clamped,
        reason,
        apply: decision.apply,
        blocked: decision.blocked,
        detail: decision.detail,
        stepInitialized: stepInitializedRef.current,
        sessionSynced: sessionSyncedRef.current,
      },
      decision.blocked ? "warn" : "log"
    );

    if (!decision.apply) return false;

    stepRef.current = clamped;
    setStep(clamped);

    if (reason === "session_sync") {
      sessionSyncedRef.current = true;
      stepInitializedRef.current = true;
    } else if (reason === "resume" || reason === "start_new") {
      stepInitializedRef.current = true;
      sessionSyncedRef.current = true;
    } else if (!stepInitializedRef.current) {
      // User navigated before async resume finished — lock out late resume.
      stepInitializedRef.current = true;
      sessionSyncedRef.current = true;
    }

    const resumeId = activeWizardStepIdFromNumber(clamped);
    if (resumeId) {
      if (reason === "back") {
        persistedResumeHighWaterRef.current = resumeId;
      } else {
        const hw = persistedResumeHighWaterRef.current;
        const hwNum = hw ? ACTIVE_WIZARD_STEP_IDS.indexOf(hw) + 1 : 0;
        if (clamped >= hwNum) {
          persistedResumeHighWaterRef.current = resumeId;
        }
      }
    }

    const id =
      resolveListingId() ??
      initialListingId ??
      (typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("draft")?.trim() || null
        : null);
    if (id) writeSessionWizardStep(id, clamped);
    return true;
  }

  function markFormDirty() {
    if (!formDirtyRef.current) {
      formDirtyRef.current = true;
      setFormDirty(true);
    }
    scheduleAutosave();
  }

  function clearFormDirty() {
    formDirtyRef.current = false;
    setFormDirty(false);
  }

  /** Debounced autosave for any field change once a draft id exists. */
  function scheduleAutosave() {
    const activeListingId = resolveListingId();
    if (!activeListingId) return;
    if (navBusyRef.current) return;
    if (autosaveSkipRef.current) return;

    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => {
      const id = resolveListingId();
      if (!id || navBusyRef.current) return;
      // Validate after debounce so latestFormDataRef has post-render values.
      if (
        listingDescriptionValidationError(
          (latestFormDataRef.current().get("description") as string) || "",
          { forSubmission: false }
        )
      ) {
        return;
      }
      const generation = saveGenerationRef.current + 1;
      setSaveStatus("saving");
      void (async () => {
        const result = await saveDraftSerialized(id, { resumeMode: "autosave" });
        if (generation !== saveGenerationRef.current && !result.error) return;
        if (result.error) {
          setSaveStatus("error");
          return;
        }
        clearFormDirty();
        setSaveStatus("saved");
      })();
    }, AUTOSAVE_DEBOUNCE_MS);
  }

  /** Serialize draft saves — latest generation wins for status updates. */
  async function saveDraftSerialized(
    activeListingId: string | null,
    options?: { resumeMode?: "current" | "autosave" }
  ): Promise<{ listingId?: string; error?: string }> {
    const generation = ++saveGenerationRef.current;
    const resumeMode = options?.resumeMode ?? "current";
    const run = async () => {
      const result = await savePortalListingDraft(
        latestFormDataRef.current({ resumeMode }),
        activeListingId
      );
      if (!result.error) {
        const written =
          resumeMode === "autosave"
            ? resumeStepForAutosave(
                activeWizardStepIdFromNumber(stepRef.current) ??
                  ACTIVE_WIZARD_STEP_IDS[0],
                persistedResumeHighWaterRef.current
              )
            : activeWizardStepIdFromNumber(stepRef.current);
        if (written) {
          if (resumeMode === "autosave") {
            // Never lower high-water from an autosave completion.
            persistedResumeHighWaterRef.current = resumeStepForAutosave(
              written,
              persistedResumeHighWaterRef.current
            );
          } else {
            persistedResumeHighWaterRef.current = written;
          }
        }
      }
      return result;
    };
    const queued = saveChainRef.current.then(run, run);
    saveChainRef.current = queued.then(
      () => undefined,
      () => undefined
    );
    const result = await queued;
    if (generation !== saveGenerationRef.current) {
      return result.error ? result : { listingId: result.listingId };
    }
    return result;
  }

  const refreshSavedPhotoCount = useCallback(
    async (targetListingId?: string | null): Promise<number> => {
      const id = targetListingId ?? listingId;
      if (!id) {
        setSavedPhotoCount(0);
        return 0;
      }

      const result = await getSavedListingImageCount(id);
      if ("error" in result && result.error) {
        logListingImageValidationDebug({
          listingId: id,
          savedImageCount: 0,
          currentStep: step,
        });
        return 0;
      }

      const count =
        "photoCount" in result && typeof result.photoCount === "number"
          ? result.photoCount
          : 0;
      setSavedPhotoCount(count);
      return count;
    },
    [listingId, step]
  );

  const handlePhotoCountChange = useCallback(() => {
    void refreshSavedPhotoCount();
  }, [refreshSavedPhotoCount]);

  const scrollToWizardStep = useCallback(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const target = stepHeadingRef.current ?? wizardTopRef.current;
        if (!target) return;
        const top =
          target.getBoundingClientRect().top + window.scrollY - WIZARD_SCROLL_OFFSET;
        window.scrollTo({ top: Math.max(0, top), behavior: "auto" });
        stepHeadingRef.current?.focus({ preventScroll: true });
      });
    });
  }, []);

  useEffect(() => {
    if (skipInitialScrollRef.current) {
      skipInitialScrollRef.current = false;
      return;
    }
    scrollToWizardStep();
  }, [step, scrollToWizardStep]);

  const loadDraftById = useCallback(
    (draftId: string) => {
      startTransition(async () => {
        persistListingId(draftId);
        const result = await getWizardListingDraft(draftId);
        if ("error" in result && result.error) {
          setError(result.error);
          clearSessionWizardStep(draftId);
          clearWizardDraftSession(setListingId, listingIdRef);
          window.history.replaceState(null, "", "/dashboard/listings/new");
          return;
        }
        if (!("listing" in result) || !result.listing) return;

        const listing = result.listing as Record<string, unknown>;
        hydrateFromListing(listing);
        const photoCount = result.photoCount ?? 0;
        setSavedPhotoCount(photoCount);
        const images = Array.isArray(result.images) ? result.images : [];
        setDraftImages(images);
        setDraftPhotosHydrated(true);
        setSaveStatus("saved");

        amenitiesHydratedForRef.current = draftId;
        const amenityRows = await getOwnerListingAmenities(draftId);
        setSelectedAmenityKeys(
          amenityRows
            .map((row) => normalizeAmenityKey(row.amenity_key))
            .filter(Boolean)
        );

        externalLinksHydratedForRef.current = draftId;
        setExternalLinks(await getMyListingExternalLinks(draftId));

        // Fields-only after step init — never downgrade UI from draft refetch.
        if (stepInitializedRef.current) {
          logWizardStepChange(
            {
              reason: "draft_refetch",
              blocked: true,
              detail: "fields_only_after_init",
              stepInitialized: true,
            },
            "warn"
          );
          // Still raise high-water from DB so autosave cannot write step 1 over a
          // later stored resume if UI somehow landed early.
          const stored = parseWizardResumeStep(
            (listing as WizardResumeListingSnapshot).wizard_resume_step
          );
          // Ignore stale rental_mode high-water — recovery / UI step owns it.
          if (stored && stored !== "rental_mode") {
            persistedResumeHighWaterRef.current = preferHigherResumeStep(
              persistedResumeHighWaterRef.current,
              stored
            );
          }
          return;
        }

        const params =
          typeof window !== "undefined"
            ? new URLSearchParams(window.location.search)
            : null;
        const resolved = resolveInitialWizardStep(
          listing as WizardResumeListingSnapshot,
          {
            photoCount,
            queryStep: params?.get("step")?.trim() || null,
            sessionStepNumber: readSessionWizardStep(draftId),
          }
        );
        goToStep(resolved.stepNumber, "resume");
        if (resolved.message) setError(resolved.message);
        // Persist recovered / first-incomplete step so next Continue is stable.
        if (
          resolved.source === "first_incomplete" ||
          resolved.source === "review"
        ) {
          void saveDraftSerialized(draftId);
        }
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hydrate uses setters; load once per id
    []
  );

  useEffect(() => {
    if (!listingId || amenitiesHydratedForRef.current === listingId) return;
    // Keep in-progress wizard selections if the owner already picked amenities
    // before the draft id existed (early create must not wipe the chips).
    if (selectedAmenityKeysRef.current.length > 0) {
      amenitiesHydratedForRef.current = listingId;
      return;
    }
    let cancelled = false;
    amenitiesHydratedForRef.current = listingId;
    void getOwnerListingAmenities(listingId).then((rows) => {
      if (cancelled) return;
      setSelectedAmenityKeys(
        rows.map((row) => normalizeAmenityKey(row.amenity_key)).filter(Boolean)
      );
    });
    return () => {
      cancelled = true;
    };
  }, [listingId]);

  useEffect(() => {
    if (!listingId || draftPhotosHydrated) return;
    let cancelled = false;
    void (async () => {
      const [imagesResult, countResult] = await Promise.all([
        getOwnerListingImages(listingId),
        getSavedListingImageCount(listingId),
      ]);
      if (cancelled) return;
      if ("images" in imagesResult && imagesResult.images) {
        setDraftImages(
          [...imagesResult.images]
            .filter((i) => i.media_type !== "video")
            .sort((a, b) => a.sort_order - b.sort_order)
        );
      }
      if ("photoCount" in countResult && typeof countResult.photoCount === "number") {
        setSavedPhotoCount(countResult.photoCount);
      }
      setDraftPhotosHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [listingId, draftPhotosHydrated]);

  useEffect(() => {
    if (!listingId || externalLinksHydratedForRef.current === listingId) return;
    let cancelled = false;
    externalLinksHydratedForRef.current = listingId;
    void getMyListingExternalLinks(listingId).then((rows) => {
      if (cancelled) return;
      setExternalLinks(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [listingId]);

  useEffect(() => {
    if (draftLoadedRef.current) return;
    draftLoadedRef.current = true;

    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const fresh = params.get("fresh") === "1";
    const draftIdFromUrl = params.get("draft")?.trim() || null;
    const draftId = initialListingId ?? draftIdFromUrl;

    if (fresh) {
      if (draftIdFromUrl) clearSessionWizardStep(draftIdFromUrl);
      if (initialListingId) clearSessionWizardStep(initialListingId);
      clearWizardDraftSession(setListingId, listingIdRef);
      window.history.replaceState(null, "", "/dashboard/listings/new");
      return;
    }

    // Resume only when explicitly requested via ?draft= or page initialListingId.
    // Otherwise always start a fresh wizard — drafts stay in "Τα ακίνητά μου".
    if (draftId) {
      if (initialDraftListing) {
        persistListingId(draftId);
        hydrateFromListing(initialDraftListing);
        setSavedPhotoCount(initialPhotoCount);
        setDraftImages(Array.isArray(initialImages) ? initialImages : []);
        setDraftPhotosHydrated(true);
        setSaveStatus("saved");
        const storedHw = parseWizardResumeStep(
          (initialDraftListing as WizardResumeListingSnapshot).wizard_resume_step
        );
        if (storedHw && storedHw !== "rental_mode") {
          persistedResumeHighWaterRef.current = preferHigherResumeStep(
            persistedResumeHighWaterRef.current,
            storedHw
          );
        }
        // Amenities / external links still load via listingId effects.
        // Step already owned by useLayoutEffect session sync / SSR — never
        // re-apply resume or unlock init (that caused mid-wizard rollbacks).
        if (!stepInitializedRef.current) {
          const sessionStep = readSessionWizardStep(draftId);
          const resolved = resolveInitialWizardStep(
            initialDraftListing as WizardResumeListingSnapshot,
            {
              photoCount: initialPhotoCount,
              queryStep: params.get("step")?.trim() || null,
              sessionStepNumber: sessionStep,
            }
          );
          goToStep(resolved.stepNumber, "resume");
          if (resolved.message) setError(resolved.message);
          if (
            resolved.source === "first_incomplete" ||
            resolved.source === "review"
          ) {
            void saveDraftSerialized(draftId);
          }
        } else {
          writeSessionWizardStep(draftId, stepRef.current);
          // If SSR recovered past stale rental_mode, persist so DB catches up.
          const resolved = resolveInitialWizardStep(
            initialDraftListing as WizardResumeListingSnapshot,
            {
              photoCount: initialPhotoCount,
              queryStep: params.get("step")?.trim() || null,
              sessionStepNumber: readSessionWizardStep(draftId),
            }
          );
          if (
            (resolved.source === "first_incomplete" ||
              resolved.source === "review") &&
            resolved.stepNumber === stepRef.current
          ) {
            void saveDraftSerialized(draftId);
          }
        }
        return;
      }
      loadDraftById(draftId);
      return;
    }

    clearWizardDraftSession(setListingId, listingIdRef);
  }, [
    initialListingId,
    initialDraftListing,
    initialPhotoCount,
    initialImages,
    loadDraftById,
  ]);

  // Soft unlock: if navBusy is left true (hung server action / remount race), free Next.
  useEffect(() => {
    if (!navBusy) return;
    const t = window.setTimeout(() => {
      if (!navBusyRef.current) return;
      console.warn("[wizard] navBusy unlock timeout");
      setNavBusy(false);
    }, NAV_BUSY_UNLOCK_MS);
    return () => window.clearTimeout(t);
  }, [navBusy]);

  // Amenities is optional — never leave Next disabled from a prior step's save race.
  useEffect(() => {
    if (step !== AMENITIES_STEP) return;
    if (!navBusyRef.current) return;
    setNavBusy(false);
  }, [step]);

  // Persist resume step on navigation; field changes autosave via markFormDirty → scheduleAutosave.
  useEffect(() => {
    if (!listingId) return;
    if (autosaveSkipRef.current) {
      autosaveSkipRef.current = false;
      return;
    }
    if (navBusy) return;
    scheduleAutosave();
  }, [listingId, step, navBusy]);

  // Create a draft as soon as the owner reaches location/capacity so progress is never lost.
  useEffect(() => {
    if (listingId || creatingDraftRef.current) return;
    if (step < 3) return;
    if (!city.trim()) return;
    creatingDraftRef.current = true;
    setSaveStatus("saving");
    void (async () => {
      try {
        const result = await saveDraftSerialized(null);
        if (result.listingId) {
          persistListingId(result.listingId);
          // Capture any field edits that landed while the create request was in flight.
          if (formDirtyRef.current) {
            autosaveSkipRef.current = false;
            scheduleAutosave();
          } else {
            clearFormDirty();
            setSaveStatus("saved");
          }
        } else if (result.error) {
          setSaveStatus("error");
        }
      } finally {
        creatingDraftRef.current = false;
      }
    })();
  }, [step, city, listingId]);

  // Auto-grow description textarea up to a sensible max, then scroll internally.
  useEffect(() => {
    const el = descriptionTextareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const next = Math.min(el.scrollHeight, DESCRIPTION_TEXTAREA_MAX_HEIGHT_PX);
    el.style.height = `${next}px`;
    el.style.overflowY =
      el.scrollHeight > DESCRIPTION_TEXTAREA_MAX_HEIGHT_PX ? "auto" : "hidden";
  }, [description, step]);

  function renderStepHeading(_heading: string) {
    // Shell shows step title + step hints — keep a focus/scroll target only.
    return (
      <span ref={stepHeadingRef} tabIndex={-1} className="sr-only outline-none">
        {_heading}
      </span>
    );
  }

  function dismissPhaseIntro() {
    if (!activePhaseIntro) return;
    setSeenPhaseIntros((prev) => {
      const next = new Set(prev);
      next.add(activePhaseIntro);
      return next;
    });
    setActivePhaseIntro(null);
  }

  function markDraftSaved() {
    setSaveStatus("saved");
  }

  function locationState(): PropertyLocationState {
    return {
      addressSearch,
      addressStreet,
      addressNumber,
      addressPostalCode,
      city,
      area,
      cityDisplayName: cityDisplayName || city,
      areaDisplayName: areaDisplayName || area,
      formattedAddress,
      providerPlaceId,
      latitude,
      longitude,
      locationConfirmedByOwner,
      locationPinMovedManually,
      suggestedLat,
      suggestedLng,
      locationConfirmedAt,
      areaLockedByUser,
    };
  }

  function patchLocationState(patch: Partial<PropertyLocationState>) {
    markFormDirty();
    if (patch.addressSearch !== undefined) setAddressSearch(patch.addressSearch);
    if (patch.addressStreet !== undefined) setAddressStreet(patch.addressStreet);
    if (patch.addressNumber !== undefined) setAddressNumber(patch.addressNumber);
    if (patch.addressPostalCode !== undefined) setAddressPostalCode(patch.addressPostalCode);
    if (patch.city !== undefined) setCity(patch.city);
    if (patch.area !== undefined) setArea(patch.area);
    if (patch.cityDisplayName !== undefined) setCityDisplayName(patch.cityDisplayName);
    if (patch.areaDisplayName !== undefined) setAreaDisplayName(patch.areaDisplayName);
    if (patch.formattedAddress !== undefined) setFormattedAddress(patch.formattedAddress);
    if (patch.providerPlaceId !== undefined) setProviderPlaceId(patch.providerPlaceId);
    if (patch.latitude !== undefined) setLatitude(patch.latitude);
    if (patch.longitude !== undefined) setLongitude(patch.longitude);
    if (patch.suggestedLat !== undefined) setSuggestedLat(patch.suggestedLat);
    if (patch.suggestedLng !== undefined) setSuggestedLng(patch.suggestedLng);
    if (patch.locationConfirmedByOwner === false) {
      // Phase D: address edits clear public exact-address opt-in.
      // Map/geocode must not auto-set confirmed=true (opt-in via visibility checkbox).
      setLocationConfirmedByOwner(false);
      setLocationConfirmedAt(null);
    }
    if (patch.locationPinMovedManually !== undefined) {
      setLocationPinMovedManually(patch.locationPinMovedManually);
    }
    if (patch.areaLockedByUser !== undefined) {
      setAreaLockedByUser(patch.areaLockedByUser);
    }
  }

  function validateWizardStep(
    targetStep: number,
    forSubmission = false,
    dbPhotoCount = savedPhotoCount
  ): string | null {
    if (targetStep === 1) {
      if (!rentalTypeChoice) {
        return "selectRentalType";
      }
      return null;
    }
    if (targetStep === 2) {
      if (!propertyType) return "selectPropertyType";
      return null;
    }
    if (targetStep === 3) {
      return validateLocationStepInput({
        city,
        area,
        addressStreet,
        addressNumber,
        addressPostalCode,
        latitude,
        longitude,
        forSubmission,
        source: forSubmission ? "publish" : "step",
      });
    }
    if (targetStep === 4) {
      return capacityValidationError(
        normalizeCapacityFields({
          maxGuests,
          sqm,
          bedrooms,
          bathrooms,
          floor,
        }),
        forSubmission ? "publish" : "step"
      );
    }
    if (targetStep === 5) {
      const titleError = listingTitleValidationError(title);
      if (titleError) return titleError;
      return listingDescriptionValidationError(description, { forSubmission });
    }
    if (targetStep === AMENITIES_STEP) {
      // Optional — always skippable.
      return null;
    }
    if (targetStep === TRUST_LINKS_STEP) {
      // Optional trust links — always skippable.
      return null;
    }
    if (targetStep === PRICING_STEP) {
      const fields = parsePortalListingFields(buildFormData());
      const err = validatePortalListingFields(fields, { forSubmission: false });
      if (err) return err;
      if (
        forSubmission &&
        needsAmaForFields(fields) &&
        !isValidRegistryNumber(fields.legal_registry_type, fields.ama_number ?? "")
      ) {
        return "registryInvalid";
      }
      return null;
    }
    if (targetStep === PHOTOS_STEP) {
      if (forSubmission) {
        return photoCountSubmitError(dbPhotoCount);
      }
      return photoCountStepError(dbPhotoCount);
    }
    if (targetStep === CONTACT_STEP) {
      if (!contactName.trim()) return "contactNameRequired";
      if (!contactPhone.trim() && !contactEmail.trim()) {
        return "contactPhoneOrEmail";
      }
      if (contactPhone.trim() && !hasCallablePhone(contactPhone)) {
        return "contactPhoneInvalid";
      }
    }
    if (targetStep === DECLARATIONS_STEP) {
      if (!allDeclarationsChecked) {
        return "declarationsRequired";
      }
    }
    if (targetStep === REVIEW_STEP && forSubmission) {
      const fields = parsePortalListingFields(buildFormData());
      if (
        !isReviewChecklistReady({
          fields,
          savedPhotoCount: dbPhotoCount,
          photosHydrated: draftPhotosHydrated,
          trustLinksCount: externalLinks.length,
          needsAma,
          ownerDeclarationAccepted,
          registryDeclarationAccepted,
          platformDeclarationAccepted,
          taxDeclarationAccepted,
          authorityDeclarationAccepted,
          termsPrivacyAccepted,
          listingPhoneReady,
        })
      ) {
        return "reviewIncomplete";
      }
    }
    return null;
  }

  function mapErrorToStep(errorMsg: string): number | null {
    const keyMap: Record<string, number> = {
      selectRentalType: 1,
      selectPropertyType: 2,
      cityRequired: 3,
      areaCityMismatch: 3,
      streetRequired: 3,
      addressNumberRequired: 3,
      postalCodeRequired: 3,
      mapPinRequired: 3,
      sqmInvalid: 4,
      bedroomsInvalid: 4,
      bathroomsRequired: 4,
      floorRequired: 4,
      maxGuestsMin: 4,
      titleRequired: 5,
      titleMinLength: 5,
      descriptionRequired: 5,
      descriptionMinLength: 5,
      descriptionMaxLength: 5,
      registryInvalid: PRICING_STEP,
      photoMinOne: PHOTOS_STEP,
      photoMinForReview: PHOTOS_STEP,
      contactNameRequired: CONTACT_STEP,
      contactPhoneOrEmail: CONTACT_STEP,
      contactPhoneInvalid: CONTACT_STEP,
      declarationsRequired: DECLARATIONS_STEP,
      reviewIncomplete: REVIEW_STEP,
      waitPhotoUpload: PHOTOS_STEP,
      listingSaveFailed: REVIEW_STEP,
      saveFailed: REVIEW_STEP,
    };
    if (keyMap[errorMsg] != null) return keyMap[errorMsg];

    const msg = errorMsg.toLowerCase();
    if (msg.includes("τύπο") && msg.includes("μίσθωσ")) return 1;
    if (msg.includes("rental type")) return 1;
    if (msg.includes("τύπο") && msg.includes("ακινήτ")) return 2;
    if (msg.includes("property type")) return 2;
    if (
      msg.includes("πόλη") ||
      msg.includes("περιοχ") ||
      msg.includes("οδό") ||
      msg.includes("ταχυδρομ") ||
      msg.includes("θέση") ||
      msg.includes("χάρτη") ||
      msg.includes("city") ||
      msg.includes("street") ||
      msg.includes("postal") ||
      msg.includes("map")
    ) {
      return 3;
    }
    if (
      msg.includes("τετραγων") ||
      msg.includes("υπνοδωμάτ") ||
      msg.includes("μπάνι") ||
      msg.includes("όροφο") ||
      msg.includes("sqm") ||
      msg.includes("bedroom") ||
      msg.includes("bathroom") ||
      (msg.includes("ατόμ") && !msg.includes("τιμ"))
    ) {
      return 4;
    }
    if (msg.includes("τίτλ") || msg.includes("περιγραφ") || msg.includes("title") || msg.includes("description"))
      return 5;
    if (msg.includes("παροχ") || msg.includes("amenit")) return AMENITIES_STEP;
    if (
      msg.includes("τιμ") ||
      msg.includes("βράδυ") ||
      msg.includes("μήνα") ||
      msg.includes("διαμον") ||
      msg.includes("καταχώρισ") ||
      msg.includes("αριθμ") ||
      msg.includes("price") ||
      msg.includes("registry")
    ) {
      return PRICING_STEP;
    }
    if (msg.includes("φωτογραφ") || msg.includes("photo")) return PHOTOS_STEP;
    if (
      msg.includes("επικοινων") ||
      msg.includes("τηλέφων") ||
      msg.includes("email") ||
      msg.includes("αγγελιοδότη") ||
      msg.includes("contact") ||
      msg.includes("phone") ||
      msg.includes("advertiser")
    ) {
      return CONTACT_STEP;
    }
    if (msg.includes("δήλωσ") || msg.includes("δηλώσ") || msg.includes("declaration"))
      return DECLARATIONS_STEP;
    if (msg.includes("υποβολ") || msg.includes("ολοκλήρωσε όλα") || msg.includes("reviewincomplete") || msg.includes("required fields") || msg.includes("complete all required"))
      return REVIEW_STEP;
    return null;
  }

  async function findFirstInvalidStep(
    forSubmission: boolean
  ): Promise<{ step: number; error: string } | null> {
    const activeListingId = resolveListingId();
    const dbPhotoCount = activeListingId
      ? await refreshSavedPhotoCount(activeListingId)
      : 0;

    logListingImageValidationDebug({
      listingId: activeListingId,
      savedImageCount: dbPhotoCount,
      localPhotoCount: savedPhotoCount,
      currentStep: step,
    });

    for (let s = 1; s <= TOTAL_STEPS; s++) {
      const err = validateWizardStep(s, forSubmission, dbPhotoCount);
      if (err) return { step: s, error: err };
    }
    return null;
  }

  function validateStep(forSubmission = false): string | null {
    return validateWizardStep(step, forSubmission, savedPhotoCount);
  }

  /** Background draft persist — updates saveStatus only, never navBusy / Next. */
  function persistDraftInBackground(resumeStep?: number) {
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }
    if (resumeStep != null) {
      stepRef.current = resumeStep;
      const id = resolveListingId();
      if (id) writeSessionWizardStep(id, resumeStep);
    }
    if (!resolveListingId()) {
      // Early-create effect will mint the draft; keep dirty so it flushes after.
      if (!formDirtyRef.current) {
        formDirtyRef.current = true;
        setFormDirty(true);
      }
      return;
    }
    setSaveStatus("saving");
    void (async () => {
      try {
        const result = await saveDraftSerialized(resolveListingId());
        if (result.error) {
          setSaveStatus("error");
          return;
        }
        if (result.listingId) {
          persistListingId(result.listingId);
          clearFormDirty();
          markDraftSaved();
        } else {
          setSaveStatus("error");
        }
      } catch {
        setSaveStatus("error");
      }
    })();
  }

  function ensureDraft(onDone: (id: string) => void) {
    if (navBusy) return;
    setNavBusy(true);
    setSaveStatus("saving");
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }
    const activeListingId = resolveListingId();
    const stuckGuard = window.setTimeout(() => {
      setNavBusy(false);
      setSaveStatus("error");
      setError("saveTimeout");
    }, NAV_BUSY_UNLOCK_MS);
    void (async () => {
      try {
        const result = await saveDraftSerialized(activeListingId);
        if (result.error) {
          stepRef.current = step;
          setError(result.error);
          setSaveStatus("error");
          return;
        }
        if (result.listingId) {
          persistListingId(result.listingId);
          void refreshSavedPhotoCount(result.listingId);
          clearFormDirty();
          markDraftSaved();
          onDone(result.listingId);
        } else {
          stepRef.current = step;
          setError("saveFailed");
          setSaveStatus("error");
        }
      } catch {
        stepRef.current = step;
        setError("saveFailed");
        setSaveStatus("error");
      } finally {
        window.clearTimeout(stuckGuard);
        setNavBusy(false);
      }
    })();
  }

  function advanceToStep(target: number) {
    const clamped = Math.min(Math.max(target, 1), TOTAL_STEPS);
    goToStep(clamped, "next");
    const phase = phaseIdForWizardStep(clamped);
    if (!seenPhaseIntros.has(phase)) {
      setActivePhaseIntro(phase);
    }
  }

  function advanceAmenitiesStep() {
    // Optional step: always advance immediately. Never gate on navBusy / save queue.
    if (navBusyRef.current) setNavBusy(false);
    setError(null);
    const nextStep = Math.min(AMENITIES_STEP + 1, TOTAL_STEPS);
    advanceToStep(nextStep);
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }
    setSaveStatus("saving");
    void (async () => {
      try {
        let activeId = resolveListingId();
        if (!activeId) {
          const created = await saveDraftSerialized(null);
          if (created.error || !created.listingId) {
            setSaveStatus("error");
            return;
          }
          activeId = created.listingId;
          persistListingId(activeId);
        }

        const amenityResult = await saveOwnerListingAmenities(
          activeId,
          selectedAmenityKeysRef.current
        );
        if ("error" in amenityResult && amenityResult.error) {
          console.warn("[wizard] amenities save", amenityResult.error);
          setSaveStatus("error");
          return;
        }

        writeSessionWizardStep(activeId, nextStep);
        void saveDraftSerialized(activeId).then((resumeSave) => {
          if (resumeSave.error) {
            console.warn("[wizard] amenities resume save", resumeSave.error);
          }
        });
        clearFormDirty();
        markDraftSaved();
      } catch (err) {
        console.warn("[wizard] amenities background save", err);
        setSaveStatus("error");
      }
    })();
  }

  function next() {
    // Amenities first — must not wait on navBusy from a prior ensureDraft / hung save.
    if (step === AMENITIES_STEP) {
      advanceAmenitiesStep();
      return;
    }

    if (navBusy) return;

    if (step === PHOTOS_STEP && resolveListingId()) {
      if (photosUploadBusy) {
        setError("waitPhotoUpload");
        return;
      }
      const activeListingId = resolveListingId();
      setNavBusy(true);
      setSaveStatus("saving");
      void (async () => {
        try {
          const dbPhotoCount = await refreshSavedPhotoCount(activeListingId!);
          const err = validateWizardStep(PHOTOS_STEP, false, dbPhotoCount);
          if (err) {
            setError(err);
            setSaveStatus("error");
            return;
          }
          setError(null);
          // Persist destination as last visited before save flush.
          stepRef.current = CONTACT_STEP;
          writeSessionWizardStep(activeListingId!, CONTACT_STEP);
          const result = await saveDraftSerialized(activeListingId);
          if (result.error) {
            stepRef.current = PHOTOS_STEP;
            writeSessionWizardStep(activeListingId!, PHOTOS_STEP);
            setError(result.error);
            setSaveStatus("error");
            return;
          }
          clearFormDirty();
          markDraftSaved();
          advanceToStep(CONTACT_STEP);
        } catch {
          stepRef.current = PHOTOS_STEP;
          setError("saveFailed");
          setSaveStatus("error");
        } finally {
          setNavBusy(false);
        }
      })();
      return;
    }

    const err = validateStep(false);
    if (err) {
      setError(err);
      return;
    }
    setError(null);

    // Capacity + title (and earlier steps): advance immediately; persist in background.
    // Do not gate Next on the save queue — autosave / early-create can leave it busy.
    if (step >= 1 && step <= TITLE_STEP) {
      const nextStep = Math.min(step + 1, TOTAL_STEPS);
      advanceToStep(nextStep);
      persistDraftInBackground(nextStep);
      return;
    }

    // Pricing still benefits from a blocking save (registry / prices), with unlock timeout.
    if (step === PRICING_STEP) {
      const nextStep = Math.min(step + 1, TOTAL_STEPS);
      stepRef.current = nextStep;
      const existingId = resolveListingId();
      if (existingId) writeSessionWizardStep(existingId, nextStep);
      ensureDraft(() => advanceToStep(nextStep));
      return;
    }

    if (step >= PHOTOS_STEP && resolveListingId()) {
      const activeListingId = resolveListingId();
      const nextStep = Math.min(step + 1, TOTAL_STEPS);
      setNavBusy(true);
      setSaveStatus("saving");
      void (async () => {
        try {
          await refreshSavedPhotoCount();
          stepRef.current = nextStep;
          writeSessionWizardStep(activeListingId!, nextStep);
          const result = await saveDraftSerialized(activeListingId);
          if (result.error) {
            stepRef.current = step;
            writeSessionWizardStep(activeListingId!, step);
            setError(result.error);
            setSaveStatus("error");
            return;
          }
          clearFormDirty();
          markDraftSaved();
          advanceToStep(nextStep);
        } catch {
          stepRef.current = step;
          writeSessionWizardStep(activeListingId!, step);
          setError("saveFailed");
          setSaveStatus("error");
        } finally {
          setNavBusy(false);
        }
      })();
      return;
    }
    advanceToStep(Math.min(step + 1, TOTAL_STEPS));
  }

  function back() {
    // Always allow step/intro navigation — never gate on autosave.
    setError(null);
    if (activePhaseIntro) {
      // Leave intro without marking seen — returning later can show it again.
      setActivePhaseIntro(null);
      if (step > 1) {
        const nextStep = step - 1;
        goToStep(nextStep, "back");
        if (resolveListingId() && (nextStep >= PHOTOS_STEP || step >= PHOTOS_STEP)) {
          void refreshSavedPhotoCount();
        }
      }
      return;
    }
    const nextStep = Math.max(step - 1, 1);
    goToStep(nextStep, "back");
    if (resolveListingId() && (nextStep >= PHOTOS_STEP || step >= PHOTOS_STEP)) {
      void refreshSavedPhotoCount();
    }
  }

  function handleShellNext() {
    if (activePhaseIntro) {
      dismissPhaseIntro();
      return;
    }
    if (returnToReview && step !== REVIEW_STEP) {
      void saveAndReturnToReview();
      return;
    }
    if (step < TOTAL_STEPS) next();
    else submit();
  }

  function handleContinueNormallyFromFix() {
    setReturnToReviewMode(false);
    if (step < TOTAL_STEPS) next();
  }

  async function saveAndReturnToReview() {
    if (navBusy) return;
    // From review-fix, require publish-level checks for location (address + pin).
    const forSubmission = step === 3 || step === REVIEW_STEP;
    const err = validateWizardStep(step, forSubmission, savedPhotoCount);
    if (err) {
      setError(err);
      return;
    }
    if (step === PHOTOS_STEP && photosUploadBusy) {
      setError("waitPhotoUpload");
      return;
    }
    setNavBusy(true);
    setSaveStatus("saving");
    setError(null);
    try {
      if (step === PHOTOS_STEP) {
        const activeListingId = resolveListingId();
        const dbPhotoCount = activeListingId
          ? await refreshSavedPhotoCount(activeListingId)
          : 0;
        const photoErr = validateWizardStep(PHOTOS_STEP, true, dbPhotoCount);
        if (photoErr) {
          setError(photoErr);
          setSaveStatus("error");
          return;
        }
      }
      stepRef.current = REVIEW_STEP;
      const activeListingId = resolveListingId();
      if (activeListingId) writeSessionWizardStep(activeListingId, REVIEW_STEP);
      const result = await saveDraftSerialized(activeListingId);
      if (result.error) {
        stepRef.current = step;
        if (activeListingId) writeSessionWizardStep(activeListingId, step);
        setError(result.error);
        setSaveStatus("error");
        return;
      }
      if (result.listingId) persistListingId(result.listingId);
      if (step === AMENITIES_STEP && result.listingId) {
        const amenityResult = await saveOwnerListingAmenities(
          result.listingId,
          selectedAmenityKeysRef.current
        );
        if ("error" in amenityResult && amenityResult.error) {
          setError(amenityResult.error);
          setSaveStatus("error");
          return;
        }
      }
      clearFormDirty();
      markDraftSaved();
      clearReturnToReviewAndGoReview();
    } catch {
      stepRef.current = step;
      setError("saveFailed");
      setSaveStatus("error");
    } finally {
      setNavBusy(false);
    }
  }

  async function flushSaveDraftForExit(): Promise<boolean> {
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }
    setSaveStatus("saving");
    const activeListingId = resolveListingId();
    const result = await saveDraftSerialized(activeListingId);
    if (result.error || !result.listingId) {
      setError(result.error ?? "saveFailed");
      setSaveStatus("error");
      return false;
    }
    persistListingId(result.listingId);
    const amenityResult = await saveOwnerListingAmenities(
      result.listingId,
      selectedAmenityKeysRef.current
    );
    if ("error" in amenityResult && amenityResult.error) {
      setError(amenityResult.error);
      setSaveStatus("error");
      return false;
    }
    clearFormDirty();
    markDraftSaved();
    return true;
  }

  function saveDraft() {
    // Soft-save + exit: no step validation; leave wizard on success.
    if (navBusy) return;
    setError(null);
    setSuccess(null);
    setNavBusy(true);
    void (async () => {
      let leftWizard = false;
      try {
        const ok = await flushSaveDraftForExit();
        if (!ok) return;
        leftWizard = true;
        window.location.assign("/dashboard/listings?draftSaved=1");
      } catch {
        setError("saveFailed");
        setSaveStatus("error");
      } finally {
        if (!leftWizard) setNavBusy(false);
      }
    })();
  }

  function handleLogoClick() {
    if (navBusy) return;
    if (!formDirtyRef.current && saveStatus !== "saving") {
      window.location.assign("/");
      return;
    }
    setLeaveModalOpen(true);
  }

  function handleLeaveSaveAndExit() {
    if (navBusy) return;
    setNavBusy(true);
    setError(null);
    void (async () => {
      try {
        const ok = await flushSaveDraftForExit();
        if (!ok) {
          setLeaveModalOpen(true);
          return;
        }
        setLeaveModalOpen(false);
        window.location.assign("/");
      } catch {
        setError("saveFailed");
        setSaveStatus("error");
      } finally {
        setNavBusy(false);
      }
    })();
  }

  function handleLeaveWithoutSave() {
    setLeaveModalOpen(false);
    window.location.assign("/");
  }

  function submit() {
    const activeListingId = resolveListingId();
    if (!activeListingId) {
      setError("saveBeforePreview");
      return;
    }
    if (navBusy) return;

    setNavBusy(true);
    void (async () => {
      try {
        const invalid = await findFirstInvalidStep(true);
        if (invalid) {
          enterFixFromReview(invalid.step);
          setError(invalid.error);
          return;
        }

        const result = await submitPortalListingForReview(activeListingId, buildFormData());
        if (result?.error) {
          const dbPhotoCount = await refreshSavedPhotoCount();
          logListingImageValidationDebug({
            listingId: activeListingId,
            savedImageCount: dbPhotoCount,
            localPhotoCount: savedPhotoCount,
            currentStep: step,
          });
          const mappedStep = mapErrorToStep(result.error);
          if (mappedStep) enterFixFromReview(mappedStep);
          setError(result.error);
        }
      } catch {
        setError("submitFailed");
      } finally {
        setNavBusy(false);
      }
    })();
  }

  const displayPrice = (() => {
    if (supportsShortTerm) {
      const n = Number(pricePerNight);
      return Number.isFinite(n) && n > 1 ? n : null;
    }
    const n = Number(priceMonthly);
    return Number.isFinite(n) && n > 1 ? n : null;
  })();

  const completionPercent = useMemo(() => {
    const filled = [
      Boolean(rentalTypeChoice),
      Boolean(propertyType),
      Boolean(city.trim()),
      Boolean(title.trim()),
      displayPrice != null,
      savedPhotoCount >= 1,
      Boolean(contactName.trim() && (contactPhone.trim() || contactEmail.trim())),
    ].filter(Boolean).length;
    return Math.round((filled / 7) * 100);
  }, [
    rentalTypeChoice,
    propertyType,
    city,
    title,
    displayPrice,
    savedPhotoCount,
    contactName,
    contactPhone,
    contactEmail,
  ]);

  const rentalModeLabel =
    MVP_LISTING_TYPE_OPTIONS.find((o) => o.value === rentalTypeChoice)?.label ?? "";

  const previewAside = (
    <div className="rounded-2xl border border-border bg-sand/30 p-4">
      <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted">
        {t("nav.preview")}
      </p>
      <p className="mt-2 font-display text-lg font-semibold text-charcoal">
        {title.trim() || t("nav.newListing")}
      </p>
      <p className="mt-1 text-sm text-muted">
        {[city.trim(), area.trim()].filter(Boolean).join(" · ") ||
          tFields("previewLocationFallback")}
      </p>
      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between gap-2">
          <dt className="text-muted">{tFields("previewRental")}</dt>
          <dd className="text-right font-medium text-charcoal">{rentalModeLabel}</dd>
        </div>
        {displayPrice != null && (
          <div className="flex justify-between gap-2">
            <dt className="text-muted">{tFields("previewPrice")}</dt>
            <dd className="text-right font-medium text-charcoal">
              €{displayPrice}
              {supportsShortTerm
                ? tFields("previewPerNight")
                : tFields("previewPerMonth")}
            </dd>
          </div>
        )}
        <div className="flex justify-between gap-2">
          <dt className="text-muted">{tFields("previewSpace")}</dt>
          <dd className="text-right font-medium text-charcoal">
            {tFields("previewSpaceValue", {
              bedrooms: bedrooms || "—",
              guests: maxGuests || "—",
            })}
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted">{tFields("previewPhotos")}</dt>
          <dd className="text-right font-medium text-charcoal">{savedPhotoCount}</dd>
        </div>
        {selectedAmenityKeys.length > 0 && (
          <div className="flex justify-between gap-2">
            <dt className="text-muted">{tFields("previewAmenities")}</dt>
            <dd className="text-right font-medium text-charcoal">
              {selectedAmenityKeys.length}
            </dd>
          </div>
        )}
      </dl>
      <div className="mt-5">
        <div className="flex items-center justify-between text-xs text-muted">
          <span>{tFields("previewCompletion")}</span>
          <span className="font-medium text-charcoal">{completionPercent}%</span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-border/80">
          <div
            className="h-full rounded-full bg-gold transition-[width] duration-300"
            style={{ width: `${completionPercent}%` }}
          />
        </div>
      </div>
    </div>
  );

  // Explicit nav/submit only — background autosave uses saveStatus in the header, not busy.
  // Amenities never blocks the footer (optional step; saves run in background).
  const wizardBusy = step === AMENITIES_STEP ? false : navBusy;
  const showingPhaseIntro = activePhaseIntro != null;
  const photoRooms = useMemo(
    () =>
      getSuggestPhotoRooms(
        {
          bedrooms: Math.max(0, parseInt(bedrooms, 10) || 0),
          bathrooms: Math.max(0, parseInt(bathrooms, 10) || 0),
        },
        (key) => tPhotoRooms(key as Parameters<typeof tPhotoRooms>[0])
      ),
    [bedrooms, bathrooms, tPhotoRooms]
  );
  // Keep Next label stable during autosave; only gate on validation / photo upload / review readiness.
  // wizardBusy still disables Next via shell `busy` (explicit save / transition) — not Back.
  const nextDisabled = showingPhaseIntro
    ? false
    : step < TOTAL_STEPS
      ? (step === PHOTOS_STEP && photosUploadBusy) ||
        (step === DECLARATIONS_STEP && !allDeclarationsChecked)
      : !allDeclarationsChecked ||
        !isReviewReady(
          parsePortalListingFields(buildFormData()),
          savedPhotoCount,
          needsAma,
          ownerDeclarationAccepted,
          registryDeclarationAccepted,
          platformDeclarationAccepted,
          taxDeclarationAccepted,
          authorityDeclarationAccepted,
          termsPrivacyAccepted,
          listingPhoneReady,
          {
            photosHydrated: draftPhotosHydrated,
            trustLinksCount: externalLinks.length,
          }
        );

  const nextLabel =
    showingPhaseIntro
      ? t("nav.next")
      : returnToReview && step !== REVIEW_STEP
        ? t("nav.saveReturnReview")
        : step < TOTAL_STEPS
          ? t("nav.next")
          : t("nav.submitForReview");

  const nextHelper =
    !showingPhaseIntro && step === REVIEW_STEP && nextDisabled
      ? t("nav.reviewIncompleteHint")
      : null;
  return (
    <CreateListingWizardShell
      stepIndex={step - 1}
      stepCount={TOTAL_STEPS}
      stepLabel={t(`steps.${STEP_KEYS[step - 1]}`)}
      stepHint={
        showingPhaseIntro ? null : tFields(STEP_HINT_KEYS[step - 1])
      }
      phaseLabel={t(`phases.${STEP_PHASE_KEYS[step - 1]}`)}
      saveStatus={saveStatus}
      error={translateWizardError(error)}
      aside={showingPhaseIntro ? undefined : previewAside}
      onBack={step > 1 || showingPhaseIntro ? back : undefined}
      onNext={handleShellNext}
      onSecondaryNext={
        returnToReview && !showingPhaseIntro && step !== REVIEW_STEP
          ? handleContinueNormallyFromFix
          : undefined
      }
      secondaryNextLabel={
        returnToReview && !showingPhaseIntro && step !== REVIEW_STEP
          ? t("nav.continueNormally")
          : undefined
      }
      onSaveAndExit={saveDraft}
      onLogoClick={handleLogoClick}
      nextLabel={nextLabel}
      nextDisabled={nextDisabled}
      nextHelper={nextHelper}
      showBack={step > 1 || showingPhaseIntro}
      isLastStep={!showingPhaseIntro && step === TOTAL_STEPS && !returnToReview}
      busy={wizardBusy}
      phaseIntroMode={showingPhaseIntro}
      fixModeBanner={
        returnToReview && !showingPhaseIntro && step !== REVIEW_STEP
          ? t("nav.fixModeBanner")
          : null
      }
    >
      <div
        ref={wizardTopRef}
        onKeyDown={(e) => {
          if ((step === DECLARATIONS_STEP || step === TRUST_LINKS_STEP || step === REVIEW_STEP) && e.key === "Enter") {
            e.preventDefault();
          }
        }}
      >
        {showingPhaseIntro && activePhaseIntro ? (
          <WizardPhaseIntro intro={WIZARD_PHASE_INTROS[activePhaseIntro]} />
        ) : null}

        {!showingPhaseIntro && success && <p className="mb-4 text-sm text-teal">{success}</p>}

        {!showingPhaseIntro && step === 1 && (
          <div>
            <p className="text-sm text-muted">{tFields("rentalTypeHint")}</p>

            <div className="mt-6 grid gap-4">
              {MVP_LISTING_TYPE_OPTIONS.map((opt) => (
                <WizardChoiceCard
                  key={opt.value}
                  selected={rentalTypeChoice === opt.value}
                  title={opt.label}
                  description={`${opt.description} ${opt.helper}`}
                  onSelect={() => {
                    setRentalTypeChoice(opt.value);
                    markFormDirty();
                    setError(null);
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {!showingPhaseIntro && step === 2 && (
          <div>
            {renderStepHeading(tFields("headingPropertyType"))}
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              {PROPERTY_TYPES.map((pt) => (
                <WizardChoiceCard
                  key={pt.value}
                  selected={propertyType === pt.value}
                  title={tPropertyTypes(pt.value)}
                  description={tPropertyTypes(`blurbs.${pt.value}`)}
                  onSelect={() => {
                    setPropertyType(pt.value);
                    if (pt.value === "studio") setBedrooms("0");
                    markFormDirty();
                    setError(null);
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {!showingPhaseIntro && step === 3 && (
          <div className="space-y-4">
            {renderStepHeading(tFields("headingLocation"))}
            <label className="block">
              <span className="text-xs text-muted uppercase">{tFields("city")}</span>
              <ListingCityField
                value={city}
                onChange={(nextCity) => {
                  markFormDirty();
                  setCity(nextCity);
                  setCityDisplayName(nextCity);
                  setAddressPostalCode("");
                  setArea("");
                  setAreaDisplayName("");
                  setAreaLockedByUser(false);
                  setAddressStreet("");
                  setAddressSearch("");
                  setAddressNumber("");
                  setLocationConfirmedByOwner(false);
                }}
                onSelectLocation={(loc) => {
                  markFormDirty();
                  const cityName = (loc.city || loc.label).trim();
                  setCity(cityName);
                  setCityDisplayName(cityName);
                  setArea("");
                  setAreaDisplayName("");
                  setAreaLockedByUser(false);
                  setAddressPostalCode("");
                  setAddressStreet("");
                  setAddressSearch("");
                  setAddressNumber("");
                  setLocationConfirmedByOwner(false);
                  void fetch(`/api/geocode/city?name=${encodeURIComponent(cityName)}`)
                    .then((r) => r.json())
                    .then((data) => {
                      const result = data.result;
                      if (!result) return;
                      setLatitude(result.lat);
                      setLongitude(result.lng);
                      setSuggestedLat(result.lat);
                      setSuggestedLng(result.lng);
                      setFormattedAddress(result.formattedAddress);
                      setProviderPlaceId(result.placeId);
                    });
                }}
                inputClassName={inputClass}
                required
              />
            </label>
            {cityHasSubAreas(city) ? (
              <label className="block">
                <span className="text-xs text-muted uppercase">
                  {tFields("areaLabelOptional")}{" "}
                  <span className="normal-case text-muted/80">{tFields("optionalSuffix")}</span>
                </span>
                <ListingAreaField
                  city={city}
                  value={area}
                  onChange={(nextArea) => {
                    markFormDirty();
                    setArea(nextArea);
                    setAreaDisplayName(nextArea);
                    setAreaLockedByUser(true);
                    setAddressStreet("");
                    setAddressSearch("");
                    setAddressNumber("");
                    setAddressPostalCode("");
                    setLocationConfirmedByOwner(false);
                  }}
                  onSelectLocation={(loc) => {
                    markFormDirty();
                    const areaName = (loc.area ?? loc.label).trim();
                    setArea(areaName);
                    setAreaDisplayName(areaName);
                    setAreaLockedByUser(true);
                    setAddressStreet("");
                    setAddressSearch("");
                    setAddressNumber("");
                    setAddressPostalCode("");
                    setLocationConfirmedByOwner(false);
                    void fetch(
                      `/api/geocode/autocomplete?q=${encodeURIComponent(areaName)}&city=${encodeURIComponent(city)}&mode=full`
                    )
                      .then((r) => r.json())
                      .then((data) => {
                        const result = (data.suggestions ?? [])[0];
                        if (!result) return;
                        setLatitude(result.lat);
                        setLongitude(result.lng);
                        setSuggestedLat(result.lat);
                        setSuggestedLng(result.lng);
                        setFormattedAddress(result.formattedAddress);
                        setProviderPlaceId(result.placeId);
                      });
                  }}
                  inputClassName={inputClass}
                />
                <span className="mt-1 block text-[11px] text-muted">
                  {(() => {
                    const examples = getCityAreaExamples(city, 2);
                    return examples.length >= 2
                      ? tFields("areaHintCity", {
                          city: city.trim(),
                          examples: examples.join(", "),
                        })
                      : examples.length === 1
                        ? tFields("areaHintCityOne", {
                            city: city.trim(),
                            example: examples[0],
                          })
                        : tFields("areaHintCityOnly", { city: city.trim() });
                  })()}
                </span>
              </label>
            ) : city.trim() ? (
              <p className="rounded-lg border border-border/60 bg-sand/30 px-3 py-2 text-[11px] text-muted">
                {tFields.rich("cityNoAreaHint", {
                  city: city.trim(),
                  b: (chunks) => <span className="font-medium text-charcoal">{chunks}</span>,
                })}
              </p>
            ) : null}

            <div className="rounded-2xl border border-border bg-sand/25 p-5 sm:p-6">
              <p className="font-display text-base font-semibold text-charcoal">
                {tFields("propertyLocationTitle")}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">
                {tFields("propertyLocationBody")}
              </p>
              <div className="mt-5">
                <PropertyAddressLocationSection
                  state={locationState()}
                  onChange={patchLocationState}
                  inputClassName={inputClass}
                  onCityChange={(nextCity) => {
                    markFormDirty();
                    setCity(nextCity);
                    setCityDisplayName(nextCity);
                  }}
                  onAreaChange={(nextArea) => {
                    markFormDirty();
                    setArea(nextArea);
                    setAreaDisplayName(nextArea);
                  }}
                />
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs text-muted uppercase">{tFields("addressFloor")}</span>
                  <input
                    value={addressFloor}
                    onChange={(e) => {
                      setAddressFloor(e.target.value);
                      markFormDirty();
                    }}
                    className={inputClass}
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-muted uppercase">{tFields("unit")}</span>
                  <input
                    value={addressUnit}
                    onChange={(e) => {
                      setAddressUnit(e.target.value);
                      markFormDirty();
                    }}
                    placeholder={tFields("unitPlaceholder")}
                    className={inputClass}
                  />
                  <span className="mt-1 block text-[10px] text-muted">
                    {tFields("unitHint")}
                  </span>
                </label>
              </div>
            </div>

            <div className="rounded-2xl border border-border/80 bg-white p-5 sm:p-6">
              <p className="font-display text-base font-semibold text-charcoal">
                {tFields("addressVisibilityTitle")}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">
                {tFields("addressVisibilityBody")}
              </p>
              <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-sand/20 px-4 py-3.5">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 shrink-0 accent-[var(--gold)]"
                  checked={locationConfirmedByOwner}
                  onChange={(e) => {
                    const on = e.target.checked;
                    setLocationConfirmedByOwner(on);
                    setLocationConfirmedAt(on ? new Date().toISOString() : null);
                    markFormDirty();
                    setError(null);
                  }}
                />
                <span className="text-sm leading-relaxed text-charcoal">
                  <span className="font-medium">
                    {tFields("addressPublicConfirm")}
                  </span>
                  <span className="mt-1 block text-xs text-muted">
                    {tFields("addressPublicConfirmHint")}
                  </span>
                </span>
              </label>
              {!locationConfirmedByOwner && (latitude != null || addressStreet.trim()) && (
                <p className="mt-3 text-xs text-muted">
                  {tFields("addressPrivateNote")}
                </p>
              )}
            </div>
          </div>
        )}

        {!showingPhaseIntro && step === 4 && (
          <div className="space-y-4">
            {renderStepHeading(tFields("headingCapacity"))}
            <WizardCounter
              label={tFields("maxGuests")}
              value={Math.max(1, parseInt(maxGuests, 10) || 1)}
              min={1}
              max={30}
              onChange={(n) => {
                setMaxGuests(String(n));
                markFormDirty();
              }}
            />
            <WizardCounter
              label={tFields("bedrooms")}
              value={Math.max(0, parseInt(bedrooms, 10) || 0)}
              min={0}
              max={20}
              onChange={(n) => {
                setBedrooms(String(n));
                markFormDirty();
              }}
            />
            <WizardCounter
              label={tFields("bathrooms")}
              value={Math.max(0, parseInt(bathrooms, 10) || 0)}
              min={0}
              max={20}
              onChange={(n) => {
                setBathrooms(String(n));
                markFormDirty();
              }}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs text-muted uppercase">{tFields("sqm")}</span>
                <input
                  type="number"
                  min={1}
                  required
                  value={sqm}
                  onChange={(e) => {
                    setSqm(e.target.value);
                    markFormDirty();
                  }}
                  className={inputClass}
                />
              </label>
              <label className="block">
                <span className="text-xs text-muted uppercase">{tFields("floor")}</span>
                <input
                  type="number"
                  min={0}
                  value={floor}
                  onChange={(e) => {
                    setFloor(e.target.value);
                    markFormDirty();
                  }}
                  placeholder={tFields("floorPlaceholder")}
                  className={inputClass}
                />
              </label>
            </div>
            <p className="text-[11px] text-muted">{tFields("studioHint")}</p>
          </div>
        )}

        {!showingPhaseIntro && step === 5 && (
          <div className="space-y-4">
            {renderStepHeading(tFields("headingTitleDesc"))}
            <label className="block">
              <span className="text-xs text-muted uppercase">{tFields("title")}</span>
              <input
                value={title}
                onChange={(e) => {
                  const nextTitle = e.target.value;
                  setTitle(nextTitle);
                  markFormDirty();
                  const trimmed = nextTitle.trim();
                  if (!trimmed) {
                    if (error === LISTING_TITLE_MIN_ERROR) setError(null);
                    return;
                  }
                  const lengthError = listingTitleValidationError(nextTitle, {
                    requireNonEmpty: false,
                  });
                  setError(lengthError === LISTING_TITLE_MIN_ERROR ? LISTING_TITLE_MIN_ERROR : null);
                }}
                className={inputClass}
              />
              <span className="mt-1 block text-[11px] text-muted">
                {tFields("titleMinChars", { count: MIN_LISTING_TITLE_LENGTH })}
              </span>
            </label>
            <label className="block">
              <span className="text-xs text-muted uppercase">{tFields("description")}</span>
              <textarea
                ref={descriptionTextareaRef}
                rows={3}
                value={description}
                onChange={(e) => {
                  const next = e.target.value;
                  setDescription(next);
                  markFormDirty();
                  const lengthError = listingDescriptionValidationError(next, {
                    forSubmission: false,
                  });
                  if (lengthError === LISTING_DESCRIPTION_MAX_ERROR) {
                    setError(LISTING_DESCRIPTION_MAX_ERROR);
                  } else if (error === LISTING_DESCRIPTION_MAX_ERROR) {
                    setError(null);
                  }
                }}
                className={`${inputClass} resize-none overflow-hidden`}
                style={{ maxHeight: DESCRIPTION_TEXTAREA_MAX_HEIGHT_PX }}
              />
              <span className="mt-1 flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5 text-[11px] text-muted">
                <span>
                  {tFields("descriptionMinChars", {
                    count: MIN_LISTING_DESCRIPTION_LENGTH,
                  })}
                </span>
                <span
                  className={
                    listingDescriptionGraphemeLength(description) >
                    MAX_LISTING_DESCRIPTION_LENGTH
                      ? "text-red-600"
                      : undefined
                  }
                >
                  {listingDescriptionGraphemeLength(description)} /{" "}
                  {MAX_LISTING_DESCRIPTION_LENGTH}
                </span>
              </span>
            </label>
          </div>
        )}

        {!showingPhaseIntro && step === AMENITIES_STEP && (
          <div className="space-y-4">
            {renderStepHeading(tFields("headingAmenities"))}
            <ListingWizardAmenitiesStep
              selectedKeys={selectedAmenityKeys}
              rentalMode={supportsMonthly ? "monthly" : "short_term"}
              onChange={(keys) => {
                setSelectedAmenityKeys(keys);
                markFormDirty();
                setError(null);
              }}
              onSkip={() => {
                advanceAmenitiesStep();
              }}
            />
          </div>
        )}

        {!showingPhaseIntro && step === PRICING_STEP && (
          <div className="space-y-4">
            {renderStepHeading(tFields("headingPricing"))}
            {supportsShortTerm && (
              <div className="space-y-4 rounded-xl border border-border bg-white/60 p-4">
                <p className="text-sm font-medium text-charcoal">
                  {tPricing("shortTermSection")}
                </p>
                <label className="block">
                  <span className="text-xs text-muted uppercase">
                    {tPricing("baseNightly")}
                  </span>
                  <input
                    type="number"
                    min={1}
                    value={pricePerNight}
                    onChange={(e) => {
                      setPricePerNight(e.target.value);
                      markFormDirty();
                    }}
                    className={inputClass}
                  />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-xs text-muted uppercase">
                      {tPricing("includedGuests")}
                    </span>
                    <input
                      type="number"
                      min={1}
                      value={includedGuests}
                      onChange={(e) => {
                        setIncludedGuests(e.target.value);
                        markFormDirty();
                      }}
                      className={inputClass}
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs text-muted uppercase">
                      {tPricing("extraGuestFee")}
                    </span>
                    <input
                      type="number"
                      min={0}
                      value={extraGuestFee}
                      onChange={(e) => {
                        setExtraGuestFee(e.target.value);
                        markFormDirty();
                      }}
                      className={inputClass}
                    />
                  </label>
                </div>
                <label className="block">
                  <span className="text-xs text-muted uppercase">
                    {tPricing("minStayNights")}
                  </span>
                  <select
                    value={shortMinStay}
                    onChange={(e) => {
                      setShortMinStay(e.target.value);
                      markFormDirty();
                    }}
                    className={inputClass}
                  >
                    <option value="">{tPricing("selectPlaceholder")}</option>
                    {SHORT_TERM_MIN_STAY_OPTIONS.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs text-muted uppercase">
                    {tPricing("availability")}
                  </span>
                  <select
                    value={availabilityStatus}
                    onChange={(e) => {
                      setAvailabilityStatus(e.target.value);
                      markFormDirty();
                    }}
                    className={inputClass}
                  >
                    {AVAIL_OPTS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.value === "available_now"
                          ? tPricing("availableNow")
                          : o.value === "from_month"
                            ? tPricing("fromSpecificMonth")
                            : tPricing("uponRequest")}
                      </option>
                    ))}
                  </select>
                </label>
                {availabilityStatus === "from_month" && (
                  <label className="block">
                    <span className="text-xs text-muted uppercase">
                      {tPricing("fromMonth")}
                    </span>
                    <input
                      value={availabilityNote}
                      onChange={(e) => {
                        setAvailabilityNote(e.target.value);
                        markFormDirty();
                      }}
                      placeholder={tPricing("fromMonthPlaceholder")}
                      className={inputClass}
                    />
                  </label>
                )}
                {pricePerNight && includedGuests && (
                  <p className="rounded-lg bg-sand/50 p-3 text-xs text-muted">
                    {tPricing("publicPreview", {
                      price: pricePerNight,
                      guests: includedGuests,
                    })}
                    {Number(extraGuestFee) > 0 &&
                      tPricing("publicPreviewExtra", { fee: extraGuestFee })}
                  </p>
                )}
                {needsAma && (
                  <ShortTermRegistryComplianceCard
                    legalRegistryType={legalRegistryType}
                    amaNumber={amaNumber}
                    onTypeChange={(type) => {
                      setLegalRegistryType(type);
                      markFormDirty();
                    }}
                    onNumberChange={(value) => {
                      setAmaNumber(value);
                      markFormDirty();
                    }}
                    inputClassName={inputClass}
                  />
                )}
              </div>
            )}
            {supportsMonthly && (
              <div className="space-y-4 rounded-xl border border-border bg-white/60 p-4">
                <p className="text-sm font-medium text-charcoal">
                  {tPricing("monthlySection")}
                </p>
                <MonthlyOccupancyPricingFields
                  value={monthlyOccupancy}
                  markDirty={markFormDirty}
                  onChange={(next) => {
                    setMonthlyOccupancy(next);
                    if (next.basePrice) setPriceMonthly(next.basePrice);
                    if (next.maxPeople) setMaxGuests(next.maxPeople);
                  }}
                  inputClassName={inputClass}
                />
                <label className="block">
                  <span className="text-xs text-muted uppercase">
                    {tPricing("monthlyMinStay")}
                  </span>
                  <select
                    value={monthlyMinStay}
                    onChange={(e) => {
                      setMonthlyMinStay(e.target.value);
                      markFormDirty();
                    }}
                    className={inputClass}
                  >
                    <option value="">{tPricing("monthlyMinStayDefault")}</option>
                    {MONTHLY_MIN_STAY_OPTIONS.filter((o) => !o.startsWith("1+")).map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </label>
                <fieldset>
                  <legend className="text-xs text-muted uppercase">
                    {tPricing("acceptsUnder60")}
                  </legend>
                  <div className="mt-2 flex gap-4 text-sm">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={acceptsUnder60}
                        onChange={() => {
                          setAcceptsUnder60(true);
                          markFormDirty();
                        }}
                      />{" "}
                      {tPricing("yes")}
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={!acceptsUnder60}
                        onChange={() => {
                          setAcceptsUnder60(false);
                          markFormDirty();
                        }}
                      />{" "}
                      {tPricing("no")}
                    </label>
                  </div>
                </fieldset>
                <label className="block">
                  <span className="text-xs text-muted uppercase">
                    {tPricing("monthlyTerms")}
                  </span>
                  <textarea
                    rows={3}
                    value={monthlyTerms}
                    onChange={(e) => {
                      setMonthlyTerms(e.target.value);
                      markFormDirty();
                    }}
                    placeholder={tPricing("monthlyTermsPlaceholder")}
                    className={inputClass}
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-muted uppercase">
                    {tPricing("availability")}
                  </span>
                  <select
                    value={availabilityStatus}
                    onChange={(e) => {
                      setAvailabilityStatus(e.target.value);
                      markFormDirty();
                    }}
                    className={inputClass}
                  >
                    {AVAIL_OPTS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.value === "available_now"
                          ? tPricing("availableNow")
                          : o.value === "from_month"
                            ? tPricing("fromSpecificMonth")
                            : tPricing("uponRequest")}
                      </option>
                    ))}
                  </select>
                </label>
                {availabilityStatus === "from_month" && (
                  <label className="block">
                    <span className="text-xs text-muted uppercase">
                      {tPricing("startMonth")}
                    </span>
                    <input
                      value={availabilityNote}
                      onChange={(e) => {
                        setAvailabilityNote(e.target.value);
                        markFormDirty();
                      }}
                      placeholder={tPricing("fromMonthPlaceholder")}
                      className={inputClass}
                    />
                  </label>
                )}
                {needsAma ? (
                  <ShortTermRegistryComplianceCard
                    legalRegistryType={legalRegistryType}
                    amaNumber={amaNumber}
                    onTypeChange={(type) => {
                      setLegalRegistryType(type);
                      markFormDirty();
                    }}
                    onNumberChange={(value) => {
                      setAmaNumber(value);
                      markFormDirty();
                    }}
                    inputClassName={inputClass}
                  />
                ) : (
                  <AadeGuideHelperCard variant="monthly" defaultTab="monthly" />
                )}
              </div>
            )}
          </div>
        )}

        {!showingPhaseIntro && step === PHOTOS_STEP && navBusy && (
          <div className="py-12 text-center">
            {renderStepHeading(tFields("headingPhotos"))}
            <p className="text-sm text-muted">{tFields("photosSavingDraft")}</p>
          </div>
        )}
        {!showingPhaseIntro && step === PHOTOS_STEP && resolveListingId() && !navBusy && (
          <ListingWizardPhotosStep
            listingId={resolveListingId()!}
            initialImages={draftImages}
            initialPhotoCount={savedPhotoCount}
            photosAlreadyHydrated={draftPhotosHydrated}
            stepHeadingRef={stepHeadingRef}
            onPhotoCountChange={handlePhotoCountChange}
            onUploadBusyChange={setPhotosUploadBusy}
            onImagesChange={(next) => {
              setDraftImages(next);
              setDraftPhotosHydrated(true);
              setSavedPhotoCount(next.filter((i) => i.media_type !== "video").length);
            }}
            rooms={photoRooms}
          />
        )}
        {!showingPhaseIntro && step === PHOTOS_STEP && !resolveListingId() && !navBusy && (
          <div className="py-8 text-center">
            {renderStepHeading(tFields("headingPhotos"))}
            <p className="text-sm text-muted">{tFields("photosStepFailed")}</p>
          </div>
        )}

        {!showingPhaseIntro && step === CONTACT_STEP && (
          <div className="space-y-4">
            {renderStepHeading(tFields("headingContact"))}
            <ListingWizardContactStep
              profile={profile}
              contactName={contactName}
              contactPhone={contactPhone}
              contactEmail={contactEmail}
              preferredContact={preferredContact}
              useProfileContact={useProfileContact}
              allowPhone={allowPhoneContact}
              allowWhatsApp={allowWhatsApp}
              allowViber={allowViber}
              allowMessage={allowMessage}
              whatsappUsePrimary={contactWhatsappUsePrimary}
              viberUsePrimary={contactViberUsePrimary}
              contactWhatsappPhone={contactWhatsappPhone}
              contactViberPhone={contactViberPhone}
              onContactNameChange={setContactName}
              onContactPhoneChange={setContactPhone}
              onContactEmailChange={setContactEmail}
              onPreferredContactChange={setPreferredContact}
              onUseProfileContactChange={setUseProfileContact}
              onAllowPhoneChange={setAllowPhoneContact}
              onAllowWhatsAppChange={setAllowWhatsApp}
              onAllowViberChange={setAllowViber}
              onAllowMessageChange={setAllowMessage}
              onWhatsappUsePrimaryChange={setContactWhatsappUsePrimary}
              onViberUsePrimaryChange={setContactViberUsePrimary}
              onContactWhatsappPhoneChange={setContactWhatsappPhone}
              onContactViberPhoneChange={setContactViberPhone}
            />
          </div>
        )}

        {!showingPhaseIntro && step === DECLARATIONS_STEP && (
          <ListingWizardDeclarationsStep
            needsRegistryDeclaration={needsAma}
            showMonthlyTaxHelper={supportsMonthly && !needsAma}
            ownerAccepted={ownerDeclarationAccepted}
            registryAccepted={registryDeclarationAccepted}
            platformAccepted={platformDeclarationAccepted}
            taxAccepted={taxDeclarationAccepted}
            authorityAccepted={authorityDeclarationAccepted}
            termsAccepted={termsPrivacyAccepted}
            onOwnerChange={setOwnerDeclarationAccepted}
            onRegistryChange={setRegistryDeclarationAccepted}
            onPlatformChange={setPlatformDeclarationAccepted}
            onTaxChange={setTaxDeclarationAccepted}
            onAuthorityChange={setAuthorityDeclarationAccepted}
            onTermsChange={setTermsPrivacyAccepted}
            allRequiredChecked={allDeclarationsChecked}
          />
        )}

        {!showingPhaseIntro && step === TRUST_LINKS_STEP && (
          <ListingWizardTrustLinksStep
            listingId={resolveListingId()}
            initialLinks={externalLinks}
          />
        )}

        {!showingPhaseIntro && step === REVIEW_STEP && (
          <ListingWizardReviewStep
            fields={parsePortalListingFields(buildFormData())}
            savedPhotoCount={savedPhotoCount}
            photosHydrated={draftPhotosHydrated}
            trustLinksCount={externalLinks.length}
            listingId={resolveListingId()}
            needsAma={needsAma}
            ownerDeclarationAccepted={ownerDeclarationAccepted}
            registryDeclarationAccepted={registryDeclarationAccepted}
            platformDeclarationAccepted={platformDeclarationAccepted}
            taxDeclarationAccepted={taxDeclarationAccepted}
            authorityDeclarationAccepted={authorityDeclarationAccepted}
            termsPrivacyAccepted={termsPrivacyAccepted}
            listingPhoneReady={listingPhoneReady}
            onGoToStep={(target) => {
              enterFixFromReview(target);
            }}
          />
        )}
      </div>
      <WizardLeaveConfirmModal
        open={leaveModalOpen}
        busy={navBusy}
        onClose={() => setLeaveModalOpen(false)}
        onSaveAndExit={handleLeaveSaveAndExit}
        onExitWithoutSave={handleLeaveWithoutSave}
      />
    </CreateListingWizardShell>
  );
}
