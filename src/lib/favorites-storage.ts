/** localStorage fallback when Supabase is not configured. TODO: remove after full Supabase migration. */
const STORAGE_KEY = "midora_favorites";

export function getLocalFavoriteIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export function isLocalFavorite(listingId: string): boolean {
  return getLocalFavoriteIds().includes(listingId);
}

/** Returns new favorited state. */
export function toggleLocalFavorite(listingId: string): boolean {
  const ids = getLocalFavoriteIds();
  const exists = ids.includes(listingId);
  const next = exists ? ids.filter((id) => id !== listingId) : [...ids, listingId];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("midora:favorites-changed"));
  return !exists;
}

export const PENDING_FAVORITE_KEY = "midora_pending_favorite";
