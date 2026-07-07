export const LISTINGS_PAGE_SIZE = 18;

export const LISTINGS_SEARCH_MAX = 500;

export function parseListingsPage(raw: string | undefined): number {
  const n = parseInt(raw ?? "1", 10);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.floor(n);
}

export function paginateListings<T>(
  items: T[],
  page: number,
  pageSize = LISTINGS_PAGE_SIZE
) {
  const totalCount = items.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize) || 1);
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const offset = (currentPage - 1) * pageSize;

  return {
    items: items.slice(offset, offset + pageSize),
    totalCount,
    totalPages,
    currentPage,
    pageSize,
    rangeStart: totalCount === 0 ? 0 : offset + 1,
    rangeEnd: Math.min(offset + pageSize, totalCount),
  };
}

export function listingsPageHref(searchParams: URLSearchParams, page: number): string {
  const params = new URLSearchParams(searchParams.toString());
  if (page <= 1) params.delete("page");
  else params.set("page", String(page));
  const q = params.toString();
  return q ? `/listings?${q}` : "/listings";
}

export function resetListingsPage(params: URLSearchParams): URLSearchParams {
  const next = new URLSearchParams(params.toString());
  next.delete("page");
  return next;
}
