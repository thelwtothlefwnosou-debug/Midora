import { pickLocale } from "@/lib/locale-fallbacks";

export type ListingWorkspaceTabId =
  | "overview"
  | "edit"
  | "trust"
  | "photos"
  | "availability"
  | "inquiries"
  | "analytics"
  | "publish"
  | "cohosts";

export type ListingWorkspaceTab = {
  id: ListingWorkspaceTabId;
  /** @deprecated UI uses `Workspace.tabs.{id}` via next-intl */
  label: string;
  labelKey: ListingWorkspaceTabId;
  href: (listingId: string) => string;
  match: (pathname: string, listingId: string) => boolean;
};

export const LISTING_WORKSPACE_TABS: ListingWorkspaceTab[] = [
  {
    id: "overview",
    label: "Επισκόπηση",
    labelKey: "overview",
    href: (id) => `/dashboard/listings/${id}`,
    match: (path, id) =>
      path === `/dashboard/listings/${id}` || path === `/dashboard/listings/${id}/`,
  },
  {
    id: "edit",
    label: "Αγγελία",
    labelKey: "edit",
    href: (id) => `/dashboard/listings/${id}/edit`,
    match: (path, id) =>
      path.startsWith(`/dashboard/listings/${id}/edit`) ||
      path.startsWith(`/dashboard/listings/${id}/pricing`),
  },
  {
    id: "trust",
    label: "Αξιοπιστία",
    labelKey: "trust",
    href: (id) => `/dashboard/listings/${id}/trust-links`,
    match: (path, id) => path.startsWith(`/dashboard/listings/${id}/trust-links`),
  },
  {
    id: "photos",
    label: "Φωτογραφίες",
    labelKey: "photos",
    href: (id) => `/dashboard/listings/${id}/photos`,
    match: (path, id) => path.startsWith(`/dashboard/listings/${id}/photos`),
  },
  {
    id: "availability",
    label: "Διαθεσιμότητα",
    labelKey: "availability",
    href: (id) => `/dashboard/listings/${id}/availability`,
    match: (path, id) => path.startsWith(`/dashboard/listings/${id}/availability`),
  },
  {
    id: "inquiries",
    label: "Αιτήματα",
    labelKey: "inquiries",
    href: (id) => `/dashboard/listings/${id}/inquiries`,
    match: (path, id) => path.startsWith(`/dashboard/listings/${id}/inquiries`),
  },
  {
    id: "analytics",
    label: "Στατιστικά",
    labelKey: "analytics",
    href: (id) => `/dashboard/listings/${id}/analytics`,
    match: (path, id) => path.startsWith(`/dashboard/listings/${id}/analytics`),
  },
  {
    id: "publish",
    label: "Δημοσίευση",
    labelKey: "publish",
    href: (id) => `/dashboard/listings/${id}/publish`,
    match: (path, id) =>
      path.startsWith(`/dashboard/listings/${id}/publish`) ||
      path.startsWith(`/dashboard/listings/${id}/pay`),
  },
  {
    id: "cohosts",
    label: "Συνοικοδεσπότες",
    labelKey: "cohosts",
    href: (id) => `/dashboard/listings/${id}/cohosts`,
    match: (path, id) => path.startsWith(`/dashboard/listings/${id}/cohosts`),
  },
];

const WORKSPACE_TAB_LABELS_EN: Record<ListingWorkspaceTabId, string> = {
  overview: "Overview",
  edit: "Listing",
  trust: "Trust",
  photos: "Photos",
  availability: "Availability",
  inquiries: "Inquiries",
  analytics: "Analytics",
  publish: "Publish",
  cohosts: "Co-hosts",
};

/** Locale-aware tab label; UI should prefer `Workspace.tabs.{labelKey}` via next-intl. */
export function workspaceTabLabel(tab: ListingWorkspaceTab, locale?: string): string {
  return pickLocale(locale, tab.label, WORKSPACE_TAB_LABELS_EN[tab.id]);
}

export function listingManageHref(listingId: string): string {
  return `/dashboard/listings/${listingId}`;
}

export function resolveListingWorkspaceTab(
  pathname: string,
  listingId: string
): ListingWorkspaceTabId {
  const tab = LISTING_WORKSPACE_TABS.find((t) => t.match(pathname, listingId));
  return tab?.id ?? "overview";
}
