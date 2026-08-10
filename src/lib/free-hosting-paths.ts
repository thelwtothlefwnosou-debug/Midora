/** Client-safe Free Hosting path helpers (no server-only imports). */

export const FREE_STAYS_PATH = "/free-stays";
export const FREE_HOSTING_QUERY_PARAM = "freeHosting";
export const FREE_HOSTING_OWNER_OFFER_HREF = "/dashboard/listings?intent=free-hosting";

export function freeHostingListingsHref(extra?: Record<string, string>): string {
  const params = new URLSearchParams({
    rentalType: "short_term",
    [FREE_HOSTING_QUERY_PARAM]: "true",
    ...extra,
  });
  return `/listings?${params.toString()}`;
}
