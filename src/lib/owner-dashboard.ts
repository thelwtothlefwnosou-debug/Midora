import type { ListingWithImages, Profile } from "@/lib/types";
import { MIN_LISTING_PHOTOS_FOR_REVIEW } from "@/lib/constants";
import {
  listingRentalType,
  listingSupportsShortTerm,
  listingSupportsMonthly,
  requiresAmaRegistry,
} from "@/lib/rental-types";
import {
  completenessPercent,
  shortTermCompletenessItems,
  type CompletenessItem,
} from "@/lib/listing-completeness";
import { getOwnerListingStatus } from "@/lib/dashboard-listings";
import type { ListingDisplayStatus } from "@/lib/listing-status";

export type OwnerActionTone = "red" | "amber" | "green" | "neutral";

export type OwnerActionItem = {
  id: string;
  title: string;
  description: string;
  href: string;
  cta: string;
  tone: OwnerActionTone;
};

export type OwnerNotification = {
  id: string;
  title: string;
  body: string;
  href: string;
  createdAt: string;
  read: boolean;
};

export type ProfileCompletionItem = {
  id: string;
  label: string;
  done: boolean;
  href: string;
  required: boolean;
};

export function ownerListingCompletenessItems(
  listing: ListingWithImages,
  photoCount: number
): CompletenessItem[] {
  const shortItems = shortTermCompletenessItems(listing, photoCount);
  if (shortItems.length > 0) return shortItems.filter((i) => i.required);

  const needsAma = requiresAmaRegistry(
    listingRentalType(listing),
    listing.accepts_under_60_days
  );

  return [
    {
      id: "photos",
      label: "Φωτογραφίες",
      done: photoCount >= MIN_LISTING_PHOTOS_FOR_REVIEW,
      required: true,
    },
    {
      id: "location",
      label: "Τοποθεσία",
      done: Boolean(
        listing.latitude != null &&
          listing.longitude != null &&
          listing.location_confirmed_by_owner
      ),
      required: true,
    },
    {
      id: "price",
      label: "Τιμή",
      done: (listing.price_monthly ?? 0) > 0,
      required: true,
    },
    {
      id: "availability",
      label: "Διαθεσιμότητα",
      done: Boolean(listing.availability_status || listing.available_from),
      required: true,
    },
    {
      id: "verification",
      label: "Επαλήθευση",
      done:
        listing.property_verification_status === "verified" ||
        listing.advertiser_verification_status === "verified",
      required: false,
    },
    {
      id: "registry",
      label: "Αριθμός καταχώρισης",
      done: Boolean(listing.ama_number?.trim() && listing.legal_registry_type !== "none"),
      required: needsAma,
    },
  ].filter((i) => i.required || i.id === "verification");
}

export function ownerListingCompletenessPercent(
  listing: ListingWithImages,
  photoCount: number
): number {
  return completenessPercent(ownerListingCompletenessItems(listing, photoCount));
}

export function profileCompletionItems(
  profile: Profile,
  _email: string
): ProfileCompletionItem[] {
  return [
    {
      id: "name",
      label: "Εμφανιζόμενο όνομα",
      done: Boolean(profile.full_name?.trim()),
      href: "/dashboard/profile",
      required: true,
    },
    {
      id: "phone",
      label: "Τηλέφωνο",
      done: Boolean(profile.phone?.trim()),
      href: "/dashboard/settings/contact",
      required: true,
    },
    {
      id: "avatar",
      label: "Φωτογραφία προφίλ",
      done: Boolean(profile.avatar_path?.trim() && profile.avatar_status === "active"),
      href: "/dashboard/profile",
      required: false,
    },
    {
      id: "bio",
      label: "Σύντομη περιγραφή",
      done: Boolean(profile.bio?.trim()),
      href: "/dashboard/profile",
      required: false,
    },
    {
      id: "languages",
      label: "Γλώσσες επικοινωνίας",
      done: Boolean(profile.communication_languages?.length),
      href: "/dashboard/profile",
      required: false,
    },
  ];
}

export function profileCompletionPercent(profile: Profile, email: string): number {
  const items = profileCompletionItems(profile, email);
  const required = items.filter((i) => i.required);
  const recommended = items.filter((i) => !i.required);
  const requiredDone = required.filter((i) => i.done).length;
  const recommendedDone = recommended.filter((i) => i.done).length;
  const requiredPct = required.length ? (requiredDone / required.length) * 70 : 70;
  const recommendedPct = recommended.length
    ? (recommendedDone / recommended.length) * 30
    : 30;
  return Math.round(requiredPct + recommendedPct);
}

