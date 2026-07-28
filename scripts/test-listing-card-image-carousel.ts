/**
 * Unit checks for listing card image carousel helpers.
 * Run: npm run test:listing-card-carousel
 */

import {
  collectListingCardPhotoUrls,
  isolateCarouselControlEvent,
  resolveCarouselActiveDotIndex,
  resolveCarouselDotCount,
  resolveCarouselSwipeDirection,
  stepCarouselIndex,
} from "../src/lib/listing-card-photos";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEqual<T>(actual: T, expected: T, message: string) {
  const same = JSON.stringify(actual) === JSON.stringify(expected);
  if (!same) {
    throw new Error(
      `${message}\n  expected: ${JSON.stringify(expected)}\n  actual:   ${JSON.stringify(actual)}`
    );
  }
}

function main() {
  console.log("\n🧪 listing-card-image-carousel\n");

  // No photos
  assertEqual(collectListingCardPhotoUrls([]), [], "empty images → no urls");
  assertEqual(collectListingCardPhotoUrls(null), [], "null images → no urls");
  assertEqual(
    collectListingCardPhotoUrls([{ url: "   ", media_type: "photo" }]),
    [],
    "blank url ignored"
  );
  assertEqual(
    collectListingCardPhotoUrls([{ url: "https://cdn.example/a.jpg", media_type: "video" }]),
    [],
    "videos ignored"
  );
  console.log("✓ no photo / empty / video");

  // One photo
  assertEqual(
    collectListingCardPhotoUrls([{ url: "https://cdn.example/only.jpg", sort_order: 0 }]),
    ["https://cdn.example/only.jpg"],
    "single photo"
  );
  console.log("✓ one photo");

  // Many photos — cover first, then sort_order
  assertEqual(
    collectListingCardPhotoUrls([
      { url: "https://cdn.example/2.jpg", sort_order: 2, is_cover: false },
      { url: "https://cdn.example/cover.jpg", sort_order: 9, is_cover: true },
      { url: "https://cdn.example/1.jpg", sort_order: 1, is_cover: false },
    ]),
    [
      "https://cdn.example/cover.jpg",
      "https://cdn.example/1.jpg",
      "https://cdn.example/2.jpg",
    ],
    "cover first then sort_order"
  );
  console.log("✓ many photos cover-first order");

  // Duplicate / empty URLs
  assertEqual(
    collectListingCardPhotoUrls([
      { url: "https://cdn.example/a.jpg", sort_order: 0, is_cover: true },
      { url: "", sort_order: 1 },
      { url: "https://cdn.example/a.jpg", sort_order: 2 },
      { url: "https://cdn.example/b.jpg", sort_order: 3 },
      { url: null, sort_order: 4 },
    ]),
    ["https://cdn.example/a.jpg", "https://cdn.example/b.jpg"],
    "dedupe + skip empty"
  );
  console.log("✓ duplicate/empty URLs filtered");

  // Prev / next wrap-around
  assertEqual(stepCarouselIndex(0, 3, 1), 1, "0 +1 → 1");
  assertEqual(stepCarouselIndex(2, 3, 1), 0, "wrap next");
  assertEqual(stepCarouselIndex(0, 3, -1), 2, "wrap prev");
  assertEqual(stepCarouselIndex(1, 3, -1), 0, "1 -1 → 0");
  assertEqual(stepCarouselIndex(0, 1, 1), 0, "single stays 0");
  assertEqual(stepCarouselIndex(5, 0, 1), 0, "empty length → 0");
  console.log("✓ prev/next wrap-around");

  // Independent per-card indices (pure): two counters do not interfere
  let cardA = 0;
  let cardB = 0;
  cardA = stepCarouselIndex(cardA, 4, 1);
  cardA = stepCarouselIndex(cardA, 4, 1);
  cardB = stepCarouselIndex(cardB, 8, -1);
  assertEqual(cardA, 2, "card A index independent");
  assertEqual(cardB, 7, "card B index independent");
  console.log("✓ independent state per card");

  // Swipe
  assertEqual(resolveCarouselSwipeDirection(-50, 5), "next", "swipe left → next");
  assertEqual(resolveCarouselSwipeDirection(50, 5), "prev", "swipe right → prev");
  assertEqual(resolveCarouselSwipeDirection(-20, 0), null, "below threshold ignored");
  assertEqual(resolveCarouselSwipeDirection(-80, 100), null, "vertical dominant ignored");
  console.log("✓ swipe direction");

  // Keyboard mapping is the same step helper (±1)
  assertEqual(stepCarouselIndex(0, 5, -1), 4, "keyboard prev wraps");
  assertEqual(stepCarouselIndex(4, 5, 1), 0, "keyboard next wraps");
  console.log("✓ keyboard step mapping");

  // Click isolation helper
  let prevented = false;
  let stopped = false;
  isolateCarouselControlEvent({
    preventDefault: () => {
      prevented = true;
    },
    stopPropagation: () => {
      stopped = true;
    },
  });
  assert(prevented && stopped, "controls call preventDefault + stopPropagation");
  console.log("✓ arrow click isolation helper");

  // Optional max still works; card carousel uses max: null for all photos
  assertEqual(
    collectListingCardPhotoUrls(
      Array.from({ length: 12 }, (_, i) => ({
        url: `https://cdn.example/${i}.jpg`,
        sort_order: i,
      })),
      { max: 8 }
    ).length,
    8,
    "explicit max 8 still respected"
  );
  assertEqual(
    collectListingCardPhotoUrls(
      Array.from({ length: 12 }, (_, i) => ({
        url: `https://cdn.example/${i}.jpg`,
        sort_order: i,
      })),
      { max: null }
    ).length,
    12,
    "max null → all photos"
  );
  console.log("✓ photo limit max / unlimited");

  // Dots capped at 5; arrows/scroll cover all photos
  assertEqual(resolveCarouselDotCount(0), 0, "0 → no dots");
  assertEqual(resolveCarouselDotCount(1), 0, "1 → no dots");
  assertEqual(resolveCarouselDotCount(4), 4, "4 → 4 dots");
  assertEqual(resolveCarouselDotCount(8), 5, "8 → 5 dots max");
  assertEqual(resolveCarouselActiveDotIndex(0, 8), 0, "first photo → first dot");
  assertEqual(resolveCarouselActiveDotIndex(7, 8), 4, "last photo → last of 5 dots");
  assertEqual(resolveCarouselActiveDotIndex(2, 4), 2, "≤5 photos map 1:1");
  console.log("✓ dots capped at 5 while scrolling all photos");

  console.log("\n✅ listing-card-image-carousel OK\n");
}

try {
  main();
} catch (err) {
  console.error("❌", err instanceof Error ? err.message : err);
  process.exit(1);
}
