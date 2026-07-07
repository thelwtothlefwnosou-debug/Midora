"use client";

import { AlertTriangle, CheckCircle2, ChevronRight } from "lucide-react";
import { MIN_LISTING_PHOTOS_FOR_REVIEW } from "@/lib/constants";
import {
  isValidRegistryNumber,
  MIN_LISTING_DESCRIPTION_LENGTH,
  MIN_LISTING_TITLE_LENGTH,
} from "@/lib/listing-wizard-validation";
import {
  REGISTRY_FILLED_STATUS_LABEL,
} from "@/lib/registry-compliance";
import { areWizardDeclarationsComplete } from "@/components/listings/wizard/ListingWizardDeclarationsStep";
import { cn } from "@/lib/utils";
import type { PortalListingFields } from "@/lib/listing-portal-payload";
import { hasCallablePhone } from "@/lib/listing-contact";

export type ReviewCheckItem = {
  id: string;
  label: string;
  step: number;
  status: "complete" | "warning";
};

type Props = {
  fields: PortalListingFields;
  savedPhotoCount: number;
  needsAma: boolean;
  ownerDeclarationAccepted: boolean;
  registryDeclarationAccepted: boolean;
  platformDeclarationAccepted: boolean;
  termsPrivacyAccepted: boolean;
  listingPhoneReady: boolean;
  onGoToStep: (step: number) => void;
};

function buildReviewItems(
  fields: PortalListingFields,
  savedPhotoCount: number,
  needsAma: boolean,
  ownerDeclarationAccepted: boolean,
  registryDeclarationAccepted: boolean,
  platformDeclarationAccepted: boolean,
  termsPrivacyAccepted: boolean,
  listingPhoneReady: boolean
): ReviewCheckItem[] {
  const basicOk =
    fields.title.trim().length >= MIN_LISTING_TITLE_LENGTH &&
    Boolean(fields.city?.trim()) &&
    Boolean(fields.area?.trim()) &&
    Boolean(fields.property_type) &&
    (fields.sqm ?? 0) > 0 &&
    fields.bedrooms != null &&
    fields.bedrooms >= 0 &&
    fields.bathrooms != null &&
    fields.bathrooms >= 0 &&
    fields.floor != null &&
    fields.floor >= 0 &&
    fields.description.trim().length >= MIN_LISTING_DESCRIPTION_LENGTH;

  const locationOk = Boolean(fields.city?.trim() && fields.area?.trim());
  const addressOk = Boolean(fields.address_street?.trim() && fields.address_number?.trim());
  const exactPinOk = Boolean(fields.latitude != null && fields.longitude != null);

  const shortTermPricingOk =
    !fields.supports_short_term ||
    (Boolean(fields.price_per_night && fields.price_per_night > 0) &&
      Boolean(fields.max_guests && fields.max_guests > 0) &&
      Boolean(fields.min_stay_label?.trim()));

  const monthlyPricingOk =
    !fields.supports_monthly ||
    (Boolean(fields.price_monthly && fields.price_monthly > 0) &&
      Boolean(fields.max_guests && fields.max_guests > 0));

  const pricingOk = shortTermPricingOk && monthlyPricingOk;
  const photosOk = savedPhotoCount >= MIN_LISTING_PHOTOS_FOR_REVIEW;
  const availabilityOk = Boolean(fields.availability_status);

  const registryOk =
    !needsAma ||
    (Boolean(fields.ama_number) &&
      fields.legal_registry_type !== "none" &&
      isValidRegistryNumber(fields.legal_registry_type, fields.ama_number ?? ""));

  const contactOk =
    Boolean(fields.contact_name?.trim()) &&
    Boolean(fields.contact_phone?.trim() || fields.contact_email?.trim()) &&
    (!fields.contact_phone?.trim() || hasCallablePhone(fields.contact_phone)) &&
    listingPhoneReady;

  const declarationsOk = areWizardDeclarationsComplete({
    needsRegistryDeclaration: needsAma,
    ownerAccepted: ownerDeclarationAccepted,
    registryAccepted: registryDeclarationAccepted,
    platformAccepted: platformDeclarationAccepted,
    termsAccepted: termsPrivacyAccepted,
  });

  const items: ReviewCheckItem[] = [
    { id: "basics", label: "Βασικά στοιχεία", step: 1, status: basicOk ? "complete" : "warning" },
    { id: "location", label: "Περιοχή", step: 1, status: locationOk ? "complete" : "warning" },
    { id: "address", label: "Διεύθυνση", step: 1, status: addressOk ? "complete" : "warning" },
    {
      id: "exact_pin",
      label: "Ακριβής τοποθεσία (pin)",
      step: 1,
      status: exactPinOk ? "complete" : "warning",
    },
    {
      id: "pricing",
      label: fields.supports_short_term
        ? "Τιμή και όροι βραχυχρόνιας διαμονής"
        : "Τιμή και όροι μίσθωσης",
      step: 3,
      status: pricingOk ? "complete" : "warning",
    },
    {
      id: "photos",
      label: `Φωτογραφίες (≥${MIN_LISTING_PHOTOS_FOR_REVIEW})`,
      step: 4,
      status: photosOk ? "complete" : "warning",
    },
    {
      id: "availability",
      label: "Διαθεσιμότητα",
      step: 3,
      status: availabilityOk ? "complete" : "warning",
    },
  ];

  if (needsAma) {
    items.push({
      id: "registry",
      label: "Αριθμός καταχώρισης",
      step: 3,
      status: registryOk ? "complete" : "warning",
    });
  }

  items.push(
    {
      id: "contact",
      label: "Στοιχεία επικοινωνίας",
      step: 5,
      status: contactOk ? "complete" : "warning",
    },
    { id: "declarations", label: "Δηλώσεις", step: 6, status: declarationsOk ? "complete" : "warning" }
  );

  return items;
}