export function profileRequiredComplete(profile: Profile, email: string): boolean {
  return profileCompletionItems(profile, email)
    .filter((i) => i.required)
    .every((i) => i.done);
}

function daysUntil(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const diff = new Date(iso).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function buildOwnerActionItems(input: {
  profile: Profile;
  listings: ListingWithImages[];
  newLeadsCount: number;
  getEffectiveStatus: (listing: ListingWithImages) => ListingDisplayStatus;
}): OwnerActionItem[] {
  const items: OwnerActionItem[] = [];

  if (!input.profile.primary_phone_verified_at) {
    items.push({
      id: "verify-phone",
      title: "Επιβεβαίωσε το τηλέφωνό σου",
      description: "Χρειάζεται για επικοινωνία με ενδιαφερόμενους.",
      href: "/dashboard/settings/contact",
      cta: "Επιβεβαίωση τηλεφώνου",
      tone: "amber",
    });
  }

  if (input.newLeadsCount > 0) {
    items.push({
      id: "new-leads",
      title: input.newLeadsCount === 1 ? "Έχεις νέο ενδιαφέρον" : `Έχεις ${input.newLeadsCount} νέα ενδιαφέροντα`,
      description: "Κάποιος επικοινώνησε για αγγελία σου.",
      href: "/dashboard/requests",
      cta: "Δες ενδιαφέροντα",
      tone: "red",
    });
  }

  for (const listing of input.listings) {
    const effective = input.getEffectiveStatus(listing);
    const ownerStatus = getOwnerListingStatus(listing, effective);
    const photoCount =
      listing.listing_images?.filter((i) => i.media_type !== "video").length ?? 0;

    if (listing.approval_status === "needs_changes") {
      items.push({
        id: `needs-changes-${listing.id}`,
        title: "Η αγγελία σου χρειάζεται αλλαγές",
        description: listing.admin_verification_notes?.slice(0, 120) || listing.title,
        href: `/dashboard/listings/${listing.id}/edit`,
        cta: "Διόρθωσε τα στοιχεία",
        tone: "red",
      });
      continue;
    }

    if (ownerStatus.key === "review") {
      items.push({
        id: `review-${listing.id}`,
        title: "Η αγγελία σου είναι σε έλεγχο",
        description: `"${listing.title}" — θα ενημερωθείς όταν ολοκληρωθεί.`,
        href: "/dashboard/listings",
        cta: "Δες την κατάσταση",
        tone: "neutral",
      });
    }

    if (
      photoCount < MIN_LISTING_PHOTOS_FOR_REVIEW &&
      ownerStatus.key !== "published" &&
      ownerStatus.key !== "paused"
    ) {
      items.push({
        id: `photos-${listing.id}`,
        title: "Πρόσθεσε φωτογραφίες",
        description: `"${listing.title}" — χρειάζονται τουλάχιστον ${MIN_LISTING_PHOTOS_FOR_REVIEW} φωτογραφίες.`,
        href: `/dashboard/listings/${listing.id}/photos`,
        cta: "Πρόσθεσε φωτογραφίες",
        tone: "amber",
      });
    }

    const needsAma = requiresAmaRegistry(
      listingRentalType(listing),
      listing.accepts_under_60_days
    );
    if (
      needsAma &&
      (!listing.ama_number?.trim() || listing.legal_registry_type === "none") &&
      ownerStatus.key !== "published" &&
      ownerStatus.key !== "paused"
    ) {
      items.push({
        id: `registry-${listing.id}`,
        title: "Συμπλήρωσε αριθμό καταχώρισης",
        description: `"${listing.title}" — απαιτείται ΑΜΑ/ΕΣΛ/ΜΑΓ.`,
        href: `/dashboard/listings/${listing.id}/edit`,
        cta: "Συμπλήρωση ΑΜΑ",
        tone: "amber",
      });
    }

    const daysLeft = daysUntil(listing.expires_at);
    if (effective === "approved" && daysLeft != null && daysLeft <= 7 && daysLeft >= 0) {
      items.push({
        id: `expiring-${listing.id}`,
        title: "Η αγγελία σου λήγει σύντομα",
        description: `"${listing.title}" — λήγει σε ${daysLeft} ημ.`,
        href: `/dashboard/listings/${listing.id}/pay?reactivate=1`,
        cta: "Ανανέωση",
        tone: "amber",
      });
    }
  }

  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

export function buildOwnerNotifications(input: {
  profile: Profile;
  listings: ListingWithImages[];
  newLeadsCount: number;
  getEffectiveStatus: (listing: ListingWithImages) => ListingDisplayStatus;
}): OwnerNotification[] {
  const notifications: OwnerNotification[] = [];
  const now = new Date().toISOString();

  if (input.newLeadsCount > 0) {
    notifications.push({
      id: "lead-new",
      title: "Νέο ενδιαφέρον",
      body:
        input.newLeadsCount === 1
          ? "Έχεις 1 νέο αίτημα επικοινωνίας."
          : `Έχεις ${input.newLeadsCount} νέα αιτήματα επικοινωνίας.`,
      href: "/dashboard/requests",
      createdAt: now,
      read: false,
    });
  }

  if (!input.profile.primary_phone_verified_at) {
    notifications.push({
      id: "phone-unverified",
      title: "Τηλέφωνο δεν έχει επιβεβαιωθεί",
      body: "Επιβεβαίωσε το κινητό σου για καλύτερη επικοινωνία.",
      href: "/dashboard/settings/contact",
      createdAt: now,
      read: false,
    });
  }

  for (const listing of input.listings) {
    if (listing.approval_status === "needs_changes") {
      notifications.push({
        id: `changes-${listing.id}`,
        title: "Αγγελία χρειάζεται αλλαγές",
        body: listing.title,
        href: `/dashboard/listings/${listing.id}/edit`,
        createdAt: listing.updated_at ?? now,
        read: false,
      });
    } else if (listing.approval_status === "approved" && listing.status === "approved") {
      const publishedAt = listing.published_at;
      if (publishedAt) {
        const ageHours = (Date.now() - new Date(publishedAt).getTime()) / 3600000;
        if (ageHours < 48) {
          notifications.push({
            id: `approved-${listing.id}`,
            title: "Αγγελία εγκρίθηκε",
            body: listing.title,
            href: `/listings/${listing.id}`,
            createdAt: publishedAt,
            read: true,
          });
        }
      }
    } else if (listing.approval_status === "rejected") {
      notifications.push({
        id: `rejected-${listing.id}`,
        title: "Αγγελία απορρίφθηκε",
        body: listing.title,
        href: `/dashboard/listings/${listing.id}/edit`,
        createdAt: listing.updated_at ?? now,
        read: false,
      });
    }

    const daysLeft = daysUntil(listing.expires_at);
    if (daysLeft != null && daysLeft <= 7 && daysLeft >= 0) {
      notifications.push({
        id: `expire-${listing.id}`,
        title: "Η αγγελία λήγει σύντομα",
        body: `${listing.title} — ${daysLeft} ημέρες ακόμα`,
        href: `/dashboard/listings/${listing.id}/pay?reactivate=1`,
        createdAt: now,
        read: false,
      });
    }
  }

  return notifications
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 20);
}

export function listingPrimaryCta(
  listing: ListingWithImages,
  effectiveStatus: ListingDisplayStatus
): { label: string; href: string; secondary?: { label: string; href: string } } {
  const ownerStatus = getOwnerListingStatus(listing, effectiveStatus);
  const previewHref = `/listings/${listing.slug ?? listing.id}`;
  const editHref = `/dashboard/listings/${listing.id}/edit`;
  const reactivateHref = `/dashboard/listings/${listing.id}/pay?reactivate=1`;

  switch (ownerStatus.key) {
    case "draft":
      return {
        label: "Συνέχισε τη συμπλήρωση",
        href: `/dashboard/listings/new?draft=${listing.id}`,
        secondary: { label: "Προεπισκόπηση", href: previewHref },
      };
    case "review":
      return {
        label: "Δες την κατάσταση ελέγχου",
        href: "/dashboard/listings",
        secondary: { label: "Προεπισκόπηση", href: previewHref },
      };
    case "needs_fixes":
      return {
        label: "Διόρθωσε τώρα",
        href: editHref,
        secondary: { label: "Δες παρατηρήσεις", href: `${editHref}#admin-notes` },
      };
    case "published":
      return {
        label: "Δες αγγελία",
        href: previewHref,
        secondary: { label: "Επεξεργασία", href: editHref },
      };
    case "paused":
      return {
        label: "Επεξεργασία",
        href: editHref,
        secondary: { label: "Δες αγγελία", href: previewHref },
      };
    case "expired":
      return {
        label: "Επανενεργοποίηση",
        href: reactivateHref,
        secondary: { label: "Επεξεργασία", href: editHref },
      };
    case "rejected":
      return {
        label: "Επεξεργασία",
        href: editHref,
        secondary: { label: "Δες παρατηρήσεις", href: `${editHref}#admin-notes` },
      };
    default:
      return { label: "Επεξεργασία", href: editHref };
  }
}

export function listingHasDualModes(_listing: ListingWithImages): boolean {
  return false;
}
