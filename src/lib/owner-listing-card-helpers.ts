import type { OwnerListingRowModel } from "@/lib/owner-listings-page";
import { formatOwnerListingDate } from "@/lib/dashboard-listings";
import { ownerListingCompletenessItems } from "@/lib/owner-dashboard";

export function formatOwnerPropertyMeta(row: OwnerListingRowModel): string {
  const { listing } = row;
  const parts: string[] = [];
  const guests = listing.max_guests ?? listing.included_guests;
  if (guests) parts.push(`${guests} επισκέπτες`);
  if (listing.bedrooms) parts.push(`${listing.bedrooms} υπν.`);
  if (listing.bathrooms) parts.push(`${listing.bathrooms} μπάνιο`);
  if (listing.sqm) parts.push(`${listing.sqm} τ.μ.`);
  return parts.join(" · ");
}

export function ownerListingLifecycle(row: OwnerListingRowModel): {
  text: string;
  tone: "neutral" | "green" | "amber" | "warning" | "expired";
} {
  const { listing, ownerStatusKey, daysUntilExpiry } = row;

  if (ownerStatusKey === "published" || ownerStatusKey === "paused") {
    if (daysUntilExpiry == null) {
      return { text: "Ενεργή χωρίς ημερομηνία λήξης", tone: "neutral" };
    }
    if (daysUntilExpiry < 0) {
      const d = formatOwnerListingDate(listing.expires_at);
      return { text: d ? `Έληξε στις ${d}` : "Έληξε", tone: "expired" };
    }
    if (daysUntilExpiry <= 6) {
      return {
        text: `Λήγει σε ${daysUntilExpiry} ${daysUntilExpiry === 1 ? "ημέρα" : "ημέρες"}`,
        tone: "warning",
      };
    }
    const d = formatOwnerListingDate(listing.expires_at);
    return { text: d ? `Ενεργή έως ${d}` : "Ενεργή", tone: "green" };
  }

  if (ownerStatusKey === "expired") {
    const d = formatOwnerListingDate(listing.expires_at);
    return { text: d ? `Έληξε στις ${d}` : "Έληξε", tone: "expired" };
  }

  if (ownerStatusKey === "draft") {
    const pending = ownerListingCompletenessItems(listing, row.photoCount).filter(
      (i) => !i.done
    ).length;
    if (pending > 0) {
      return {
        text: `Χρειάζονται ακόμη ${pending} ${pending === 1 ? "βήμα" : "βήματα"}`,
        tone: "neutral",
      };
    }
    return { text: "Δεν έχει δημοσιευτεί ακόμα", tone: "neutral" };
  }

  if (ownerStatusKey === "review") {
    const d = formatOwnerListingDate(listing.updated_at ?? listing.created_at);
    return {
      text: d ? `Υποβλήθηκε στις ${d}` : "Αναμονή ελέγχου",
      tone: "neutral",
    };
  }

  if (ownerStatusKey === "needs_fixes") {
    return { text: "Χρειάζεται διόρθωση", tone: "warning" };
  }

  return { text: "—", tone: "neutral" };
}

export function formatSubmittedDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("el-GR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
