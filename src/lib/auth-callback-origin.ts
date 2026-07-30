import "server-only";

import { headers } from "next/headers";
import {
  isAllowedAuthOrigin,
  safePostAuthPath,
  stripTrailingSlash,
} from "@/lib/auth-redirect";

/**
 * Base origin for auth email links (confirm / recover).
 * Prefer the request Host so Preview stays on Preview; never hardcode a Preview URL.
 * Falls back to VERCEL_URL, then NEXT_PUBLIC_APP_URL (Production), then localhost.
 *
 * Server-only — do not import from client components or middleware.
 */
export async function getAuthCallbackOrigin(): Promise<string> {
  try {
    const h = await headers();
    const host = (h.get("x-forwarded-host") || h.get("host") || "").split(",")[0]?.trim();
    const proto = (h.get("x-forwarded-proto") || "https").split(",")[0]?.trim() || "https";
    if (host) {
      const origin = stripTrailingSlash(`${proto}://${host}`);
      if (isAllowedAuthOrigin(origin)) return origin;
    }
  } catch {
    // headers() unavailable outside a request — fall through
  }

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    const origin = stripTrailingSlash(
      vercel.startsWith("http") ? vercel : `https://${vercel}`
    );
    if (isAllowedAuthOrigin(origin)) return origin;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (appUrl) {
    const origin = stripTrailingSlash(appUrl);
    if (isAllowedAuthOrigin(origin)) return origin;
  }

  return "http://localhost:3000";
}

/** Full /auth/callback URL with a safe relative next path. */
export async function buildAuthCallbackUrl(nextPath: string): Promise<string> {
  const origin = await getAuthCallbackOrigin();
  const next = safePostAuthPath(nextPath);
  return `${origin}/auth/callback?next=${encodeURIComponent(next)}`;
}
