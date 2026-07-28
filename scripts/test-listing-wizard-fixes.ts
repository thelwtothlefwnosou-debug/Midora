/**
 * Unit checks for listing wizard title / description / amenities / geocode helpers.
 * Run: npx tsx scripts/test-listing-wizard-fixes.ts
 */
import assert from "node:assert/strict";
import {
  LISTING_DESCRIPTION_MAX_ERROR,
  LISTING_TITLE_MIN_ERROR,
  MAX_LISTING_DESCRIPTION_LENGTH,
  MIN_LISTING_DESCRIPTION_LENGTH,
  MIN_LISTING_TITLE_LENGTH,
  isListingDescriptionWithinMax,
  isListingTitleLongEnough,
  listingDescriptionGraphemeLength,
  listingDescriptionValidationError,
  listingTitleGraphemeLength,
  listingTitleValidationError,
} from "../src/lib/listing-wizard-validation";
import { countGraphemes } from "../src/lib/text-graphemes";
import {
  isKnownAmenityKey,
  normalizeAmenityKey,
  amenityLabel,
} from "../src/lib/amenities-catalog";
import {
  WIZARD_AMENITY_SECTIONS,
  WIZARD_POPULAR_AMENITY_KEYS,
} from "../src/lib/amenities-wizard-groups";
import { streetMatchesQuery } from "../src/lib/geocoding/geocode-utils";

function section(title: string) {
  console.log(`\n▸ ${title}`);
}

async function main() {
  section("Title min length = 5 + graphemes");
  assert.equal(MIN_LISTING_TITLE_LENGTH, 5);
  assert.equal(listingTitleGraphemeLength("   "), 0);
  assert.equal(listingTitleGraphemeLength("abcd"), 4);
  assert.equal(listingTitleGraphemeLength("abcde"), 5);
  assert.equal(isListingTitleLongEnough("άβγδ"), false);
  assert.equal(isListingTitleLongEnough("άβγδε"), true);
  assert.equal(listingTitleValidationError("   "), "titleRequired");
  assert.equal(listingTitleValidationError("αβγδ"), LISTING_TITLE_MIN_ERROR);
  assert.equal(listingTitleValidationError("αβγδε"), null);
  assert.equal(listingTitleValidationError("  αβγδ  "), LISTING_TITLE_MIN_ERROR);
  assert.equal(listingTitleValidationError("", { requireNonEmpty: false }), null);
  assert.equal(
    listingTitleValidationError("ab", { requireNonEmpty: false }),
    LISTING_TITLE_MIN_ERROR
  );
  const accented = "έ";
  assert.ok(countGraphemes(accented) >= 1);
  assert.ok(countGraphemes("🇬🇷") <= 2);

  section("Description max = 1000 + optional empty + graphemes");
  assert.equal(MIN_LISTING_DESCRIPTION_LENGTH, 10);
  assert.equal(MAX_LISTING_DESCRIPTION_LENGTH, 1000);
  assert.equal(listingDescriptionValidationError(""), null);
  assert.equal(listingDescriptionValidationError("   "), null);
  assert.equal(
    listingDescriptionValidationError("", { forSubmission: true }),
    "descriptionRequired"
  );
  assert.equal(
    listingDescriptionValidationError("αβγδεζηθι", { forSubmission: true }),
    "descriptionMinLength"
  );
  assert.equal(
    listingDescriptionValidationError("αβγδεζηθικ", { forSubmission: true }),
    null
  );

  const exactly1000 = "α".repeat(1000);
  assert.equal(listingDescriptionGraphemeLength(exactly1000), 1000);
  assert.equal(isListingDescriptionWithinMax(exactly1000), true);
  assert.equal(listingDescriptionValidationError(exactly1000), null);
  assert.equal(
    listingDescriptionValidationError(exactly1000, { forSubmission: true }),
    null
  );

  const over1001 = "β".repeat(1001);
  assert.equal(listingDescriptionGraphemeLength(over1001), 1001);
  assert.equal(isListingDescriptionWithinMax(over1001), false);
  assert.equal(listingDescriptionValidationError(over1001), LISTING_DESCRIPTION_MAX_ERROR);
  assert.equal(
    listingDescriptionValidationError(over1001, { forSubmission: true }),
    LISTING_DESCRIPTION_MAX_ERROR
  );

  const greekMixed = "Καλημέρα ".repeat(50) + "🏠".repeat(10);
  assert.ok(listingDescriptionGraphemeLength(greekMixed) > 0);
  assert.equal(
    listingDescriptionGraphemeLength(greekMixed),
    countGraphemes(greekMixed)
  );
  // Combining accent: same as countGraphemes (Segmenter when available)
  const combining = "ε\u0301";
  assert.equal(listingDescriptionGraphemeLength(combining), countGraphemes(combining));

  // Counter format contract (UI renders `${n} / ${MAX}`)
  const counterSample = `${listingDescriptionGraphemeLength(exactly1000.slice(0, 328))} / ${MAX_LISTING_DESCRIPTION_LENGTH}`;
  assert.equal(counterSample, "328 / 1000");

  section("Amenities catalog — wizard keys resolve");
  for (const key of WIZARD_POPULAR_AMENITY_KEYS) {
    assert.ok(isKnownAmenityKey(key), `popular missing: ${key}`);
  }
  let total = 0;
  for (const sec of WIZARD_AMENITY_SECTIONS) {
    for (const key of sec.keys) {
      assert.ok(isKnownAmenityKey(key), `section ${sec.id} missing: ${key}`);
      assert.ok(amenityLabel(key).length > 0);
      total += 1;
    }
  }
  assert.ok(total >= 40, `expected expanded catalog, got ${total}`);
  assert.equal(normalizeAmenityKey("veranda"), "balcony");
  assert.equal(normalizeAmenityKey("toiletries"), "personal_toiletries");
  assert.equal(normalizeAmenityKey("kids_high_chair"), "high_chair");
  assert.equal(normalizeAmenityKey("wifi"), "wifi");
  assert.ok(isKnownAmenityKey("wifi"));

  section("Street match filter rejects unrelated suggestions");
  assert.equal(streetMatchesQuery("Πλαταιών", "δανα"), false);
  assert.equal(streetMatchesQuery("Δαναών", "δανα"), true);
  assert.equal(streetMatchesQuery("Δαναών", "δαναων"), true);
  assert.equal(streetMatchesQuery("Καυκάσου", "καυ"), true);
  assert.equal(streetMatchesQuery("Καυκάσου", "xyz"), false);

  section("Autosave race helpers (generation semantics)");
  let generation = 0;
  const results: string[] = [];
  async function fakeSave(label: string, ms: number) {
    const gen = ++generation;
    await new Promise((r) => setTimeout(r, ms));
    if (gen === generation) results.push(label);
  }
  await Promise.all([fakeSave("slow", 40), fakeSave("fast", 5)]);
  assert.deepEqual(results, ["fast"]);

  console.log("\n✅ All listing-wizard fix checks passed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
