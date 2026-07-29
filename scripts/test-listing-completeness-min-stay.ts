/**
 * Quick regression checks for listing completeness / min_stay.
 * Run: npx tsx scripts/test-listing-completeness-min-stay.ts
 */
import assert from "node:assert/strict";
import {
  isShortTermMinStayComplete,
  shortTermCompletenessItems,
  completenessPercent,
} from "../src/lib/listing-completeness";
import type { ListingWithImages } from "../src/lib/types";

function baseListing(
  overrides: Partial<ListingWithImages> = {}
): ListingWithImages {
  return {
    id: "test",
    user_id: "u",
    title: "Test listing title long enough",
    city: "Πάτρα",
    area: "Κέντρο",
    address_street: "Οδός",
    description: "Αρκετά μεγάλη περιγραφή για αγγελία που περνάει το min length.",
    price_per_night: 50,
    max_guests: 2,
    rental_type: "short_term",
    supports_short_term: true,
    availability_status: "available",
    ama_number: "1234567890",
    legal_registry_type: "ama",
    owner_responsibility_accepted: true,
    platform_role_accepted: true,
    terms_privacy_accepted: true,
    tax_obligation_accepted: true,
    authority_disclosure_accepted: true,
    ama_declaration_accepted: true,
    min_stay_label: null,
    minimum_stay_nights: null,
    listing_images: [],
    ...overrides,
  } as ListingWithImages;
}

assert.equal(isShortTermMinStayComplete({ min_stay_label: "Κατόπιν συνεννόησης", minimum_stay_nights: null }), true);
assert.equal(isShortTermMinStayComplete({ min_stay_label: "2 νύχτες", minimum_stay_nights: null }), true);
assert.equal(isShortTermMinStayComplete({ min_stay_label: "  ", minimum_stay_nights: null }), false);
assert.equal(isShortTermMinStayComplete({ min_stay_label: null, minimum_stay_nights: 2 }), true);

const listing = baseListing({ min_stay_label: "Κατόπιν συνεννόησης" });
const items = shortTermCompletenessItems(listing, 5);
const minStay = items.find((i) => i.id === "min_stay");
assert.ok(minStay?.done, "Κατόπιν συνεννόησης must count as complete min_stay");
assert.equal(completenessPercent(items), 100);

console.log("test-listing-completeness-min-stay: PASS");
