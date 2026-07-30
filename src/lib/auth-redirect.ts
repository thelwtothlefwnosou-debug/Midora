/** Safe internal path after login — never bounce back to homepage or auth screens. */
export function safePostAuthPath(path: string | null | undefined): string {
  const value = path?.trim() || "/dashboard/profile";
  if (!value.startsWith("/") || value.startsWith("//")) return "/dashboard";
  if (
    value === "/" ||
    value.startsWith("/login") ||
    value.startsWith("/register") ||
    value.startsWith("/auth/callback")
  ) {
    return "/dashboard";
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
