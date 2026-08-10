/**
 * Deterministic seeded ordering for search results.
 * Same seed → same order across pages / back navigation.
 * New seed → new mix without ORDER BY RANDOM() or DB writes.
 */

const SEED_PARAM = "rs";

export function getResultSeedParam(): string {
  return SEED_PARAM;
}

/** Compact opaque seed for URL (no PII). */
export function createResultSeed(): string {
  const a = Math.floor(Math.random() * 0xffffffff);
  const b = Math.floor(Math.random() * 0xffffffff);
  return `${a.toString(36)}${b.toString(36)}`.slice(0, 12);
}

export function parseResultSeed(raw: string | null | undefined): string | null {
  const v = raw?.trim();
  if (!v || v.length < 4 || v.length > 32) return null;
  if (!/^[a-z0-9]+$/i.test(v)) return null;
  return v;
}

/** FNV-1a style mix — stable across JS engines for ASCII seeds + ids. */
export function hashSeededId(seed: string, id: string): number {
  let h = 2166136261;
  const input = `${seed}\0${id}`;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Stable order: primary by seeded hash, tie-break by listing id.
 * Does not mutate the input array.
 */
export function orderListingsBySeed<T extends { id: string }>(
  listings: T[],
  seed: string
): T[] {
  if (listings.length <= 1) return listings.slice();
  return listings
    .map((item, index) => ({
      item,
      index,
      rank: hashSeededId(seed, item.id),
    }))
    .sort((a, b) => {
      if (a.rank !== b.rank) return a.rank - b.rank;
      if (a.item.id < b.item.id) return -1;
      if (a.item.id > b.item.id) return 1;
      return a.index - b.index;
    })
    .map((entry) => entry.item);
}

/** Search fingerprint excluding pagination + seed + ephemeral map UI. */
export function listingsSearchFingerprint(params: URLSearchParams): string {
  const next = new URLSearchParams(params.toString());
  next.delete("page");
  next.delete(SEED_PARAM);
  next.delete("map");
  const keys = [...next.keys()].sort();
  return keys.map((k) => `${k}=${next.getAll(k).join(",")}`).join("&");
}

export function isBrowserReload(): boolean {
  if (typeof performance === "undefined") return false;
  const nav = performance.getEntriesByType("navigation")[0] as
    | PerformanceNavigationTiming
    | undefined;
  return nav?.type === "reload";
}
