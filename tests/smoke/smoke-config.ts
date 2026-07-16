/** Shared smoke-test configuration — update listing slug if seed changes. */
export const SMOKE_BASE_URL = process.env.SMOKE_BASE_URL ?? "http://127.0.0.1:3000";

/** Published demo listing from scripts/seed-owner-short-term-demo.ts */
export const SMOKE_LISTING_SLUG =
  process.env.SMOKE_LISTING_SLUG ?? "owner-short-term-thessaloniki";

/** Search results page (canonical public search — not /search) */
export const SMOKE_SEARCH_PATH = "/listings?rentalType=short_term";

export const PUBLIC_ROUTES = [
  { path: "/", name: "homepage", expectText: ["Midora"] },
  {
    path: SMOKE_SEARCH_PATH,
    name: "search-results",
    expectText: ["Midora"],
  },
  {
    path: `/listings/${SMOKE_LISTING_SLUG}`,
    name: "listing-detail",
    expectText: ["Διαθεσιμότητα", "Στείλε αίτημα"],
  },
] as const;

export const OWNER_ROUTES = [
  {
    path: "/dashboard",
    name: "dashboard-home",
    expectText: ["Midora"],
    allowLogin: true,
  },
  {
    path: "/dashboard/listings",
    name: "dashboard-listings",
    expectText: ["Midora"],
    expectAnyOf: ["Οι αγγελίες μου", "Σύνδεση", "Κάνε σύνδεση"],
    allowLogin: true,
  },
  {
    path: `/dashboard/listings/${SMOKE_LISTING_SLUG}`,
    name: "dashboard-listing-workspace",
    expectText: ["Midora"],
    expectAnyOf: ["Σύνδεση", "Κάνε σύνδεση", "Οι αγγελίες μου"],
    allowLogin: true,
  },
  {
    path: "/dashboard/profile",
    name: "dashboard-profile",
    expectText: ["Midora"],
    expectAnyOf: ["Κάνε σύνδεση", "Σύνδεση", "προφίλ", "Προφίλ"],
    allowLogin: true,
  },
  {
    path: "/dashboard/messages",
    name: "dashboard-messages",
    expectText: ["Midora"],
    expectAnyOf: ["Κάνε σύνδεση", "Σύνδεση", "Μηνύματα"],
    allowLogin: true,
  },
  {
    path: "/dashboard/requests",
    name: "dashboard-inquiries",
    expectText: ["Midora"],
    expectAnyOf: ["Κάνε σύνδεση", "Σύνδεση", "ενδιαφέροντα", "Αιτήματα"],
    allowLogin: true,
  },
] as const;
