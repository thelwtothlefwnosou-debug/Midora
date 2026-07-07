import { NextResponse } from "next/server";
import { checkRateLimit, rateLimitKey, type RateLimitResult } from "@/lib/rate-limit";

export function enforceRateLimit(
  request: Request,
  scope: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  return checkRateLimit(rateLimitKey(request, scope), limit, windowMs);
}

export function rateLimitedResponse(result: RateLimitResult) {
  const headers: Record<string, string> = {};
  if (result.retryAfterSec) {
    headers["Retry-After"] = String(result.retryAfterSec);
  }
  return NextResponse.json(
    { error: "Πολλά αιτήματα. Δοκίμασε ξανά σε λίγα δευτερόλεπτα." },
    { status: 429, headers }
  );
}
