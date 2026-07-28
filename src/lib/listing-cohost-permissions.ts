import { pickLocale } from "@/lib/locale-fallbacks";

export type CohostPermissionLevel =
  | "full_access"
  | "messages_availability"
  | "messages_only";

export type CohostStatus = "pending" | "accepted" | "declined" | "removed";

export type CohostPermissionFlags = {
  can_manage_listing: boolean;
  can_manage_photos: boolean;
  can_manage_availability: boolean;
  can_manage_pricing: boolean;
  can_manage_messages: boolean;
  can_view_stats: boolean;
  can_manage_cohosts: boolean;
};

export type ListingAccessPermission =
  | "view"
  | "manage_listing"
  | "manage_photos"
  | "manage_availability"
  | "manage_pricing"
  | "manage_messages"
  | "view_stats"
  | "manage_cohosts"
  | "owner_only";

export const MAX_COHOSTS_PER_LISTING = 5;

const COHOST_PERMISSION_LEVEL_LABELS_EN: Record<CohostPermissionLevel, string> = {
  full_access: "Full property management",
  messages_availability: "Messages and availability",
  messages_only: "Messages only",
};

/** @deprecated Use `getCohostPermissionLabel` with `Workspace.cohosts` */
export const COHOST_PERMISSION_LEVEL_LABELS: Record<CohostPermissionLevel, string> = {
  full_access: "Πλήρης διαχείριση ακινήτου",
  messages_availability: "Μηνύματα και διαθεσιμότητα",
  messages_only: "Μόνο μηνύματα",
};

const COHOST_PERMISSION_KEYS: Record<CohostPermissionLevel, string> = {
  full_access: "permissions.full_access",
  messages_availability: "permissions.messages_availability",
  messages_only: "permissions.messages_only",
};

export function cohostPermissionKey(level: CohostPermissionLevel): string {
  return COHOST_PERMISSION_KEYS[level];
}

type CohostT = (key: string) => string;

export function getCohostPermissionLabel(
  level: CohostPermissionLevel,
  t?: CohostT,
  locale?: string
): string {
  if (t) {
    try {
      return t(cohostPermissionKey(level));
    } catch {
      /* fall through */
    }
  }
  return pickLocale(
    locale,
    COHOST_PERMISSION_LEVEL_LABELS[level],
    COHOST_PERMISSION_LEVEL_LABELS_EN[level]
  );
}

const COHOST_STATUS_LABELS_EN: Record<CohostStatus, string> = {
  pending: "Invitation pending",
  accepted: "Accepted",
  declined: "Declined",
  removed: "Removed",
};

/** @deprecated Use `getCohostStatusLabel` with `Workspace.cohosts` */
export const COHOST_STATUS_LABELS: Record<CohostStatus, string> = {
  pending: "Εκκρεμεί πρόσκληση",
  accepted: "Αποδέχτηκε",
  declined: "Απορρίφθηκε",
  removed: "Αφαιρέθηκε",
};

const COHOST_STATUS_KEYS: Record<CohostStatus, string> = {
  pending: "status.pending",
  accepted: "status.accepted",
  declined: "status.declined",
  removed: "status.removed",
};

export function getCohostStatusLabel(
  status: CohostStatus,
  t?: CohostT,
  locale?: string
): string {
  if (t) {
    try {
      return t(COHOST_STATUS_KEYS[status]);
    } catch {
      /* fall through */
    }
  }
  return pickLocale(locale, COHOST_STATUS_LABELS[status], COHOST_STATUS_LABELS_EN[status]);
}

export function permissionFlagsForLevel(level: CohostPermissionLevel): CohostPermissionFlags {
  switch (level) {
    case "full_access":
      return {
        can_manage_listing: true,
        can_manage_photos: true,
        can_manage_availability: true,
        can_manage_pricing: true,
        can_manage_messages: true,
        can_view_stats: true,
        can_manage_cohosts: false,
      };
    case "messages_availability":
      return {
        can_manage_listing: false,
        can_manage_photos: false,
        can_manage_availability: true,
        can_manage_pricing: false,
        can_manage_messages: true,
        can_view_stats: false,
        can_manage_cohosts: false,
      };
    case "messages_only":
      return {
        can_manage_listing: false,
        can_manage_photos: false,
        can_manage_availability: false,
        can_manage_pricing: false,
        can_manage_messages: true,
        can_view_stats: false,
        can_manage_cohosts: false,
      };
  }
}

export function hasPermission(
  flags: CohostPermissionFlags,
  permission: ListingAccessPermission
): boolean {
  switch (permission) {
    case "view":
      return true;
    case "manage_listing":
      return flags.can_manage_listing;
    case "manage_photos":
      return flags.can_manage_photos;
    case "manage_availability":
      return flags.can_manage_availability;
    case "manage_pricing":
      return flags.can_manage_pricing;
    case "manage_messages":
      return flags.can_manage_messages;
    case "view_stats":
      return flags.can_view_stats;
    case "manage_cohosts":
      return flags.can_manage_cohosts;
    case "owner_only":
      return false;
  }
}

export const OWNER_FULL_PERMISSIONS: CohostPermissionFlags = {
  can_manage_listing: true,
  can_manage_photos: true,
  can_manage_availability: true,
  can_manage_pricing: true,
  can_manage_messages: true,
  can_view_stats: true,
  can_manage_cohosts: true,
};

export type ContactNumberVisibility = "private" | "after_inquiry" | "public";

const CONTACT_VISIBILITY_LABELS_EN: Record<ContactNumberVisibility, string> = {
  private: "Internal only",
  after_inquiry: "After inquiry",
  public: "Public listing",
};

/** @deprecated Use `getContactVisibilityLabel` with `Workspace.cohosts` */
export const CONTACT_VISIBILITY_LABELS: Record<ContactNumberVisibility, string> = {
  private: "Εσωτερικό μόνο",
  after_inquiry: "Μετά από αίτημα",
  public: "Δημόσια αγγελία",
};

const CONTACT_VISIBILITY_KEYS: Record<ContactNumberVisibility, string> = {
  private: "contactVisibility.private",
  after_inquiry: "contactVisibility.after_inquiry",
  public: "contactVisibility.public",
};

export function getContactVisibilityLabel(
  visibility: ContactNumberVisibility,
  t?: CohostT,
  locale?: string
): string {
  if (t) {
    try {
      return t(CONTACT_VISIBILITY_KEYS[visibility]);
    } catch {
      /* fall through */
    }
  }
  return pickLocale(
    locale,
    CONTACT_VISIBILITY_LABELS[visibility],
    CONTACT_VISIBILITY_LABELS_EN[visibility]
  );
}

export const DEFAULT_COHOST_INVITE_MESSAGE_KEY = "defaultInviteMessage";

/** Greek fallback when no translator is available. */
export const DEFAULT_COHOST_INVITE_MESSAGE =
  "Σε προσκαλώ να βοηθήσεις στη διαχείριση αυτής της αγγελίας στο Midora.";

export const DEFAULT_COHOST_INVITE_MESSAGE_EN =
  "I'm inviting you to help manage this listing on Midora.";

export function getDefaultCohostInviteMessage(locale?: string): string {
  return pickLocale(locale, DEFAULT_COHOST_INVITE_MESSAGE, DEFAULT_COHOST_INVITE_MESSAGE_EN);
}
