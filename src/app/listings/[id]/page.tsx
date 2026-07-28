import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getListingById, getListingCoverImage, isListingActive } from "@/lib/listings";
import { isPublicMvpListing } from "@/lib/rental-types";
import { getSiteUrl } from "@/lib/site-url";
import { ListingDetailBody } from "@/components/listings/ListingDetailBody";

export const revalidate = 120;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const listing = await getListingById(id);
  const t = await getTranslations("Meta");

  if (!listing || !isListingActive(listing) || !isPublicMvpListing(listing)) {
    return { title: t("listingUnavailableTitle") };
  }

  const title = `${listing.title} — ${listing.area}, ${listing.city}`;
  const description =
    listing.description.slice(0, 155) +
    (listing.description.length > 155 ? "…" : "");
  const cover = getListingCoverImage(listing);
  const canonicalPath = `/listings/${listing.slug ?? listing.id}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: `${getSiteUrl()}${canonicalPath}`,
      images: cover ? [{ url: cover, alt: listing.title }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: cover ? [cover] : undefined,
    },
  };
}

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ListingDetailBody id={id} />;
}
