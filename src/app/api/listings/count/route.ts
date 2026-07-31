import { NextResponse } from "next/server";
import { getExactSearchMatchCount } from "@/lib/search-session";
import { parseListingFiltersWithMessages } from "@/lib/listing-filters";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const params: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    params[key] = value;
  });

  const { filters } = parseListingFiltersWithMessages(params);
  const count = await getExactSearchMatchCount(filters);

  return NextResponse.json({
    count,
    catalogFetchCapped: false,
  });
}
