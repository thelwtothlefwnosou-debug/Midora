"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { AccountShell } from "@/components/account/AccountShell";
import { GlassCard } from "@/components/ui/GlassCard";
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
  validateBasicDetails,
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
import { cn } from "@/lib/utils";

const STEPS = [
  "Βασικά στοιχεία",
  "Τύπος μίσθωσης",
  "Τιμή & μίσθωση",
  "Φωτογραφίες",
  "Επικοινωνία",
  "Δηλώσεις",
  "Έλεγχος πριν την υποβολή",
] as const;

const STEP_HINTS = [
  "Συμπλήρωσε τίτλο, τοποθεσία και βασικά χαρακτηριστικά του ακινήτου.",
  "Διάλεξε αν η αγγελία είναι βραχυχρόνια ή μηνιαία / μεσοπρόθεσμη.",
  "Όρισε τιμές, διαθεσιμότητα και στοιχεία καταχώρισης αν χρειάζεται.",
  "Ανέβασε τουλάχιστον μία φωτογραφία — η πρώτη γίνεται κύρια.",
  "Πώς θα επικοινωνούν μαζί σου οι ενδιαφερόμενοι.",
  "Αποδέχσου τις απαιτούμενες δηλώσεις για υποβολή.",
  "Έλεγξε όλα τα στοιχεία πριν υποβάλεις για έλεγχο.",
] as const;

const TOTAL_STEPS = STEPS.length;
const WIZARD_SCROLL_OFFSET = 112;
const WIZARD_DRAFT_STORAGE_KEY = "midora_new_listing_draft_id";

function formatDraftSavedAt(date: Date): string {
  return date.toLocaleTimeString("el-GR", { hour: "2-digit", minute: "2-digit" });
}

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

