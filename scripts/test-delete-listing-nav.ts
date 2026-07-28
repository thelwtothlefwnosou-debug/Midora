/**
 * Unit checks for delete-listing navigation intent.
 * Run: npm run test:delete-listing-nav
 */

import {
  DELETE_LISTING_ERROR_TOAST,
  DELETE_LISTING_SUCCESS_TOAST,
  resolveDeleteListingNavIntent,
} from "../src/lib/delete-listing-nav";
import { OWNER_LISTINGS_LIST_PATH } from "../src/lib/owner-listings-nav";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function main() {
  console.log("\n🧪 delete-listing-nav\n");

  const withOnDeleted = resolveDeleteListingNavIntent({ hasOnDeleted: true });
  assert(withOnDeleted.kind === "local_remove", "hasOnDeleted → local_remove");
  console.log("✓ hasOnDeleted:true → local_remove");

  const without = resolveDeleteListingNavIntent({ hasOnDeleted: false });
  assert(without.kind === "navigate", "default → navigate");
  assert(
    without.kind === "navigate" && without.href === OWNER_LISTINGS_LIST_PATH,
    `default href is ${OWNER_LISTINGS_LIST_PATH}`
  );
  console.log(`✓ without onDeleted → navigate ${OWNER_LISTINGS_LIST_PATH}`);

  const custom = resolveDeleteListingNavIntent({
    hasOnDeleted: false,
    redirectTo: "/dashboard/listings?tab=draft",
  });
  assert(
    custom.kind === "navigate" && custom.href === "/dashboard/listings?tab=draft",
    "custom redirectTo respected"
  );
  console.log("✓ custom redirectTo respected");

  const stay = resolveDeleteListingNavIntent({
    hasOnDeleted: false,
    redirectTo: null,
  });
  assert(stay.kind === "none", "redirectTo null → none");
  console.log("✓ redirectTo:null → none");

  const intents = [withOnDeleted, without, custom, stay];
  for (const intent of intents) {
    if (intent.kind === "navigate") {
      assert(intent.href !== "/dashboard", "never navigate to /dashboard");
      assert(
        !intent.href.startsWith("/dashboard?") && intent.href !== "/dashboard/",
        "never navigate to dashboard overview"
      );
    }
  }
  console.log("✓ never suggests /dashboard overview");

  assert(
    DELETE_LISTING_SUCCESS_TOAST === "Η αγγελία διαγράφηκε επιτυχώς",
    "success toast copy"
  );
  assert(
    DELETE_LISTING_ERROR_TOAST ===
      "Δεν ήταν δυνατή η διαγραφή της αγγελίας. Δοκίμασε ξανά.",
    "error toast copy"
  );
  console.log("✓ toast constants");

  console.log("\n✅ delete-listing-nav OK\n");
}

try {
  main();
} catch (err) {
  console.error("❌", err instanceof Error ? err.message : err);
  process.exit(1);
}
