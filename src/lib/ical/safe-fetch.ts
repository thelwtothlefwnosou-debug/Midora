import "server-only";
import { lookup } from "node:dns/promises";
import { isBlockedHostname } from "@/lib/ical/url-guards";

export type SafeFetchResult =
  | { ok: true; body: string; finalUrl: string; status: number }
  | { ok: false; error: "invalid_url" | "blocked_host" | "protocol" | "redirect" | "timeout" | "too_large" | "http_error" | "dns" | "network" };

const MAX_REDIRECTS = 3;
const MAX_BYTES = 1_500_000;
const TIMEOUT_MS = 12_000;

export { isBlockedHostname, maskCalendarUrl } from "@/lib/ical/url-guards";

async function assertPublicHostname(hostname: string): Promise<boolean> {
  if (isBlockedHostname(hostname)) return false;
  try {
    const records = await lookup(hostname, { all: true, verbatim: true });
    if (!records.length) return false;
    for (const record of records) {
      if (isBlockedHostname(record.address)) return false;
    }
    return true;
  } catch {
    return false;
  }
}

function parseHttpUrl(raw: string): URL | null {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  if (url.username || url.password) return null;
  return url;
}

/**
 * SSRF-resistant fetch for user-supplied calendar URLs.
 * Resolves DNS before each hop and blocks private/link-local/metadata targets.
 */
export async function safeFetchText(rawUrl: string): Promise<SafeFetchResult> {
  let current = parseHttpUrl(rawUrl);
  if (!current) return { ok: false, error: "invalid_url" };

  if (current.protocol !== "https:" && current.protocol !== "http:") {
    return { ok: false, error: "protocol" };
  }

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const hostOk = await assertPublicHostname(current.hostname);
    if (!hostOk) return { ok: false, error: "blocked_host" };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(current.toString(), {
        method: "GET",
        redirect: "manual",
        signal: controller.signal,
        headers: {
          Accept: "text/calendar, text/plain, application/octet-stream, */*",
          "User-Agent": "MidoraCalendarSync/1.0",
        },
      });

      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get("location");
        if (!location) return { ok: false, error: "redirect" };
        let next: URL;
        try {
          next = new URL(location, current);
        } catch {
          return { ok: false, error: "redirect" };
        }
        if (next.protocol !== "https:" && next.protocol !== "http:") {
          return { ok: false, error: "protocol" };
        }
        if (hop === MAX_REDIRECTS) return { ok: false, error: "redirect" };
        current = next;
        continue;
      }

      if (!response.ok) return { ok: false, error: "http_error" };

      const lengthHeader = response.headers.get("content-length");
      if (lengthHeader && Number(lengthHeader) > MAX_BYTES) {
        return { ok: false, error: "too_large" };
      }

      const reader = response.body?.getReader();
      if (!reader) return { ok: false, error: "network" };

      const chunks: Uint8Array[] = [];
      let total = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          total += value.byteLength;
          if (total > MAX_BYTES) {
            try {
              await reader.cancel();
            } catch {
              /* ignore */
            }
            return { ok: false, error: "too_large" };
          }
          chunks.push(value);
        }
      }

      const body = Buffer.concat(chunks.map((c) => Buffer.from(c))).toString("utf8");
      return { ok: true, body, finalUrl: current.toString(), status: response.status };
    } catch (err) {
      const name = err instanceof Error ? err.name : "";
      if (name === "AbortError") return { ok: false, error: "timeout" };
      return { ok: false, error: "network" };
    } finally {
      clearTimeout(timer);
    }
  }

  return { ok: false, error: "redirect" };
}