export function ListingWizardReviewStep({
  fields,
  savedPhotoCount,
  needsAma,
  ownerDeclarationAccepted,
  registryDeclarationAccepted,
  platformDeclarationAccepted,
  termsPrivacyAccepted,
  listingPhoneReady,
  onGoToStep,
}: Props) {
  const items = buildReviewItems(
    fields,
    savedPhotoCount,
    needsAma,
    ownerDeclarationAccepted,
    registryDeclarationAccepted,
    platformDeclarationAccepted,
    termsPrivacyAccepted,
    listingPhoneReady
  );
  const allComplete = items.every((item) => item.status === "complete");

  const registryValid =
    needsAma &&
    fields.ama_number &&
    isValidRegistryNumber(fields.legal_registry_type, fields.ama_number);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-xl font-semibold text-charcoal">
          Έλεγχος αγγελίας πριν την υποβολή
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Έλεγξε ότι όλα τα στοιχεία είναι σωστά πριν την υποβολή για έλεγχο από το Midora.
        </p>
      </div>

      <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-white">
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onGoToStep(item.step)}
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-sand/30"
            >
              {item.status === "complete" ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-teal" />
              ) : (
                <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
              )}
              <span
                className={cn(
                  "flex-1 text-sm",
                  item.status === "complete" ? "text-charcoal" : "text-amber-900"
                )}
              >
                {item.label}
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted" />
            </button>
          </li>
        ))}
      </ul>

      {registryValid && (
        <p className="text-xs text-muted">
          Κατάσταση αριθμού καταχώρισης:{" "}
          <span className="font-medium text-charcoal">{REGISTRY_FILLED_STATUS_LABEL}</span>
        </p>
      )}

      {!allComplete && (
        <p className="rounded-xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-sm text-amber-900">
          Ολοκλήρωσε τα στοιχεία με προειδοποίηση για να μπορέσεις να υποβάλεις την αγγελία.
        </p>
      )}
    </div>
  );
}

export function isReviewReady(
  fields: PortalListingFields,
  savedPhotoCount: number,
  needsAma: boolean,
  ownerDeclarationAccepted: boolean,
  registryDeclarationAccepted: boolean,
  platformDeclarationAccepted: boolean,
  termsPrivacyAccepted: boolean,
  listingPhoneReady: boolean
): boolean {
  return buildReviewItems(
    fields,
    savedPhotoCount,
    needsAma,
    ownerDeclarationAccepted,
    registryDeclarationAccepted,
    platformDeclarationAccepted,
    termsPrivacyAccepted,
    listingPhoneReady
  ).every((item) => item.status === "complete");
}
