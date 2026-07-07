import { revalidateTag } from "next/cache";

export const LISTINGS_CATALOG_TAG = "listings-catalog";

export function revalidateListingsCatalog() {
  revalidateTag(LISTINGS_CATALOG_TAG, "max");
}
