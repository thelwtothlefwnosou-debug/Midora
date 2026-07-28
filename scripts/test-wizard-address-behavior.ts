/**
 * Address autocomplete / location section behavior checks (pure helpers).
 * Run: npx tsx scripts/test-wizard-address-behavior.ts
 */
import assert from "node:assert/strict";
import {
  parseStreetAndNumber,
  streetMatchesQuery,
} from "../src/lib/geocoding/geocode-utils";
import { listingTitleValidationError, LISTING_TITLE_MIN_ERROR } from "../src/lib/listing-wizard-validation";

function section(title: string) {
  console.log(`\n▸ ${title}`);
}

section("parseStreetAndNumber keeps typed street without inventing number");
assert.deepEqual(parseStreetAndNumber("Δαναών"), { street: "Δαναών", number: "" });
assert.deepEqual(parseStreetAndNumber("Δαναών 5"), { street: "Δαναών", number: "5" });

section("Suggestion relevance for video case δανα → not Πλαταιών");
assert.equal(streetMatchesQuery("Πλαταιών 19", "δανα"), false);
assert.equal(streetMatchesQuery("Δαναών", "δανα"), true);

section("Title whitespace / unicode edge cases");
assert.equal(listingTitleValidationError("\t\n"), "titleRequired");
assert.equal(listingTitleValidationError("α"), LISTING_TITLE_MIN_ERROR);
assert.equal(listingTitleValidationError("αβγδε"), null);

console.log("\n✅ Address behavior checks passed.");
