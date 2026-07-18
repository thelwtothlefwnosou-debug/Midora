"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
import { ShortTermRegistryComplianceCard } from "@/components/listings/wizard/ShortTermRegistryComplianceCard";
import {
  areWizardDeclarationsComplete,
  ListingWizardDeclarationsStep,
} from "@/components/listings/wizard/ListingWizardDeclarationsStep";
import {
  isReviewReady,
  ListingWizardReviewStep,
} from "@/components/listings/wizard/ListingWizardReviewStep";
import {
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
  MIN_LISTING_DESCRIPTION_LENGTH,
  MIN_LISTING_TITLE_LENGTH,
  resolveWizardArea,
  resolveWizardCity,
  isValidRegistryNumber,
} from "@/lib/listing-wizard-validation";
import {
  parsePortalListingFields,
  validatePortalListingFields,
  needsAmaForFields,
} from "@/lib/listing-portal-payload";
import { PROPERTY_TYPES, type Profile } from "@/lib/types";
import {
  generateMidoraVerificationCode,
  MONTHLY_MIN_STAY_OPTIONS,
  MVP_LISTING_TYPE_OPTIONS,
  SHORT_TERM_MIN_STAY_OPTIONS,
} from "@/lib/rental-types";
import { LISTING_AVAILABILITY_STATUS_OPTIONS as AVAIL_OPTS } from "@/lib/listing-availability-status";
import { hasCallablePhone, listingPhoneReadyForCalls } from "@/lib/listing-contact";
import {
  amenityLabel,
  normalizeAmenityKey,
  popularFilterAmenities,
} from "@/lib/amenities-catalog";
import {
  getOwnerListingAmenities,
  saveOwnerListingAmenities,
} from "@/lib/listing-amenities";
import { amenityIconForKey } from "@/lib/amenity-icons";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

const STEPS = [
  "Τύπος μίσθωσης",
  "Τύπος ακινήτου",
  "Τοποθεσία",
  "Χωρητικότητα",
  "Τίτλος & περιγραφή",
  "Παροχές",
  "Τιμή & διαθεσιμότητα",
  "Φωτογραφίες",
  "Επικοινωνία",
  "Δηλώσεις",
  "Έλεγχος πριν την υποβολή",
] as const;

const STEP_PHASES = [
  "Το ακίνητό σου",
  "Το ακίνητό σου",
  "Το ακίνητό σου",
  "Το ακίνητό σου",
  "Να ξεχωρίζει",
  "Να ξεχωρίζει",
  "Ολοκλήρωση",
  "Να ξεχωρίζει",
  "Ολοκλήρωση",
  "Ολοκλήρωση",
  "Ολοκλήρωση",
] as const;

const STEP_HINTS = [
  "Διάλεξε αν η αγγελία είναι βραχυχρόνια ή μηνιαία / μεσοπρόθεσμη.",
  "Τι είδους ακίνητο προσφέρεις;",
  "Πού βρίσκεται — πόλη, περιοχή και ακριβής θέση στον χάρτη.",
  "Πόσα άτομα φιλοξενεί και βασικά μεγέθη του χώρου.",
  "Ένας καθαρός τίτλος και μια περιγραφή που λέει τα σημαντικά.",
  "Επίλεξε παροχές που ισχύουν πραγματικά — μπορείς να τις συμπληρώσεις αργότερα.",
  "Όρισε τιμές, διαθεσιμότητα και στοιχεία καταχώρισης αν χρειάζεται.",
  "Ανέβασε τουλάχιστον μία φωτογραφία — η πρώτη γίνεται κύρια.",
  "Πώς θα επικοινωνούν μαζί σου οι ενδιαφερόμενοι.",
  "Αποδέχσου τις απαιτούμενες δηλώσεις για υποβολή.",
  "Έλεγξε όλα τα στοιχεία πριν υποβάλεις για έλεγχο.",
] as const;

const TOTAL_STEPS = STEPS.length;
const WIZARD_SCROLL_OFFSET = 112;
const WIZARD_DRAFT_STORAGE_KEY = "midora_new_listing_draft_id";
const AUTOSAVE_DEBOUNCE_MS = 800;
const AMENITIES_STEP = 6;
const PRICING_STEP = 7;
const PHOTOS_STEP = 8;
const CONTACT_STEP = 9;
const DECLARATIONS_STEP = 10;
const REVIEW_STEP = 11;

function clearWizardDraftSession(setListingId: (id: string | null) => void) {
  setListingId(null);
  try {
    sessionStorage.removeItem(WIZARD_DRAFT_STORAGE_KEY);
  } catch {
    // ignore storage errors
  }
}

const inputClass =
  "mt-1 w-full rounded-xl border border-border bg-sand/40 px-4 py-3 text-sm text-charcoal outline-none focus:border-gold/50";

type Props = {
  profile: Profile;
  email: string;
  initialListingId?: string | null;
};

type SaveStatus = "idle" | "saving" | "saved" | "error";

