import { intlLocale } from "@/lib/locale-fallbacks";

/** Compact relative time for notification rows (locale-aware). */
export function formatNotificationRelativeTime(
  iso: string,
  locale?: string | null
): string {
  const loc = intlLocale(locale);
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);

  try {
    const rtf = new Intl.RelativeTimeFormat(loc, { numeric: "auto" });
    if (mins < 1) return rtf.format(0, "minute");
    if (mins < 60) return rtf.format(-mins, "minute");
    const hours = Math.floor(mins / 60);
    if (hours < 24) return rtf.format(-hours, "hour");
    const days = Math.floor(hours / 24);
    if (days < 30) return rtf.format(-days, "day");
    return new Date(iso).toLocaleDateString(loc, {
      day: "numeric",
      month: "short",
    });
  } catch {
    if (mins < 1) return "now";
    if (mins < 60) return `${mins}m`;
    return new Date(iso).toLocaleDateString("en-GB");
  }
}
