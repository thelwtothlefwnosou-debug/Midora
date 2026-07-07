import Link from "next/link";
import Image from "next/image";
import type { ListingWithImages } from "@/lib/types";
import { pickListingCoverPhotoUrl } from "@/lib/listing-media";
import { formatListingPrice } from "@/lib/rental-types";
import { isSearchQualityListing } from "@/lib/search-listing-quality";

function isValidSimilarListing(listing: ListingWithImages): boolean {
  if (!isSearchQualityListing(listing)) return false;
  const cover = pickListingCoverPhotoUrl(listing);
  if (!cover) return false;
  const title = listing.title?.trim() ?? "";
  if (title.length < 3) return false;
  const location = `${listing.area ?? ""} ${listing.city ?? ""}`.trim();
  if (!location) return false;
  const price = formatListingPrice(listing);
  if (!price.display || price.amount <= 0) return false;
  return true;
}

export function SimilarListingsSection({
  listings,
}: {
  listings: ListingWithImages[];
}) {
  const valid = listings.filter(isValidSimilarListing).slice(0, 6);
  if (valid.length < 3) return null;

  return (
    <section className="listing-section">
      <h2 className="listing-section-title">Παρόμοιες αγγελίες</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {valid.map((listing) => {
          const cover = pickListingCoverPhotoUrl(listing)!;
          const price = formatListingPrice(listing);
          return (
            <Link
              key={listing.id}
              href={`/listings/${listing.slug ?? listing.id}`}
              className="group overflow-hidden rounded-2xl border border-border bg-white shadow-soft transition hover:border-gold/30"
            >
              <div className="relative aspect-[4/3] bg-sand/30">
                <Image
                  src={cover}
                  alt={listing.title}
                  fill
                  className="object-cover transition group-hover:scale-[1.02]"
                  sizes="(max-width:768px) 100vw, 33vw"
                />
              </div>
              <div className="p-4">
                <p className="font-medium text-charcoal line-clamp-2">{listing.title}</p>
                <p className="mt-1 text-xs text-muted">
                  {listing.area}, {listing.city}
                </p>
                <p className="mt-2 text-sm font-semibold text-charcoal">{price.display}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