export function NewListingWizard({ profile, email, initialListingId = null }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [draftSaving, setDraftSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [listingId, setListingId] = useState<string | null>(initialListingId);
  const [savedPhotoCount, setSavedPhotoCount] = useState(0);
  const [photosUploadBusy, setPhotosUploadBusy] = useState(false);

  const wizardTopRef = useRef<HTMLDivElement>(null);
  const stepHeadingRef = useRef<HTMLHeadingElement>(null);
  const skipInitialScrollRef = useRef(true);
  const draftLoadedRef = useRef(false);

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

  useEffect(() => {
    if (draftLoadedRef.current) return;
    draftLoadedRef.current = true;

    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const fresh = params.get("fresh") === "1";
    const draftIdFromUrl = params.get("draft")?.trim() || null;
    const draftId = initialListingId ?? draftIdFromUrl;

    // Νέα αγγελία χωρίς ?draft= → πάντα κενό φόρμα, όχι επαναφορά παλιού draft
    if (fresh || !draftId) {
      clearWizardDraftSession(setListingId);
      if (fresh) {
        window.history.replaceState(null, "", "/dashboard/listings/new");
      }
      return;
    }

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

      if ((result.photoCount ?? 0) >= MIN_LISTING_PHOTOS_FOR_REVIEW) {
        setStep(7);
      } else if ((result.photoCount ?? 0) > 0) {
        setStep(4);
      }
    });
  }, [initialListingId]);

  function renderStepHeading(title: string, hint?: string) {
    return (
      <div className="mb-5">
        <h2
          ref={stepHeadingRef}
          tabIndex={-1}
          className="font-display text-xl font-semibold text-charcoal outline-none"
        >
          {title}
        </h2>
        <p className="mt-1.5 text-sm text-muted">{hint ?? STEP_HINTS[step - 1]}</p>
      </div>
    );
  }

  function markDraftSaved() {
    setLastSavedAt(new Date());
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

  function buildFormData(): FormData {
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
  }

  function validateWizardStep(
    targetStep: number,
    forSubmission = false,
    dbPhotoCount = savedPhotoCount
  ): string | null {
    if (targetStep === 1) {
      return validateBasicDetails({
        title,
        city,
        area,
        addressStreet,
        addressNumber,
        addressPostalCode,
        propertyType,
        sqm,
        bedrooms,
        bathrooms,
        floor,
        description,
        forSubmission: true,
      });
    }
    if (targetStep === 1 && forSubmission) {
      if (latitude == null || longitude == null) {
        return "Ορίσε την ακριβή θέση του ακινήτου στον χάρτη για να συνεχίσεις.";
      }
    }
    if (targetStep === 2 && !rentalTypeChoice) {
      return "Επίλεξε τύπο μίσθωσης για να συνεχίσεις.";
    }
    if (targetStep === 3) {
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
    if (targetStep === 4) {
      if (forSubmission) {
        return photoCountSubmitError(dbPhotoCount);
      }
      return photoCountStepError(dbPhotoCount);
    }
    if (targetStep === 5) {
      if (!contactName.trim()) return "Συμπλήρωσε όνομα αγγελιοδότη.";
      if (!contactPhone.trim() && !contactEmail.trim()) {
        return "Συμπλήρωσε τηλέφωνο ή email επικοινωνίας.";
      }
      if (contactPhone.trim() && !hasCallablePhone(contactPhone)) {
        return "Συμπλήρωσε έγκυρο κινητό τηλέφωνο (Ελλάδα).";
      }
    }
    if (targetStep === 6) {
      if (!allDeclarationsChecked) {
        return "Επίλεξε όλες τις απαιτούμενες δηλώσεις για να συνεχίσεις.";
      }
    }
    if (targetStep === 7 && forSubmission) {
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

  function mapErrorToStep(error: string): number | null {
    const msg = error.toLowerCase();
    if (
      msg.includes("τετραγων") ||
      msg.includes("τίτλ") ||
      msg.includes("περιγραφ") ||
      msg.includes("πόλη") ||
      msg.includes("περιοχ") ||
      msg.includes("οδό") ||
      msg.includes("ταχυδρομ") ||
      msg.includes("υπνοδωμάτ") ||
      msg.includes("ακινήτου")
    ) {
      return 1;
    }
    if (msg.includes("τύπο") && msg.includes("μίσθωσ")) return 2;
    if (
      msg.includes("τιμ") ||
      msg.includes("βράδυ") ||
      msg.includes("μήνα") ||
      msg.includes("ατόμ") ||
      msg.includes("διαμον") ||
      msg.includes("καταχώρισ") ||
      msg.includes("αριθμ")
    ) {
      return 3;
    }
    if (msg.includes("φωτογραφ")) return 4;
    if (msg.includes("επικοινων") || msg.includes("τηλέφων") || msg.includes("email") || msg.includes("αγγελιοδότη")) {
      return 5;
    }
    if (msg.includes("δήλωσ") || msg.includes("δηλώσ")) return 6;
    if (msg.includes("υποβολ") || msg.includes("ολοκλήρωσε όλα")) return 7;
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
    const activeListingId = resolveListingId();
    startTransition(async () => {
      const result = await savePortalListingDraft(buildFormData(), activeListingId);
      setDraftSaving(false);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.listingId) {
        persistListingId(result.listingId);
        void refreshSavedPhotoCount(result.listingId);
        markDraftSaved();
        onDone(result.listingId);
      } else {
        setError("Δεν ήταν δυνατή η αποθήκευση της αγγελίας. Δοκίμασε ξανά ή επικοινώνησε με την υποστήριξη.");
      }
    });
  }

  function next() {
    if (pending || draftSaving) return;

    if (step === 4 && resolveListingId()) {
      if (photosUploadBusy) {
        setError("Περίμενε να ολοκληρωθεί το ανέβασμα των φωτογραφιών.");
        return;
      }
      const activeListingId = resolveListingId();
      startTransition(async () => {
        const dbPhotoCount = await refreshSavedPhotoCount(activeListingId!);
        const err = validateWizardStep(4, false, dbPhotoCount);
        if (err) {
          setError(err);
          return;
        }
        setError(null);
        const result = await savePortalListingDraft(buildFormData(), activeListingId);
        if (result.error) setError(result.error);
        else {
          markDraftSaved();
          setStep(5);
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

    if (step === 3) {
      ensureDraft(() => setStep(4));
      return;
    }
    if (step >= 4 && resolveListingId()) {
      const activeListingId = resolveListingId();
      startTransition(async () => {
        await refreshSavedPhotoCount();
        const result = await savePortalListingDraft(buildFormData(), activeListingId);
        if (result.error) setError(result.error);
        else {
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
    if (resolveListingId() && (nextStep >= 4 || step >= 4)) {
      void refreshSavedPhotoCount();
    }
  }

  function saveDraft() {
    if (pending || draftSaving) return;
    setError(null);
    setSuccess(null);
    const activeListingId = resolveListingId();
    setDraftSaving(true);
    startTransition(async () => {
      const result = await savePortalListingDraft(buildFormData(), activeListingId);
      setDraftSaving(false);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.listingId) {
        persistListingId(result.listingId);
        await refreshSavedPhotoCount();
        markDraftSaved();
      }
      router.push("/dashboard/listings?saved=draft");
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

  return (
    <AccountShell
      profile={profile}
      email={email}
      active="new-listing"
      title="Νέα αγγελία"
      subtitle={`Βήμα ${step} από ${TOTAL_STEPS} — ${STEPS[step - 1]}`}
    >
      <div ref={wizardTopRef}>
        {(draftSaving || lastSavedAt) && (
          <p className="mb-4 text-xs text-muted" aria-live="polite">
            {draftSaving
              ? "Αποθήκευση πρόχειρης..."
              : `Αποθηκεύτηκε πρόχειρα στις ${formatDraftSavedAt(lastSavedAt!)}`}
          </p>
        )}

        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
          <nav
            aria-label="Βήματα αγγελίας"
            className="hidden lg:block lg:w-52 lg:shrink-0 lg:sticky lg:top-24 lg:self-start"
          >
            <ol className="space-y-1">
              {STEPS.map((label, i) => {
                const stepNum = i + 1;
                const isCurrent = stepNum === step;
                const isComplete = stepNum < step;
                return (
                  <li key={label}>
                    <div
                      className={cn(
                        "flex items-start gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-colors",
                        isCurrent && "bg-gold/10 font-medium text-charcoal",
                        isComplete && !isCurrent && "text-muted",
                        !isCurrent && !isComplete && "text-muted/70"
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                          isCurrent && "bg-gold text-white",
                          isComplete && !isCurrent && "bg-teal/15 text-teal",
                          !isCurrent && !isComplete && "bg-border/80 text-muted"
                        )}
                      >
                        {isComplete ? <Check className="h-3.5 w-3.5" /> : stepNum}
                      </span>
                      <span className="pt-0.5 leading-snug">{label}</span>
                    </div>
                  </li>
                );
              })}
            </ol>
          </nav>

          <div className="min-w-0 flex-1 pb-2">
            <div className="mb-5 lg:hidden">
              <div className="mb-2 flex items-center justify-between gap-2 text-xs text-muted">
                <span>
                  Βήμα {step} από {TOTAL_STEPS}
                </span>
                <span className="truncate font-medium text-charcoal">{STEPS[step - 1]}</span>
              </div>
              <div className="flex gap-1">
                {STEPS.map((label, i) => (
                  <div
                    key={label}
                    className={cn(
                      "h-1 flex-1 rounded-full",
                      i + 1 <= step ? "bg-gold" : "bg-border"
                    )}
                    title={label}
                  />
                ))}
              </div>
            </div>

            <GlassCard
              className="p-6 sm:p-8"
              onKeyDown={(e) => {
                if ((step === 6 || step === 7) && e.key === "Enter") {
                  e.preventDefault();
                }
              }}
            >
        {step === 1 && (
          <div className="space-y-4">
            {renderStepHeading("Βασικά στοιχεία")}
            <label className="block">
              <span className="text-xs text-muted uppercase">Τίτλος αγγελίας *</span>
              <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
              <span className="mt-1 block text-[11px] text-muted">
                Τουλάχιστον {MIN_LISTING_TITLE_LENGTH} χαρακτήρες
              </span>
            </label>
            <label className="block">
              <span className="text-xs text-muted uppercase">Πόλη *</span>
              <ListingCityField
                value={city}
                onChange={(next) => {
                  setCity(next);
                  setCityDisplayName(next);
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
                  onChange={(next) => {
                    setArea(next);
                    setAreaDisplayName(next);
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
                  onCityChange={(next) => {
                    setCity(next);
                    setCityDisplayName(next);
                  }}
                  onAreaChange={(next) => {
                    setArea(next);
                    setAreaDisplayName(next);
                  }}
                />
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs text-muted uppercase">Όροφος</span>
                  <input value={addressFloor} onChange={(e) => setAddressFloor(e.target.value)} className={inputClass} />
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

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <label className="block sm:col-span-2 lg:col-span-1">
                <span className="text-xs text-muted uppercase">Τύπος ακινήτου *</span>
                <select
                  value={propertyType}
                  onChange={(e) => {
                    const next = e.target.value;
                    setPropertyType(next);
                    if (next === "studio") setBedrooms("0");
                  }}
                  className={inputClass}
                >
                  {PROPERTY_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </label>
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
                <span className="text-xs text-muted uppercase">Υπνοδωμάτια *</span>
                <input
                  type="number"
                  min={0}
                  value={bedrooms}
                  onChange={(e) => setBedrooms(e.target.value)}
                  className={inputClass}
                />
                <span className="mt-1 block text-[10px] text-muted">0 = στούντιο</span>
              </label>
              <label className="block">
                <span className="text-xs text-muted uppercase">Μπάνια *</span>
                <input
                  type="number"
                  min={0}
                  value={bathrooms}
                  onChange={(e) => setBathrooms(e.target.value)}
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
            <label className="block">
              <span className="text-xs text-muted uppercase">Περιγραφή *</span>
              <textarea rows={5} value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} />
              <span className="mt-1 block text-[11px] text-muted">
                Τουλάχιστον {MIN_LISTING_DESCRIPTION_LENGTH} χαρακτήρες για υποβολή
              </span>
            </label>
          </div>
        )}

        {step === 2 && (
          <div>
            {renderStepHeading("Τι τύπο μίσθωσης είναι αυτή η αγγελία;")}

            <p className="mt-2 text-sm text-muted">
              Κάθε αγγελία είναι είτε βραχυχρόνια είτε μηνιαία. Αν θέλεις και τους δύο τρόπους,
              δημιούργησε ξεχωριστή αγγελία για κάθε τύπο.
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {MVP_LISTING_TYPE_OPTIONS.map((opt) => {
                const selected = rentalTypeChoice === opt.value;
                return (
                  <label
                    key={opt.value}
                    className={cn(
                      "flex cursor-pointer gap-3 rounded-2xl border p-5 transition-colors",
                      selected ? "border-gold bg-gold/10" : "border-border hover:border-gold/30"
                    )}
                  >
                    <input
                      type="radio"
                      name="rental_type_choice"
                      checked={selected}
                      onChange={() => {
                        setRentalTypeChoice(opt.value);
                        setError(null);
                      }}
                      className="mt-1 h-4 w-4 shrink-0 accent-gold"
                    />
                    <span>
                      <span className="block font-semibold text-charcoal">{opt.label}</span>
                      <span className="mt-2 block text-sm leading-relaxed text-charcoal/80">
                        {opt.description}
                      </span>
                      <span className="mt-2 block text-xs leading-relaxed text-muted">
                        {opt.helper}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            {renderStepHeading("Τιμή και μίσθωση")}
            {supportsShortTerm && (
              <div className="space-y-4 rounded-xl border border-border bg-white/60 p-4">
                <p className="text-sm font-medium text-charcoal">Βραχυχρόνια τιμολόγηση</p>
                <label className="block">
                  <span className="text-xs text-muted uppercase">Βασική τιμή ανά βράδυ (€) *</span>
                  <input type="number" min={1} value={pricePerNight} onChange={(e) => setPricePerNight(e.target.value)} className={inputClass} />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-xs text-muted uppercase">Η τιμή περιλαμβάνει έως πόσα άτομα *</span>
                    <input type="number" min={1} value={includedGuests} onChange={(e) => setIncludedGuests(e.target.value)} className={inputClass} />
                  </label>
                  <label className="block">
                    <span className="text-xs text-muted uppercase">Χρέωση ανά επιπλέον άτομο / βράδυ (€) *</span>
                    <input type="number" min={0} value={extraGuestFee} onChange={(e) => setExtraGuestFee(e.target.value)} className={inputClass} />
                  </label>
                </div>
                <label className="block">
                  <span className="text-xs text-muted uppercase">Μέγιστος αριθμός ατόμων *</span>
                  <input type="number" min={1} value={maxGuests} onChange={(e) => setMaxGuests(e.target.value)} className={inputClass} />
                </label>
                <label className="block">
                  <span className="text-xs text-muted uppercase">Ελάχιστη διαμονή σε νύχτες *</span>
                  <select value={shortMinStay} onChange={(e) => setShortMinStay(e.target.value)} className={inputClass}>
                    <option value="">Επίλεξε...</option>
                    {SHORT_TERM_MIN_STAY_OPTIONS.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs text-muted uppercase">Διαθεσιμότητα</span>
                  <select value={availabilityStatus} onChange={(e) => setAvailabilityStatus(e.target.value)} className={inputClass}>
                    {AVAIL_OPTS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </label>
                {availabilityStatus === "from_month" && (
                  <label className="block">
                    <span className="text-xs text-muted uppercase">Από ποιον μήνα</span>
                    <input value={availabilityNote} onChange={(e) => setAvailabilityNote(e.target.value)} placeholder="π.χ. Σεπτέμβριος 2026" className={inputClass} />
                  </label>
                )}
                {pricePerNight && includedGuests && (
                  <p className="rounded-lg bg-sand/50 p-3 text-xs text-muted">
                    Δημόσια εμφάνιση: Από €{pricePerNight} / βράδυ για έως {includedGuests} άτομα
                    {Number(extraGuestFee) > 0 && ` · + €${extraGuestFee} / βράδυ για κάθε επιπλέον άτομο`}
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
                  <input type="number" min={1} value={priceMonthly} onChange={(e) => setPriceMonthly(e.target.value)} className={inputClass} />
                </label>
                <label className="block">
                  <span className="text-xs text-muted uppercase">Μέγιστος αριθμός ατόμων *</span>
                  <input type="number" min={1} value={maxGuests} onChange={(e) => setMaxGuests(e.target.value)} className={inputClass} />
                </label>
                <label className="block">
                  <span className="text-xs text-muted uppercase">Ελάχιστη διάρκεια *</span>
                  <select value={monthlyMinStay} onChange={(e) => setMonthlyMinStay(e.target.value)} className={inputClass}>
                    <option value="">2 μήνες (ελάχιστο)</option>
                    {MONTHLY_MIN_STAY_OPTIONS.filter((o) => !o.startsWith("1+")).map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </label>
                <fieldset>
                  <legend className="text-xs text-muted uppercase">Δέχεσαι διαμονές κάτω από 60 ημέρες;</legend>
                  <div className="mt-2 flex gap-4 text-sm">
                    <label className="flex items-center gap-2">
                      <input type="radio" checked={acceptsUnder60} onChange={() => setAcceptsUnder60(true)} /> Ναι
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="radio" checked={!acceptsUnder60} onChange={() => setAcceptsUnder60(false)} /> Όχι
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
                  <select value={availabilityStatus} onChange={(e) => setAvailabilityStatus(e.target.value)} className={inputClass}>
                    {AVAIL_OPTS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </label>
                {availabilityStatus === "from_month" && (
                  <label className="block">
                    <span className="text-xs text-muted uppercase">Μήνας έναρξης</span>
                    <input value={availabilityNote} onChange={(e) => setAvailabilityNote(e.target.value)} placeholder="π.χ. Σεπτέμβριος 2026" className={inputClass} />
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

        {step === 4 && draftSaving && (
          <div className="py-12 text-center">
            {renderStepHeading("Φωτογραφίες")}
            <p className="text-sm text-muted">Αποθήκευση πρόχειρης αγγελίας...</p>
          </div>
        )}
        {step === 4 && resolveListingId() && !draftSaving && (
          <ListingWizardPhotosStep
            listingId={resolveListingId()!}
            initialImages={[]}
            stepHeadingRef={stepHeadingRef}
            onPhotoCountChange={handlePhotoCountChange}
            onUploadBusyChange={setPhotosUploadBusy}
          />
        )}
        {step === 4 && !resolveListingId() && !draftSaving && (
          <div className="py-8 text-center">
            <p className="text-sm text-muted">
              Δεν ήταν δυνατή η μετάβαση στο βήμα φωτογραφιών. Πάτα ξανά «Συνέχεια» ή
              «Αποθήκευση πρόχειρης».
            </p>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            {renderStepHeading("Επικοινωνία για αυτή την αγγελία")}
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

        {step === 4 && !resolveListingId() && !draftSaving && (
          <div className="py-8 text-center">
            {renderStepHeading("Φωτογραφίες")}
            <p className="text-sm text-muted">
              Δεν ήταν δυνατή η μετάβαση στο βήμα φωτογραφιών. Πάτα ξανά «Συνέχεια» ή
              «Αποθήκευση πρόχειρης».
            </p>
          </div>
        )}

        {step === 6 && (
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

        {step === 7 && (
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

        {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
        {success && <p className="mt-4 text-sm text-teal">{success}</p>}
            </GlassCard>

            <div
              className="sticky bottom-0 z-20 -mx-3 mt-6 border-t border-border bg-cream/95 px-3 py-4 shadow-[0_-8px_24px_rgba(26,26,26,0.06)] backdrop-blur-md sm:-mx-5 sm:px-5"
              role="toolbar"
              aria-label="Ενέργειες οδηγού"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  {step > 1 ? (
                    <button
                      type="button"
                      onClick={back}
                      className="inline-flex items-center gap-1 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-medium"
                    >
                      <ChevronLeft className="h-4 w-4" /> Πίσω
                    </button>
                  ) : (
                    <span className="hidden sm:block" aria-hidden />
                  )}
                  <button
                    type="button"
                    onClick={saveDraft}
                    disabled={pending || draftSaving}
                    className="rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-medium text-muted hover:text-charcoal disabled:opacity-60"
                  >
                    {draftSaving ? "Αποθήκευση..." : "Αποθήκευση πρόχειρης"}
                  </button>
                </div>
                {step < TOTAL_STEPS ? (
                  <button
                    type="button"
                    onClick={next}
                    disabled={
                      pending ||
                      draftSaving ||
                      (step === 4 && photosUploadBusy) ||
                      (step === 6 && !allDeclarationsChecked)
                    }
                    className="inline-flex items-center gap-1 rounded-xl bg-gold px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {draftSaving ? "Αποθήκευση..." : "Συνέχεια"}{" "}
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={submit}
                    disabled={
                      pending ||
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
                      )
                    }
                    className="rounded-xl bg-charcoal px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {pending ? "Υποβολή..." : "Υποβολή για έλεγχο"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AccountShell>
  );
}
