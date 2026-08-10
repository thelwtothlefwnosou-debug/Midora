import { isIP } from "node:net";

function isPrivateIpv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return true;
  const [a, b] = parts;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  if (a >= 224) return true;
  return false;
}

function isPrivateIpv6(ip: string): boolean {
  const normalized = ip.toLowerCase();
  if (normalized === "::1") return true;
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true;
  if (normalized.startsWith("fe80")) return true;
  if (normalized.startsWith("::ffff:")) {
    const v4 = normalized.slice("::ffff:".length);
    if (isIP(v4) === 4) return isPrivateIpv4(v4);
  }
  return false;
}

export function isBlockedHostname(hostname: string): boolean {
  const host = hostname.trim().toLowerCase().replace(/\.$/, "");
  if (!host) return true;
  if (host === "localhost") return true;
  if (host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) {
    return true;
  }
  if (host === "metadata.google.internal") return true;
  if (host === "metadata" || host.endsWith(".metadata.google.internal")) return true;

  const ipVersion = isIP(host);
  if (ipVersion === 4) return isPrivateIpv4(host);
  if (ipVersion === 6) return isPrivateIpv6(host);
  return false;
}

export function maskCalendarUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname || "/";
    const leaf = path.split("/").filter(Boolean).pop() ?? "calendar.ics";
    const maskedLeaf =
      leaf.length <= 8 ? "••••••••.ics" : `${leaf.slice(0, 4)}••••${leaf.slice(-4)}`;
    return `${parsed.protocol}//${parsed.hostname}/…/${maskedLeaf}`;
  } catch {
    return "https://…/••••••••.ics";
  }
}
