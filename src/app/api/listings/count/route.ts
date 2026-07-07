import { NextResponse } from "next/server";
import { getApprovedListings } from "@/lib/listings";
import { parseListingFiltersWithMessages } from "@/lib/listing-filters";
import { LISTINGS_SEARCH_MAX } from "@/lib/listings-pagination";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const params: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    params[key] = value;
  });

  const { filters } = parseListingFiltersWithMessages(params);
  const listings = await getApprovedListings(filters, LISTINGS_SEARCH_MAX);

  return NextResponse.json({ count: listings.length });
}
