import type { Listing } from "@/lib/types";

/** Day index when organic boost begins (0 = from first day live). */
const ORGANIC_START_DAYS = 0;
/** Base simulated views per day after warm-up (plus small daily variation). */
const ORGANIC_DAILY_BASE = 5;
/** Matches listing subscription length (renew / checkout). */
const SUBSCRIPTION_MONTHS = 1;

export type ListingViewListing = Pick<
  Listing,
  "id" | "published_at" | "created_at" | "expires_at" | "status"
>;

function hashSeed(listingId: string, dayIndex: number): number {
  let h = 2166136261;
  const s = `${listingId}:${dayIndex}`;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Deterministic 5–6 extra views per day after the warm-up period. */
function dailyOrganicIncrement(listingId: string, dayIndex: number): number {
  const h = hashSeed(listingId, dayIndex);
  return ORGANIC_DAILY_BASE + (h % 2);
}

function parseDate(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

function daysBetween(start: Date, end: Date): number {
  return Math.floor((end.getTime() - start.getTime()) / 86400000);
}

function subtractMonths(date: Date, months: number): Date {
  const copy = new Date(date);
  copy.setMonth(copy.getMonth() - months);
  return copy;
}

/**
 * Current subscription window for organic views.
 * Stops at expires_at; on renew a new window starts (~1 month before new expires_at).
 */
function getSubscriptionOrganicWindow(
  listing: ListingViewListing,
  now = new Date()
): { start: Date; end: Date } | null {
  if (listing.status !== "approved") return null;

  const published = parseDate(listing.published_at) ?? parseDate(listing.created_at);
  if (!published) return null;

  const expiresAt = parseDate(listing.expires_at);

  if (!expiresAt) {
    return { start: published, end: now };
  }

  let periodStart = subtractMonths(expiresAt, SUBSCRIPTION_MONTHS);
  if (published > periodStart) {
    periodStart = published;
  }

  const periodEnd = expiresAt < now ? expiresAt : now;
  if (periodEnd <= periodStart) return null;

  return { start: periodStart, end: periodEnd };
}

export function computeOrganicViewBoost(
  listing: ListingViewListing,
  now = new Date()
): number {
  const window = getSubscriptionOrganicWindow(listing, now);
  if (!window) return 0;

  const elapsed = daysBetween(window.start, window.end);
  if (elapsed < ORGANIC_START_DAYS) return 0;

  let boost = 0;
  for (let day = ORGANIC_START_DAYS; day <= elapsed; day++) {
    boost += dailyOrganicIncrement(listing.id, day);
  }
  return boost;
}

export function getDisplayViewCount(listing: ListingViewListing & Pick<Listing, "view_count">): number {
  const real = listing.view_count ?? 0;
  return real + computeOrganicViewBoost(listing);
}

export function formatViewCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  }
  return String(count);
}
