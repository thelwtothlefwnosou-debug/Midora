import { buildListingJsonLd } from "@/lib/seo/listing-json-ld";
import type { ListingWithImages } from "@/lib/types";

type Props = {
  listing: ListingWithImages;
  canonicalPath: string;
};

export function ListingJsonLd({ listing, canonicalPath }: Props) {
  const data = buildListingJsonLd(listing, canonicalPath);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
