export const OWNER_LISTINGS_LIST_PATH = "/dashboard/listings";

export function isOwnerListingsListPath(pathname: string): boolean {
  return (
    pathname === OWNER_LISTINGS_LIST_PATH ||
    pathname === `${OWNER_LISTINGS_LIST_PATH}/`
  );
}

/** True for /dashboard/listings/:id and nested workspace routes (not /new). */
export function isOwnerListingWorkspacePath(pathname: string): boolean {
  if (!pathname.startsWith(`${OWNER_LISTINGS_LIST_PATH}/`)) return false;
  if (pathname.startsWith(`${OWNER_LISTINGS_LIST_PATH}/new`)) return false;
  return true;
}

/** Force navigation to the all-listings page (fixes stale active-nav clicks). */
export function shouldForceOwnerListingsListNav(pathname: string): boolean {
  return isOwnerListingWorkspacePath(pathname);
}
