/**
 * Unit checks for wizard step validation + capacity/floor edge cases.
 * Run: npx tsx scripts/test-wizard-step-validation.ts
 */

import {
  buildReviewChecklist,
  capacityValidationError,
  isCapacityComplete,
  normalizeCapacityFields,
  parseOptionalInt,
} from "../src/lib/listing-wizard-step-validation";
import { parsePortalListingFields } from "../src/lib/listing-portal-payload";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function main() {
  console.log("\n🧪 listing-wizard-step-validation\n");

  assert(parseOptionalInt("0") === 0, "parse 0");
  assert(parseOptionalInt(0) === 0, "parse number 0");
  assert(parseOptionalInt("") === null, "empty → null");
  assert(parseOptionalInt("2") === 2, "parse 2");
  console.log("✓ parseOptionalInt");

  const floorZero = normalizeCapacityFields({
    maxGuests: "4",
    sqm: "55",
    bedrooms: "1",
    bathrooms: "1",
    floor: "0",
  });
  assert(floorZero.floor === 0, "floor 0 normalized");
  assert(capacityValidationError(floorZero) === null, "floor 0 is valid capacity");
  console.log("✓ floor 0 capacity valid");

  const missingFloor = normalizeCapacityFields({
    maxGuests: "4",
    sqm: "55",
    bedrooms: "1",
    bathrooms: "1",
    floor: "",
  });
  assert(capacityValidationError(missingFloor) != null, "empty floor invalid");
  console.log("✓ empty floor invalid");

  const fd = new FormData();
  fd.set("rental_type", "short_term");
  fd.set("supports_short_term", "on");
  fd.set("title", "Όμορφο διαμέρισμα κέντρο");
  fd.set("description", "Αρκετά μεγάλη περιγραφή για υποβολή ελέγχου.");
  fd.set("city", "Αθήνα");
  fd.set("area", "Κολωνάκι");
  fd.set("address_street", "Σκουφά");
  fd.set("address_number", "12");
  fd.set("address_postal_code", "10673");
  fd.set("property_type", "apartment");
  fd.set("sqm", "65");
  fd.set("bedrooms", "2");
  fd.set("bathrooms", "1");
  fd.set("floor", "0");
  fd.set("max_guests", "4");
  fd.set("price_per_night", "80");
  fd.set("included_guests", "2");
  fd.set("extra_guest_fee_per_night", "10");
  fd.set("short_min_stay_label", "2 νύχτες");
  fd.set("availability_status", "upon_request");
  fd.set("contact_name", "Νίκος");
  fd.set("contact_phone", "+306912345678");
  fd.set("latitude", "37.98");
  fd.set("longitude", "23.73");
  fd.set("owner_responsibility_accepted", "on");
  fd.set("platform_role_accepted", "on");
  fd.set("tax_obligation_accepted", "on");
  fd.set("authority_disclosure_accepted", "on");
  fd.set("terms_privacy_accepted", "on");
  fd.set("ama_declaration_accepted", "on");
  fd.set("ama_number", "12345678901");
  fd.set("legal_registry_type", "ama");

  const fields = parsePortalListingFields(fd);
  assert(fields.floor === 0, "portal floor 0");
  assert(isCapacityComplete(fields), "capacity complete with floor 0");

  const items = buildReviewChecklist({
    fields,
    savedPhotoCount: 5,
    needsAma: true,
    ownerDeclarationAccepted: true,
    registryDeclarationAccepted: true,
    platformDeclarationAccepted: true,
    taxDeclarationAccepted: true,
    authorityDeclarationAccepted: true,
    termsPrivacyAccepted: true,
    listingPhoneReady: true,
  });
  const capacity = items.find((i) => i.id === "capacity");
  assert(capacity?.status === "complete", "review capacity complete for floor 0");
  console.log("✓ review checklist capacity with floor 0");

  console.log("\n✅ wizard step validation tests passed\n");
}

main();
