/** Shared Supabase env checks (server + client safe) */

function stripEnvQuotes(value: string): string {
  return value.trim().replace(/^["']|["']$/g, "");
}

/** Normalize common copy-paste mistakes (missing https://, bare project ref). */
export function normalizeSupabaseUrl(raw: string): string | null {
  let url = stripEnvQuotes(raw);
  if (!url) return null;

  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = `https://${url}`;
  }

  // Bare project ref, e.g. "kfbdssafcyqsrvrwzdto"
  if (!url.includes(".") && /^[a-z0-9-]+$/i.test(url.replace(/^https:\/\//, ""))) {
    url = `https://${url.replace(/^https:\/\//, "")}.supabase.co`;
  }

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return parsed.origin;
  } catch {
    return null;
  }
}

export function isSupabaseConfigured() {
  return Boolean(
    normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "") &&
      stripEnvQuotes(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "")
  );
}

export function isServiceRoleConfigured() {
  return Boolean(
    isSupabaseConfigured() &&
      stripEnvQuotes(process.env.SUPABASE_SERVICE_ROLE_KEY ?? "")
  );
}

/** Demo seed listings — μόνο αν δεν υπάρχει Supabase ή αν είναι ρητά ενεργό */
export function shouldUseSeedListings() {
  if (!isSupabaseConfigured()) return true;
  return process.env.NEXT_PUBLIC_USE_SEED_LISTINGS === "true";
}

/** @deprecated Use shouldUseSeedListings */
export const useSeedListings = shouldUseSeedListings;

export function getSupabaseUrl() {
  const url = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");
  if (!url) {
    throw new Error("Invalid NEXT_PUBLIC_SUPABASE_URL");
  }
  return url;
}

export function getSupabaseAnonKey() {
  return stripEnvQuotes(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}
