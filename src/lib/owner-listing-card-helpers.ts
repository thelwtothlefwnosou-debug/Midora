import type { OwnerListingRowModel } from "@/lib/owner-listings-page";
import { formatOwnerListingDate } from "@/lib/dashboard-listings";
import { ownerListingCompletenessItems } from "@/lib/owner-dashboard";
import { pickLocale } from "@/lib/locale-fallbacks";

type OwnerListMetaT = (
  key: "guestsCount" | "bedroomsCount" | "bathroomsCount" | "sqmCount",
  values: { count: number }
) => string;

export function formatOwnerPropertyMeta(
  row: OwnerListingRowModel,
  t: OwnerListMetaT
): string {
  const { listing } = row;
  const parts: string[] = [];
  const guests = listing.max_guests ?? listing.included_guests;
  if (guests) parts.push(t("guestsCount", { count: guests }));
  if (listing.bedrooms) parts.push(t("bedroomsCount", { count: listing.bedrooms }));
  if (listing.bathrooms) parts.push(t("bathroomsCount", { count: listing.bathrooms }));
  if (listing.sqm) parts.push(t("sqmCount", { count: listing.sqm }));
  return parts.join(" · ");
}

type LifecycleT = (
  key: string,
  values?: Record<string, string | number>
) => string;

export function ownerListingLifecycle(
  row: OwnerListingRowModel,
  t?: LifecycleT,
  locale?: string
): {
  text: string;
  tone: "neutral" | "green" | "amber" | "warning" | "expired";
  textKey?: string;
} {
  const { listing, ownerStatusKey, daysUntilExpiry } = row;

  if (ownerStatusKey === "published" || ownerStatusKey === "paused") {
    if (daysUntilExpiry == null) {
      return {
        textKey: "activeNoExpiry",
        text: t
          ? t("activeNoExpiry")
          : pickLocale(locale, "Ενεργή χωρίς ημερομηνία λήξης", "Active with no expiry date"),
        tone: "neutral",
      };
    }
    if (daysUntilExpiry < 0) {
      const d = formatOwnerListingDate(listing.expires_at);
      return {
        textKey: "expiredOn",
        text: t
          ? t("expiredOn", { date: d ?? "" })
          : d
            ? pickLocale(locale, `Έληξε στις ${d}`, `Expired on ${d}`)
            : pickLocale(locale, "Έληξε", "Expired"),
        tone: "expired",
      };
    }
    if (daysUntilExpiry <= 6) {
      return {
        textKey: "expiresInDays",
        text: t
          ? t("expiresInDays", { count: daysUntilExpiry })
          : pickLocale(
              locale,
              `Λήγει σε ${daysUntilExpiry} ${daysUntilExpiry === 1 ? "ημέρα" : "ημέρες"}`,
              `Expires in ${daysUntilExpiry} ${daysUntilExpiry === 1 ? "day" : "days"}`
            ),
        tone: "warning",
      };
    }
    const d = formatOwnerListingDate(listing.expires_at);
    return {
      textKey: "activeUntil",
      text: t
        ? t("activeUntil", { date: d ?? "" })
        : d
          ? pickLocale(locale, `Ενεργή έως ${d}`, `Active until ${d}`)
          : pickLocale(locale, "Ενεργή", "Active"),
      tone: "green",
    };
  }

  if (ownerStatusKey === "expired") {
    const d = formatOwnerListingDate(listing.expires_at);
    return {
      textKey: "expiredOn",
      text: t
        ? t("expiredOn", { date: d ?? "" })
        : d
          ? pickLocale(locale, `Έληξε στις ${d}`, `Expired on ${d}`)
          : pickLocale(locale, "Έληξε", "Expired"),
      tone: "expired",
    };
  }

  if (ownerStatusKey === "draft") {
    const pending = ownerListingCompletenessItems(listing, row.photoCount).filter(
      (i) => !i.done
    ).length;
    if (pending > 0) {
      return {
        textKey: "missingItems",
        text: t
          ? t("missingItems", { count: pending })
          : pickLocale(
              locale,
              `Λείπουν ${pending} ${pending === 1 ? "στοιχείο" : "στοιχεία"}`,
              `${pending} ${pending === 1 ? "item" : "items"} missing`
            ),
        tone: "amber",
      };
    }
    return {
      textKey: "readyToSubmit",
      text: t
        ? t("readyToSubmit")
        : pickLocale(locale, "Έτοιμη για υποβολή", "Ready to submit"),
      tone: "green",
    };
  }

  if (ownerStatusKey === "review") {
    const d = formatOwnerListingDate(listing.updated_at ?? listing.created_at);
    return {
      textKey: "submittedOn",
      text: t
        ? t("submittedOn", { date: d ?? "" })
        : d
          ? pickLocale(locale, `Υποβλήθηκε στις ${d}`, `Submitted on ${d}`)
          : pickLocale(locale, "Υποβλήθηκε για έλεγχο", "Submitted for review"),
      tone: "neutral",
    };
  }

  if (ownerStatusKey === "needs_fixes") {
    return {
      textKey: "needsFixes",
      text: t ? t("needsFixes") : pickLocale(locale, "Θέλει διόρθωση", "Needs changes"),
      tone: "warning",
    };
  }

  return { text: "—", tone: "neutral" };
}

export function formatSubmittedDate(
  iso: string | null | undefined,
  locale: string = "el"
): string | null {
  if (!iso) return null;
  const dateLocale = locale.startsWith("el") ? "el-GR" : "en-US";
  return new Date(iso).toLocaleDateString(dateLocale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
