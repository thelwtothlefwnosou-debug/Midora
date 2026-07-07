import type { MetadataRoute } from "next";
import { CITY_LANDINGS } from "@/lib/data/city-landings";
import { getSitemapListingEntries } from "@/lib/listings";
import { getSiteUrl } from "@/lib/site-url";

const STATIC_PATHS = [
  "",
  "/listings",
  "/owners",
  "/about",
  "/help",
  "/how-it-works",
  "/faq",
  "/privacy",
  "/terms",
  "/short-term-rental-guide",
  "/listing-rules",
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: now,
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : path === "/listings" ? 0.9 : 0.6,
  }));

  const cityEntries: MetadataRoute.Sitemap = Object.values(CITY_LANDINGS).map(
    (city) => ({
      url: `${siteUrl}/rentals/${city.slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.75,
    })
  );

  let listingEntries: MetadataRoute.Sitemap = [];
  try {
    const listings = await getSitemapListingEntries();
    listingEntries = listings.map((listing) => ({
      url: `${siteUrl}/listings/${listing.slug ?? listing.id}`,
      lastModified: listing.updated_at ? new Date(listing.updated_at) : now,
      changeFrequency: "daily",
      priority: 0.7,
    }));
  } catch (error) {
    console.error("[sitemap] listing fetch failed:", error);
  }

  return [...staticEntries, ...cityEntries, ...listingEntries];
}
