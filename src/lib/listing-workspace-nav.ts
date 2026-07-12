export type ListingWorkspaceTabId =
  | "overview"
  | "edit"
  | "photos"
  | "availability"
  | "inquiries"
  | "analytics"
  | "publish"
  | "cohosts";

export type ListingWorkspaceTab = {
  id: ListingWorkspaceTabId;
  label: string;
  href: (listingId: string) => string;
  match: (pathname: string, listingId: string) => boolean;
};

export const LISTING_WORKSPACE_TABS: ListingWorkspaceTab[] = [
  {
    id: "overview",
    label: "Επισκόπηση",
    href: (id) => `/dashboard/listings/${id}`,
    match: (path, id) =>
      path === `/dashboard/listings/${id}` || path === `/dashboard/listings/${id}/`,
  },
  {
    id: "edit",
    label: "Αγγελία",
    href: (id) => `/dashboard/listings/${id}/edit`,
    match: (path, id) =>
      path.startsWith(`/dashboard/listings/${id}/edit`) ||
      path.startsWith(`/dashboard/listings/${id}/pricing`),
  },
  {
    id: "photos",
    label: "Φωτογραφίες",
    href: (id) => `/dashboard/listings/${id}/photos`,
    match: (path, id) => path.startsWith(`/dashboard/listings/${id}/photos`),
  },
  {
    id: "availability",
    label: "Διαθεσιμότητα",
    href: (id) => `/dashboard/listings/${id}/availability`,
    match: (path, id) => path.startsWith(`/dashboard/listings/${id}/availability`),
  },
  {
    id: "inquiries",
    label: "Αιτήματα",
    href: (id) => `/dashboard/listings/${id}/inquiries`,
    match: (path, id) => path.startsWith(`/dashboard/listings/${id}/inquiries`),
  },
  {
    id: "analytics",
    label: "Στατιστικά",
    href: (id) => `/dashboard/listings/${id}/analytics`,
    match: (path, id) => path.startsWith(`/dashboard/listings/${id}/analytics`),
  },
  {
    id: "publish",
    label: "Δημοσίευση",
    href: (id) => `/dashboard/listings/${id}/publish`,
    match: (path, id) =>
      path.startsWith(`/dashboard/listings/${id}/publish`) ||
      path.startsWith(`/dashboard/listings/${id}/pay`),
  },
  {
    id: "cohosts",
    label: "Συνοικοδεσπότες",
    href: (id) => `/dashboard/listings/${id}/cohosts`,
    match: (path, id) => path.startsWith(`/dashboard/listings/${id}/cohosts`),
  },
];

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