export function NewListingWizard({ profile, email, initialListingId = null }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [draftSaving, setDraftSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [listingId, setListingId] = useState<string | null>(initialListingId);
  const [savedPhotoCount, setSavedPhotoCount] = useState(0);
  const [photosUploadBusy, setPhotosUploadBusy] = useState(false);

  const wizardTopRef = useRef<HTMLDivElement>(null);
  const stepHeadingRef = useRef<HTMLHeadingElement>(null);
  const skipInitialScrollRef = useRef(true);
  const draftLoadedRef = useRef(false);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autosaveSkipRef = useRef(true);

  function resolveListingId(): string | null {
    return listingId;
  }

  function persistListingId(id: string) {
    setListingId(id);
    try {
      sessionStorage.setItem(WIZARD_DRAFT_STORAGE_KEY, id);
      window.history.replaceState(null, "", `/dashboard/listings/new?draft=${id}`);
    } catch {
      // ignore storage errors
    }
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
    if (listing.floor != null) setFloor(String(listing.floor));
    if (typeof listing.description === "string") setDescription(listing.description);
    if (listing.price_per_night != null) setPricePerNight(String(listing.price_per_night));
    if (listing.price_monthly != null) setPriceMonthly(String(listing.price_monthly));
    if (listing.included_guests != null) setIncludedGuests(String(listing.included_guests));
    if (listing.extra_guest_fee_per_night != null) {
      setExtraGuestFee(String(listing.extra_guest_fee_per_night));
    }
    if (listing.max_guests != null) setMaxGuests(String(listing.max_guests));
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
  const [floor, setFloor] = useState("");
  const [description, setDescription] = useState("");
  const [pricePerNight, setPricePerNight] = useState("");
  const [includedGuests, setIncludedGuests] = useState("2");
  const [extraGuestFee, setExtraGuestFee] = useState("0");
  const [maxGuests, setMaxGuests] = useState("2");
  const [shortMinStay, setShortMinStay] = useState("");
  const [priceMonthly, setPriceMonthly] = useState("");
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
  const [termsPrivacyAccepted, setTermsPrivacyAccepted] = useState(false);
  const [selectedAmenityKeys, setSelectedAmenityKeys] = useState<string[]>([]);
  const amenitiesHydratedForRef = useRef<string | null>(null);

  const popularAmenities = useMemo(
    () => popularFilterAmenities(supportsMonthly ? "monthly" : "short_term"),
    [supportsMonthly]
  );

  const needsAma =
    supportsShortTerm || (supportsMonthly && acceptsUnder60);

  const allDeclarationsChecked = areWizardDeclarationsComplete({
    needsRegistryDeclaration: needsAma,
    ownerAccepted: ownerDeclarationAccepted,
    registryAccepted: registryDeclarationAccepted,
    platformAccepted: platformDeclarationAccepted,
    termsAccepted: termsPrivacyAccepted,
  });
  const listingPhoneReady = listingPhoneReadyForCalls(
    contactPhone,
    allowPhoneContact,
    profile
  );

  const buildFormData = useCallback((): FormData => {
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
    fd.set("address_floor", addressFloor.trim());
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
    fd.set("floor", floor.trim());
    fd.set("description", description.trim());
    if (supportsShortTerm) {
      fd.set("price_per_night", pricePerNight);
      fd.set("included_guests", includedGuests);
      fd.set("extra_guest_fee_per_night", extraGuestFee);
      fd.set("max_guests", maxGuests);
      fd.set("short_min_stay_label", shortMinStay);
    }
    if (supportsMonthly) {
      fd.set("price_monthly", priceMonthly);
      if (monthlyMinStay) fd.set("monthly_min_stay_label", monthlyMinStay);
      if (monthlyTerms.trim()) fd.set("monthly_terms", monthlyTerms.trim());
      if (!supportsShortTerm) {
        fd.set("max_guests", maxGuests);
      }
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
    if (termsPrivacyAccepted) {
      fd.set("terms_privacy_accepted", "on");
    }
    fd.set("furnished", "on");
    fd.set("min_months", supportsShortTerm && !supportsMonthly ? "1" : "2");
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
    termsPrivacyAccepted,
  ]);

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
          clearWizardDraftSession(setListingId);
          window.history.replaceState(null, "", "/dashboard/listings/new");
          return;
        }
        if (!("listing" in result) || !result.listing) return;

        hydrateFromListing(result.listing as Record<string, unknown>);
        setSavedPhotoCount(result.photoCount ?? 0);
        setSaveStatus("saved");

        amenitiesHydratedForRef.current = draftId;
        const amenityRows = await getOwnerListingAmenities(draftId);
        setSelectedAmenityKeys(
          amenityRows
            .map((row) => normalizeAmenityKey(row.amenity_key))
            .filter(Boolean)
        );

        if ((result.photoCount ?? 0) >= MIN_LISTING_PHOTOS_FOR_REVIEW) {
          setStep(REVIEW_STEP);
        } else if ((result.photoCount ?? 0) > 0) {
          setStep(PHOTOS_STEP);
        }
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hydrate uses setters; load once per id
    []
  );

  useEffect(() => {
    if (!listingId || amenitiesHydratedForRef.current === listingId) return;
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
    if (draftLoadedRef.current) return;
    draftLoadedRef.current = true;

    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const fresh = params.get("fresh") === "1";
    const draftIdFromUrl = params.get("draft")?.trim() || null;
    const draftId = initialListingId ?? draftIdFromUrl;

    if (fresh) {
      clearWizardDraftSession(setListingId);
      window.history.replaceState(null, "", "/dashboard/listings/new");
      return;
    }

    // Resume only when explicitly requested via ?draft= or page initialListingId.
    // Otherwise always start a fresh wizard — drafts stay in "Τα ακίνητά μου".
    if (draftId) {
      loadDraftById(draftId);
      return;
    }

    clearWizardDraftSession(setListingId);
  }, [initialListingId, loadDraftById]);

  // Debounced autosave after draft exists (title / description / price / city).
  useEffect(() => {
    if (!listingId) return;
    if (autosaveSkipRef.current) {
      autosaveSkipRef.current = false;
      return;
    }
    if (draftSaving || pending) return;

    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => {
      const activeListingId = listingId;
      if (!activeListingId || draftSaving) return;
      setSaveStatus("saving");
      void (async () => {
        const result = await savePortalListingDraft(buildFormData(), activeListingId);
        if (result.error) {
          setSaveStatus("error");
          return;
        }
        setSaveStatus("saved");
      })();
    }, AUTOSAVE_DEBOUNCE_MS);

    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
        autosaveTimerRef.current = null;
      }
    };
  }, [
    listingId,
    title,
    description,
    pricePerNight,
    priceMonthly,
    city,
    draftSaving,
    pending,
    buildFormData,
  ]);

  function renderStepHeading(_heading: string, hint?: string) {
    // Shell already shows step title as h1 — keep a focus/scroll target + hint only.
    return (
      <div className="mb-5">
        <span ref={stepHeadingRef} tabIndex={-1} className="sr-only outline-none">
          {_heading}
        </span>
        <p className="text-sm text-muted">{hint ?? STEP_HINTS[step - 1]}</p>
      </div>
    );
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
    if (patch.locationConfirmedByOwner !== undefined) {
      setLocationConfirmedByOwner(patch.locationConfirmedByOwner);
    }
    if (patch.locationPinMovedManually !== undefined) {
      setLocationPinMovedManually(patch.locationPinMovedManually);
    }
    if (patch.locationConfirmedAt !== undefined) {
      setLocationConfirmedAt(patch.locationConfirmedAt);
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
        return "Επίλεξε τύπο μίσθωσης για να συνεχίσεις.";
      }
      return null;
    }
    if (targetStep === 2) {
      if (!propertyType) return "Επίλεξε τύπο ακινήτου για να συνεχίσεις.";
      return null;
    }
    if (targetStep === 3) {
      if (!city.trim()) return "Συμπλήρωσε την πόλη.";
      const effectiveArea = area.trim() || city.trim();
      const { city: canonicalCity } = resolveWizardCity(city);
      if (area.trim()) {
        const { mismatch } = resolveWizardArea(canonicalCity, area);
        if (mismatch) {
          return "Η περιοχή δεν ταιριάζει με την επιλεγμένη πόλη.";
        }
      } else if (!effectiveArea) {
        return "Συμπλήρωσε την πόλη.";
      }
      if (forSubmission) {
        if (!addressStreet.trim()) return "Συμπλήρωσε την οδό.";
        if (!addressNumber.trim()) return "Συμπλήρωσε τον αριθμό.";
        if (!addressPostalCode.trim()) return "Συμπλήρωσε τον ταχυδρομικό κώδικα.";
        if (latitude == null || longitude == null) {
          return "Ορίσε την ακριβή θέση του ακινήτου στον χάρτη για να συνεχίσεις.";
        }
      }
      return null;
    }
    if (targetStep === 4) {
      const guests = parseInt(maxGuests, 10);
      if (!Number.isFinite(guests) || guests < 1) {
        return "Ο μέγιστος αριθμός ατόμων πρέπει να είναι τουλάχιστον 1.";
      }
      const sqmNum = parseInt(sqm, 10);
      if (!Number.isFinite(sqmNum) || sqmNum <= 0) {
        return "Τα τετραγωνικά μέτρα πρέπει να είναι θετικός ακέραιος αριθμός.";
      }
      const beds = parseInt(bedrooms, 10);
      if (!Number.isFinite(beds) || beds < 0) {
        return "Τα υπνοδωμάτια πρέπει να είναι ακέραιος ≥ 0 (0 = στούντιο).";
      }
      const baths = parseInt(bathrooms, 10);
      if (!Number.isFinite(baths) || baths < 0) {
        return "Συμπλήρωσε τον αριθμό μπάνιων (0 αν δεν υπάρχει ξεχωριστό).";
      }
      const floorNum = parseInt(floor, 10);
      if (!Number.isFinite(floorNum) || floorNum < 0) {
        return "Συμπλήρωσε τον όροφο (0 = ισόγειο).";
      }
      return null;
    }
    if (targetStep === 5) {
      const t = title.trim();
      if (!t) return "Συμπλήρωσε τον τίτλο της αγγελίας.";
      if (forSubmission && t.length < MIN_LISTING_TITLE_LENGTH) {
        return `Ο τίτλος πρέπει να έχει τουλάχιστον ${MIN_LISTING_TITLE_LENGTH} χαρακτήρες.`;
      }
      const d = description.trim();
      if (!d) return "Συμπλήρωσε την περιγραφή.";
      if (forSubmission && d.length < MIN_LISTING_DESCRIPTION_LENGTH) {
        return `Η περιγραφή πρέπει να έχει τουλάχιστον ${MIN_LISTING_DESCRIPTION_LENGTH} χαρακτήρες.`;
      }
      return null;
    }
    if (targetStep === AMENITIES_STEP) {
      // Optional — always skippable.
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
        return "Ο αριθμός καταχώρισης δεν έχει έγκυρη μορφή.";
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
      if (!contactName.trim()) return "Συμπλήρωσε όνομα αγγελιοδότη.";
      if (!contactPhone.trim() && !contactEmail.trim()) {
        return "Συμπλήρωσε τηλέφωνο ή email επικοινωνίας.";
      }
      if (contactPhone.trim() && !hasCallablePhone(contactPhone)) {
        return "Συμπλήρωσε έγκυρο κινητό τηλέφωνο (Ελλάδα).";
      }
    }
    if (targetStep === DECLARATIONS_STEP) {
      if (!allDeclarationsChecked) {
        return "Επίλεξε όλες τις απαιτούμενες δηλώσεις για να συνεχίσεις.";
      }
    }
    if (targetStep === REVIEW_STEP && forSubmission) {
      const fields = parsePortalListingFields(buildFormData());
      if (
        !isReviewReady(
          fields,
          dbPhotoCount,
          needsAma,
          ownerDeclarationAccepted,
          registryDeclarationAccepted,
          platformDeclarationAccepted,
          termsPrivacyAccepted,
          listingPhoneReady
        )
      ) {
        return "Ολοκλήρωσε όλα τα υποχρεωτικά πεδία πριν την υποβολή.";
      }
    }
    return null;
  }

  function mapErrorToStep(errorMsg: string): number | null {
    const msg = errorMsg.toLowerCase();
    if (msg.includes("τύπο") && msg.includes("μίσθωσ")) return 1;
    if (msg.includes("τύπο") && msg.includes("ακινήτ")) return 2;
    if (
      msg.includes("πόλη") ||
      msg.includes("περιοχ") ||
      msg.includes("οδό") ||
      msg.includes("ταχυδρομ") ||
      msg.includes("θέση") ||
      msg.includes("χάρτη")
    ) {
      return 3;
    }
    if (
      msg.includes("τετραγων") ||
      msg.includes("υπνοδωμάτ") ||
      msg.includes("μπάνι") ||
      msg.includes("όροφο") ||
      (msg.includes("ατόμ") && !msg.includes("τιμ"))
    ) {
      return 4;
    }
    if (msg.includes("τίτλ") || msg.includes("περιγραφ")) return 5;
    if (msg.includes("παροχ")) return AMENITIES_STEP;
    if (
      msg.includes("τιμ") ||
      msg.includes("βράδυ") ||
      msg.includes("μήνα") ||
      msg.includes("διαμον") ||
      msg.includes("καταχώρισ") ||
      msg.includes("αριθμ")
    ) {
      return PRICING_STEP;
    }
    if (msg.includes("φωτογραφ")) return PHOTOS_STEP;
    if (
      msg.includes("επικοινων") ||
      msg.includes("τηλέφων") ||
      msg.includes("email") ||
      msg.includes("αγγελιοδότη")
    ) {
      return CONTACT_STEP;
    }
    if (msg.includes("δήλωσ") || msg.includes("δηλώσ")) return DECLARATIONS_STEP;
    if (msg.includes("υποβολ") || msg.includes("ολοκλήρωσε όλα")) return REVIEW_STEP;
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

  function ensureDraft(onDone: (id: string) => void) {
    if (draftSaving || pending) return;
    setDraftSaving(true);
    setSaveStatus("saving");
    const activeListingId = resolveListingId();
    startTransition(async () => {
      const result = await savePortalListingDraft(buildFormData(), activeListingId);
      setDraftSaving(false);
      if (result.error) {
        setError(result.error);
        setSaveStatus("error");
        return;
      }
      if (result.listingId) {
        persistListingId(result.listingId);
        void refreshSavedPhotoCount(result.listingId);
        markDraftSaved();
        onDone(result.listingId);
      } else {
        setError("Δεν ήταν δυνατή η αποθήκευση της αγγελίας. Δοκίμασε ξανά ή επικοινώνησε με την υποστήριξη.");
        setSaveStatus("error");
      }
    });
  }

  function next() {
    if (pending || draftSaving) return;

    if (step === PHOTOS_STEP && resolveListingId()) {
      if (photosUploadBusy) {
        setError("Περίμενε να ολοκληρωθεί το ανέβασμα των φωτογραφιών.");
        return;
      }
      const activeListingId = resolveListingId();
      startTransition(async () => {
        const dbPhotoCount = await refreshSavedPhotoCount(activeListingId!);
        const err = validateWizardStep(PHOTOS_STEP, false, dbPhotoCount);
        if (err) {
          setError(err);
          return;
        }
        setError(null);
        setSaveStatus("saving");
        const result = await savePortalListingDraft(buildFormData(), activeListingId);
        if (result.error) {
          setError(result.error);
          setSaveStatus("error");
        } else {
          markDraftSaved();
          setStep(CONTACT_STEP);
        }
      });
      return;
    }

    const err = validateStep(false);
    if (err) {
      setError(err);
      return;
    }
    setError(null);

    if (step === AMENITIES_STEP) {
      ensureDraft((id) => {
        startTransition(async () => {
          const amenityResult = await saveOwnerListingAmenities(id, selectedAmenityKeys);
          if ("error" in amenityResult && amenityResult.error) {
            setError(amenityResult.error);
            return;
          }
          setStep((s) => Math.min(s + 1, TOTAL_STEPS));
        });
      });
      return;
    }

    // Save draft on advance for early steps (1–5) and pricing.
    if (step >= 1 && step <= PRICING_STEP) {
      ensureDraft(() => setStep((s) => Math.min(s + 1, TOTAL_STEPS)));
      return;
    }

    if (step >= PHOTOS_STEP && resolveListingId()) {
      const activeListingId = resolveListingId();
      startTransition(async () => {
        await refreshSavedPhotoCount();
        setSaveStatus("saving");
        const result = await savePortalListingDraft(buildFormData(), activeListingId);
        if (result.error) {
          setError(result.error);
          setSaveStatus("error");
        } else {
          markDraftSaved();
          setStep((s) => Math.min(s + 1, TOTAL_STEPS));
        }
      });
      return;
    }
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  }

  function back() {
    setError(null);
    const nextStep = Math.max(step - 1, 1);
    setStep(nextStep);
    if (resolveListingId() && (nextStep >= PHOTOS_STEP || step >= PHOTOS_STEP)) {
      void refreshSavedPhotoCount();
    }
  }

  function saveDraft() {
    if (pending || draftSaving) return;
    setError(null);
    setSuccess(null);
    const activeListingId = resolveListingId();
    setDraftSaving(true);
    setSaveStatus("saving");
    startTransition(async () => {
      const result = await savePortalListingDraft(buildFormData(), activeListingId);
      setDraftSaving(false);
      if (result.error) {
        setError(result.error);
        setSaveStatus("error");
        return;
      }
      if (result.listingId) {
        persistListingId(result.listingId);
        await refreshSavedPhotoCount();
        const amenityResult = await saveOwnerListingAmenities(
          result.listingId,
          selectedAmenityKeys
        );
        if ("error" in amenityResult && amenityResult.error) {
          setError(amenityResult.error);
          setSaveStatus("error");
          return;
        }
        markDraftSaved();
        router.push("/dashboard/listings?saved=draft");
      } else {
        setError("Δεν ήταν δυνατή η αποθήκευση. Δοκίμασε ξανά.");
        setSaveStatus("error");
      }
    });
  }

  function submit() {
    const activeListingId = resolveListingId();
    if (!activeListingId) {
      setError("Αποθήκευσε πρώτα την αγγελία και πρόσθεσε φωτογραφίες.");
      return;
    }

    startTransition(async () => {
      const invalid = await findFirstInvalidStep(true);
      if (invalid) {
        setStep(invalid.step);
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
        if (mappedStep) setStep(mappedStep);
        setError(result.error);
      }
    });
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
        Προεπισκόπηση
      </p>
      <p className="mt-2 font-display text-lg font-semibold text-charcoal">
        {title.trim() || "Νέα αγγελία"}
      </p>
      <p className="mt-1 text-sm text-muted">
        {[city.trim(), area.trim()].filter(Boolean).join(" · ") || "Τοποθεσία —"}
      </p>
      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between gap-2">
          <dt className="text-muted">Μίσθωση</dt>
          <dd className="text-right font-medium text-charcoal">{rentalModeLabel}</dd>
        </div>
        {displayPrice != null && (
          <div className="flex justify-between gap-2">
            <dt className="text-muted">Τιμή</dt>
            <dd className="text-right font-medium text-charcoal">
              €{displayPrice}
              {supportsShortTerm ? " / βράδυ" : " / μήνα"}
            </dd>
          </div>
        )}
        <div className="flex justify-between gap-2">
          <dt className="text-muted">Χώρος</dt>
          <dd className="text-right font-medium text-charcoal">
            {bedrooms || "—"} υπν. · {maxGuests || "—"} άτομα
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted">Φωτογραφίες</dt>
          <dd className="text-right font-medium text-charcoal">{savedPhotoCount}</dd>
        </div>
        {selectedAmenityKeys.length > 0 && (
          <div className="flex justify-between gap-2">
            <dt className="text-muted">Παροχές</dt>
            <dd className="text-right font-medium text-charcoal">
              {selectedAmenityKeys.length}
            </dd>
          </div>
        )}
      </dl>
      <div className="mt-5">
        <div className="flex items-center justify-between text-xs text-muted">
          <span>Ολοκλήρωση</span>
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

  const wizardBusy = pending || draftSaving;
  const nextDisabled =
    step < TOTAL_STEPS
      ? wizardBusy ||
        (step === PHOTOS_STEP && photosUploadBusy) ||
        (step === DECLARATIONS_STEP && !allDeclarationsChecked)
      : wizardBusy ||
        !allDeclarationsChecked ||
        !isReviewReady(
          parsePortalListingFields(buildFormData()),
          savedPhotoCount,
          needsAma,
          ownerDeclarationAccepted,
          registryDeclarationAccepted,
          platformDeclarationAccepted,
          termsPrivacyAccepted,
          listingPhoneReady
        );

  return (
    <CreateListingWizardShell
      stepIndex={step - 1}
      stepCount={TOTAL_STEPS}
      stepLabel={STEPS[step - 1]}
      phaseLabel={STEP_PHASES[step - 1]}
      saveStatus={saveStatus}
      error={error}
      aside={previewAside}
      onBack={back}
      onNext={step < TOTAL_STEPS ? next : submit}
      onSaveAndExit={saveDraft}
      nextLabel={step < TOTAL_STEPS ? "Επόμενο" : "Υποβολή για έλεγχο"}
      nextDisabled={nextDisabled}
      showBack={step > 1}
      isLastStep={step === TOTAL_STEPS}
      busy={wizardBusy}
    >
      <div
        ref={wizardTopRef}
        onKeyDown={(e) => {
          if ((step === DECLARATIONS_STEP || step === REVIEW_STEP) && e.key === "Enter") {
            e.preventDefault();
          }
        }}
      >
        {success && <p className="mb-4 text-sm text-teal">{success}</p>}

        {step === 1 && (
          <div>
            <p className="text-sm text-muted">
              Κάθε αγγελία είναι είτε βραχυχρόνια είτε μηνιαία. Αν θέλεις και τους δύο τρόπους,
              δημιούργησε ξεχωριστή αγγελία για κάθε τύπο.
            </p>

            <div className="mt-6 grid gap-4">
              {MVP_LISTING_TYPE_OPTIONS.map((opt) => (
                <WizardChoiceCard
                  key={opt.value}
                  selected={rentalTypeChoice === opt.value}
                  title={opt.label}
                  description={`${opt.description} ${opt.helper}`}
                  onSelect={() => {
                    setRentalTypeChoice(opt.value);
                    setError(null);
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            {renderStepHeading("Τι είδους ακίνητο είναι;")}
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              {PROPERTY_TYPES.map((t) => (
                <WizardChoiceCard
                  key={t.value}
                  selected={propertyType === t.value}
                  title={t.label}
                  description={
                    t.value === "studio"
                      ? "Ένας ενιαίος χώρος — τα υπνοδωμάτια θα οριστούν σε 0."
                      : t.value === "room"
                        ? "Ιδιωτικό δωμάτιο σε μεγαλύτερο χώρο."
                        : t.value === "apartment"
                          ? "Διαμέρισμα σε πολυκατοικία ή συγκρότημα."
                          : t.value === "house"
                            ? "Ανεξάρτητο σπίτι ή μεζονέτα."
                            : t.value === "villa"
                              ? "Μεγαλύτερη κατοικία με ιδιωτικό χαρακτήρα."
                              : "Άλλη κατηγορία που ταιριάζει καλύτερα."
                  }
                  onSelect={() => {
                    setPropertyType(t.value);
                    if (t.value === "studio") setBedrooms("0");
                    setError(null);
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            {renderStepHeading("Πού βρίσκεται το ακίνητο;")}
            <label className="block">
              <span className="text-xs text-muted uppercase">Πόλη *</span>
              <ListingCityField
                value={city}
                onChange={(nextCity) => {
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
                  Περιοχή <span className="normal-case text-muted/80">(προαιρετικά)</span>
                </span>
                <ListingAreaField
                  city={city}
                  value={area}
                  onChange={(nextArea) => {
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
                      ? `Γειτονιά ή προάστιο στην ${city.trim()} — π.χ. ${examples.join(", ")}`
                      : examples.length === 1
                        ? `Γειτονιά ή προάστιο στην ${city.trim()} — π.χ. ${examples[0]}`
                        : `Γειτονιά ή προάστιο στην ${city.trim()}`;
                  })()}
                </span>
              </label>
            ) : city.trim() ? (
              <p className="rounded-lg border border-border/60 bg-sand/30 px-3 py-2 text-[11px] text-muted">
                Η πόλη <span className="font-medium text-charcoal">{city.trim()}</span> δεν
                χρειάζεται ξεχωριστή περιοχή — συνέχισε με οδό και χάρτη.
              </p>
            ) : null}

            <div className="rounded-xl border border-border bg-sand/25 p-4">
              <p className="text-sm font-semibold text-charcoal">Τοποθεσία ακινήτου</p>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                Η ακριβής διεύθυνση και pin εμφανίζονται δημόσια μόνο αφού επιβεβαιώσεις τη θέση
                στον χάρτη.
              </p>
              <div className="mt-4">
                <PropertyAddressLocationSection
                  state={locationState()}
                  onChange={patchLocationState}
                  inputClassName={inputClass}
                  onCityChange={(nextCity) => {
                    setCity(nextCity);
                    setCityDisplayName(nextCity);
                  }}
                  onAreaChange={(nextArea) => {
                    setArea(nextArea);
                    setAreaDisplayName(nextArea);
                  }}
                />
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs text-muted uppercase">Όροφος διεύθυνσης</span>
                  <input
                    value={addressFloor}
                    onChange={(e) => setAddressFloor(e.target.value)}
                    className={inputClass}
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-muted uppercase">Διαμέρισμα (προαιρετικά)</span>
                  <input
                    value={addressUnit}
                    onChange={(e) => setAddressUnit(e.target.value)}
                    placeholder="π.χ. 4Β"
                    className={inputClass}
                  />
                  <span className="mt-1 block text-[10px] text-muted">
                    Ξεχωριστά από τον αριθμό οδού — για εσωτερική χρήση
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            {renderStepHeading("Πόσα άτομα και τι μέγεθος;")}
            <WizardCounter
              label="Μέγιστα άτομα"
              value={Math.max(1, parseInt(maxGuests, 10) || 1)}
              min={1}
              max={30}
              onChange={(n) => setMaxGuests(String(n))}
            />
            <WizardCounter
              label="Υπνοδωμάτια"
              value={Math.max(0, parseInt(bedrooms, 10) || 0)}
              min={0}
              max={20}
              onChange={(n) => setBedrooms(String(n))}
            />
            <WizardCounter
              label="Μπάνια"
              value={Math.max(0, parseInt(bathrooms, 10) || 0)}
              min={0}
              max={20}
              onChange={(n) => setBathrooms(String(n))}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs text-muted uppercase">Τετραγωνικά μέτρα *</span>
                <input
                  type="number"
                  min={1}
                  required
                  value={sqm}
                  onChange={(e) => setSqm(e.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="block">
                <span className="text-xs text-muted uppercase">Όροφος *</span>
                <input
                  type="number"
                  min={0}
                  value={floor}
                  onChange={(e) => setFloor(e.target.value)}
                  placeholder="0 = ισόγειο"
                  className={inputClass}
                />
              </label>
            </div>
            <p className="text-[11px] text-muted">0 υπνοδωμάτια = στούντιο</p>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            {renderStepHeading("Πώς θα φαίνεται η αγγελία σου;")}
            <label className="block">
              <span className="text-xs text-muted uppercase">Τίτλος αγγελίας *</span>
              <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
              <span className="mt-1 block text-[11px] text-muted">
                Τουλάχιστον {MIN_LISTING_TITLE_LENGTH} χαρακτήρες
              </span>
            </label>
            <label className="block">
              <span className="text-xs text-muted uppercase">Περιγραφή *</span>
              <textarea
                rows={6}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={inputClass}
              />
              <span className="mt-1 block text-[11px] text-muted">
                Τουλάχιστον {MIN_LISTING_DESCRIPTION_LENGTH} χαρακτήρες για υποβολή
              </span>
            </label>
          </div>
        )}

        {step === AMENITIES_STEP && (
          <div className="space-y-4">
            {renderStepHeading("Τι παρέχει το ακίνητο;")}
            <p className="text-sm text-muted">
              Επίλεξε δημοφιλείς παροχές που ισχύουν. Μπορείς να τις συμπληρώσεις αργότερα από τον
              χώρο εργασίας της αγγελίας.
            </p>
            {popularAmenities.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {popularAmenities.map((def) => {
                  const active = selectedAmenityKeys.includes(def.key);
                  const Icon = amenityIconForKey(def.key);
                  return (
                    <button
                      key={def.key}
                      type="button"
                      onClick={() => {
                        setSelectedAmenityKeys((prev) =>
                          prev.includes(def.key)
                            ? prev.filter((k) => k !== def.key)
                            : [...prev, def.key]
                        );
                        setError(null);
                      }}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                        active
                          ? "border-gold bg-gold/15 text-gold-dark"
                          : "border-charcoal/12 bg-white text-charcoal hover:border-gold/35"
                      )}
                    >
                      {active ? (
                        <Check className="h-3.5 w-3.5 shrink-0" />
                      ) : (
                        <Icon className="h-3.5 w-3.5 shrink-0 text-muted" />
                      )}
                      {amenityLabel(def.key)}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted">Δεν υπάρχουν δημοφιλείς παροχές για αυτόν τον τύπο.</p>
            )}
            {selectedAmenityKeys.length > 0 && (
              <p className="text-xs text-muted">{selectedAmenityKeys.length} επιλεγμένες</p>
            )}
            <button
              type="button"
              onClick={() => {
                setError(null);
                next();
              }}
              className="text-sm font-medium text-muted underline-offset-2 hover:text-charcoal hover:underline"
            >
              Παράλειψη προς το παρόν
            </button>
          </div>
        )}

        {step === PRICING_STEP && (
          <div className="space-y-4">
            {renderStepHeading("Τιμή & διαθεσιμότητα")}
            {supportsShortTerm && (
              <div className="space-y-4 rounded-xl border border-border bg-white/60 p-4">
                <p className="text-sm font-medium text-charcoal">Βραχυχρόνια τιμολόγηση</p>
                <label className="block">
                  <span className="text-xs text-muted uppercase">Βασική τιμή ανά βράδυ (€) *</span>
                  <input
                    type="number"
                    min={1}
                    value={pricePerNight}
                    onChange={(e) => setPricePerNight(e.target.value)}
                    className={inputClass}
                  />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-xs text-muted uppercase">
                      Η τιμή περιλαμβάνει έως πόσα άτομα *
                    </span>
                    <input
                      type="number"
                      min={1}
                      value={includedGuests}
                      onChange={(e) => setIncludedGuests(e.target.value)}
                      className={inputClass}
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs text-muted uppercase">
                      Χρέωση ανά επιπλέον άτομο / βράδυ (€) *
                    </span>
                    <input
                      type="number"
                      min={0}
                      value={extraGuestFee}
                      onChange={(e) => setExtraGuestFee(e.target.value)}
                      className={inputClass}
                    />
                  </label>
                </div>
                <label className="block">
                  <span className="text-xs text-muted uppercase">Ελάχιστη διαμονή σε νύχτες *</span>
                  <select
                    value={shortMinStay}
                    onChange={(e) => setShortMinStay(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Επίλεξε...</option>
                    {SHORT_TERM_MIN_STAY_OPTIONS.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs text-muted uppercase">Διαθεσιμότητα</span>
                  <select
                    value={availabilityStatus}
                    onChange={(e) => setAvailabilityStatus(e.target.value)}
                    className={inputClass}
                  >
                    {AVAIL_OPTS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
                {availabilityStatus === "from_month" && (
                  <label className="block">
                    <span className="text-xs text-muted uppercase">Από ποιον μήνα</span>
                    <input
                      value={availabilityNote}
                      onChange={(e) => setAvailabilityNote(e.target.value)}
                      placeholder="π.χ. Σεπτέμβριος 2026"
                      className={inputClass}
                    />
                  </label>
                )}
                {pricePerNight && includedGuests && (
                  <p className="rounded-lg bg-sand/50 p-3 text-xs text-muted">
                    Δημόσια εμφάνιση: Από €{pricePerNight} / βράδυ για έως {includedGuests} άτομα
                    {Number(extraGuestFee) > 0 &&
                      ` · + €${extraGuestFee} / βράδυ για κάθε επιπλέον άτομο`}
                  </p>
                )}
                {needsAma && (
                  <ShortTermRegistryComplianceCard
                    legalRegistryType={legalRegistryType}
                    amaNumber={amaNumber}
                    onTypeChange={setLegalRegistryType}
                    onNumberChange={setAmaNumber}
                    inputClassName={inputClass}
                  />
                )}
              </div>
            )}
            {supportsMonthly && (
              <div className="space-y-4 rounded-xl border border-border bg-white/60 p-4">
                <p className="text-sm font-medium text-charcoal">Μηνιαία / μεσοπρόθεσμη</p>
                <label className="block">
                  <span className="text-xs text-muted uppercase">Τιμή ανά μήνα (€) *</span>
                  <input
                    type="number"
                    min={1}
                    value={priceMonthly}
                    onChange={(e) => setPriceMonthly(e.target.value)}
                    className={inputClass}
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-muted uppercase">Ελάχιστη διάρκεια *</span>
                  <select
                    value={monthlyMinStay}
                    onChange={(e) => setMonthlyMinStay(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">2 μήνες (ελάχιστο)</option>
                    {MONTHLY_MIN_STAY_OPTIONS.filter((o) => !o.startsWith("1+")).map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </label>
                <fieldset>
                  <legend className="text-xs text-muted uppercase">
                    Δέχεσαι διαμονές κάτω από 60 ημέρες;
                  </legend>
                  <div className="mt-2 flex gap-4 text-sm">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={acceptsUnder60}
                        onChange={() => setAcceptsUnder60(true)}
                      />{" "}
                      Ναι
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={!acceptsUnder60}
                        onChange={() => setAcceptsUnder60(false)}
                      />{" "}
                      Όχι
                    </label>
                  </div>
                </fieldset>
                <label className="block">
                  <span className="text-xs text-muted uppercase">Όροι μηνιαίας διαμονής</span>
                  <textarea
                    rows={3}
                    value={monthlyTerms}
                    onChange={(e) => setMonthlyTerms(e.target.value)}
                    placeholder="π.χ. εγγύηση, λογαριασμοί, κανόνες μακροχρόνιας διαμονής"
                    className={inputClass}
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-muted uppercase">Διαθεσιμότητα</span>
                  <select
                    value={availabilityStatus}
                    onChange={(e) => setAvailabilityStatus(e.target.value)}
                    className={inputClass}
                  >
                    {AVAIL_OPTS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
                {availabilityStatus === "from_month" && (
                  <label className="block">
                    <span className="text-xs text-muted uppercase">Μήνας έναρξης</span>
                    <input
                      value={availabilityNote}
                      onChange={(e) => setAvailabilityNote(e.target.value)}
                      placeholder="π.χ. Σεπτέμβριος 2026"
                      className={inputClass}
                    />
                  </label>
                )}
                {needsAma && (
                  <ShortTermRegistryComplianceCard
                    legalRegistryType={legalRegistryType}
                    amaNumber={amaNumber}
                    onTypeChange={setLegalRegistryType}
                    onNumberChange={setAmaNumber}
                    inputClassName={inputClass}
                  />
                )}
              </div>
            )}
          </div>
        )}

        {step === PHOTOS_STEP && draftSaving && (
          <div className="py-12 text-center">
            {renderStepHeading("Φωτογραφίες")}
            <p className="text-sm text-muted">Αποθήκευση πρόχειρης αγγελίας...</p>
          </div>
        )}
        {step === PHOTOS_STEP && resolveListingId() && !draftSaving && (
          <ListingWizardPhotosStep
            listingId={resolveListingId()!}
            initialImages={[]}
            stepHeadingRef={stepHeadingRef}
            onPhotoCountChange={handlePhotoCountChange}
            onUploadBusyChange={setPhotosUploadBusy}
          />
        )}
        {step === PHOTOS_STEP && !resolveListingId() && !draftSaving && (
          <div className="py-8 text-center">
            {renderStepHeading("Φωτογραφίες")}
            <p className="text-sm text-muted">
              Δεν ήταν δυνατή η μετάβαση στο βήμα φωτογραφιών. Πάτα ξανά «Επόμενο» ή
              «Αποθήκευση και έξοδος».
            </p>
          </div>
        )}

        {step === CONTACT_STEP && (
          <div className="space-y-4">
            {renderStepHeading("Πώς θα επικοινωνούν μαζί σου;")}
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

        {step === DECLARATIONS_STEP && (
          <ListingWizardDeclarationsStep
            needsRegistryDeclaration={needsAma}
            ownerAccepted={ownerDeclarationAccepted}
            registryAccepted={registryDeclarationAccepted}
            platformAccepted={platformDeclarationAccepted}
            termsAccepted={termsPrivacyAccepted}
            onOwnerChange={setOwnerDeclarationAccepted}
            onRegistryChange={setRegistryDeclarationAccepted}
            onPlatformChange={setPlatformDeclarationAccepted}
            onTermsChange={setTermsPrivacyAccepted}
            allRequiredChecked={allDeclarationsChecked}
          />
        )}

        {step === REVIEW_STEP && (
          <ListingWizardReviewStep
            fields={parsePortalListingFields(buildFormData())}
            savedPhotoCount={savedPhotoCount}
            needsAma={needsAma}
            ownerDeclarationAccepted={ownerDeclarationAccepted}
            registryDeclarationAccepted={registryDeclarationAccepted}
            platformDeclarationAccepted={platformDeclarationAccepted}
            termsPrivacyAccepted={termsPrivacyAccepted}
            listingPhoneReady={listingPhoneReady}
            onGoToStep={(target) => {
              setError(null);
              setStep(target);
            }}
          />
        )}
      </div>
    </CreateListingWizardShell>
  );
}
