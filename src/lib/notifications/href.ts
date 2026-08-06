/**
 * Only allow same-origin relative dashboard/listing paths.
 * Blocks open redirects (//evil, https:, javascript:, etc.).
 */
export function isSafeNotificationHref(href: string): boolean {
  if (typeof href !== "string") return false;
  const trimmed = href.trim();
  if (!trimmed.startsWith("/")) return false;
  if (trimmed.startsWith("//")) return false;
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return false;
  if (trimmed.includes("\\") || trimmed.includes("\0")) return false;
  // Allow common Midora destinations only.
  return (
    trimmed.startsWith("/dashboard") ||
    trimmed.startsWith("/listings/") ||
    trimmed === "/listings"
  );
}

export function assertSafeNotificationHref(href: string): string {
  const trimmed = href.trim();
  if (!isSafeNotificationHref(trimmed)) {
    throw new Error(`Unsafe notification href: ${href}`);
  }
  return trimmed;
}
