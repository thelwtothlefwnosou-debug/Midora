export type ListingWorkspaceTabId =
  | "overview"
  | "edit"
  | "availability"
  | "inquiries"
  | "messages"
  | "analytics"
  | "publish";

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
    label: "Καταχώριση",
    href: (id) => `/dashboard/listings/${id}/edit`,
    match: (path, id) =>
      path.startsWith(`/dashboard/listings/${id}/edit`) ||
      path.startsWith(`/dashboard/listings/${id}/photos`) ||
      path.startsWith(`/dashboard/listings/${id}/pricing`),
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
    id: "messages",
    label: "Μηνύματα",
    href: (id) => `/dashboard/listings/${id}/messages`,
    match: (path, id) => path.startsWith(`/dashboard/listings/${id}/messages`),
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
