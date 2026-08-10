/** Default destination after login/signup when no redirect/next is provided. */
export const DEFAULT_POST_AUTH_PATH = "/";

/**
 * Safe internal path after login.
 * Allows homepage (`/`) as the default landing; blocks auth loops and open redirects.
 */
export function safePostAuthPath(path: string | null | undefined): string {
  const value = path?.trim() || DEFAULT_POST_AUTH_PATH;
  if (!value.startsWith("/") || value.startsWith("//")) return DEFAULT_POST_AUTH_PATH;
  if (
    value.startsWith("/login") ||
    value.startsWith("/register") ||
    value.startsWith("/auth/callback")
  ) {
    return DEFAULT_POST_AUTH_PATH;
  }
  return value;
}

/**
 * Origins allowed for Supabase emailRedirectTo / recovery redirectTo.
 * Prevents Host-header open redirects while keeping Preview + Production working.
 */
export function isAllowedAuthOrigin(origin: string): boolean {
  try {
    const url = new URL(origin);
    if (url.protocol !== "http:" && url.protocol !== "https:") return false;
    if (url.username || url.password) return false;
    const host = url.hostname.toLowerCase();
    if (host === "localhost" || host === "127.0.0.1") return true;
    if (host === "midora.vercel.app") return true;
    // Vercel preview / branch aliases for this project
    if (host.endsWith(".vercel.app") && host.includes("thelwtothlefwnosou-debugs-projects")) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function stripTrailingSlash(value: string): string {
  return value.replace(/\/$/, "");
}
