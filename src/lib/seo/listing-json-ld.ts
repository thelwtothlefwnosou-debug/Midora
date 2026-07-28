import type { ListingWithImages } from "@/lib/types";
import { getListingCoverImage } from "@/lib/listings";
import { formatListingPrice, listingRentalType } from "@/lib/rental-types";
import { pickLocale } from "@/lib/locale-fallbacks";
import { getSiteUrl } from "@/lib/site-url";

export function buildListingJsonLd(
  listing: ListingWithImages,
  canonicalPath: string,
  locale?: string
): Record<string, unknown> {
  const siteUrl = getSiteUrl();
  const cover = getListingCoverImage(listing);
  const price = formatListingPrice(listing);
  const rt = listingRentalType(listing);
  const addressParts = [listing.area, listing.city].filter(Boolean);

  return {
    "@context": "https://schema.org",
    "@type": "Accommodation",
    name: listing.title,
    description: listing.description.slice(0, 500),
    url: `${siteUrl}${canonicalPath}`,
    image: cover ? [cover] : undefined,
    address: {
      "@type": "PostalAddress",
      addressLocality: listing.city,
      addressRegion: listing.area ?? listing.city,
      addressCountry: "GR",
    },
    geo:
      listing.latitude != null && listing.longitude != null
        ? {
            "@type": "GeoCoordinates",
            latitude: listing.latitude,
            longitude: listing.longitude,
          }
        : undefined,
    numberOfRooms: listing.bedrooms ?? undefined,
    floorSize: listing.sqm
      ? { "@type": "QuantitativeValue", value: listing.sqm, unitCode: "MTK" }
      : undefined,
    offers: {
      "@type": "Offer",
      price: price.amount > 0 ? price.amount : undefined,
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
      description:
        rt === "short_term"
          ? pickLocale(locale, "Βραχυχρόνια μίσθωση", "Short-term rental")
          : pickLocale(locale, "Μηνιαία / μεσοπρόθεσμη μίσθωση", "Monthly / mid-term rental"),
    },
    ...(addressParts.length
      ? { containedInPlace: { "@type": "Place", name: addressParts.join(", ") } }
      : {}),
  };
}
