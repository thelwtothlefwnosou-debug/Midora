import Link from "next/link";
import Image from "next/image";
import { Home } from "lucide-react";
import { COHOST_PERMISSION_LEVEL_LABELS } from "@/lib/listing-cohost-permissions";
import { getCohostManagedListings } from "@/lib/listing-cohosts-db";
import { pickListingCoverPhotoUrl } from "@/lib/listing-media";
import { getListingPublicId } from "@/lib/utils";
import { profileDisplayName } from "@/lib/profile-display";
import type { ListingCohost, ListingWithImages, Profile } from "@/lib/types";

export type CohostManagedListingItem = {
  cohost: ListingCohost;
  listing: ListingWithImages;
  ownerProfile: Pick<Profile, "id" | "full_name" | "display_name"> | null;
};

type Props = {
  userId: string;
  items?: CohostManagedListingItem[];
  prominent?: boolean;
};

export async function CohostManagedListingsSection({
  userId,
  items: itemsProp,
  prominent = false,
}: Props) {
  const items = itemsProp ?? (await getCohostManagedListings(userId));
  if (!items.length) return null;

  return (
    <section className={prominent ? "mb-8" : "mt-10"}>
      <h2 className="font-display text-lg font-semibold text-charcoal">
        Αγγελίες που διαχειρίζομαι
      </h2>
      <p className="mt-1 text-sm text-muted">
        {prominent
          ? "Εδώ εμφανίζονται τα ακίνητα όπου είσαι συνοικοδεσπότης — πάτα μία για να δεις την αγγελία."
          : "Ακίνητα όπου είσαι συνοικοδεσπότης με ενεργή πρόσκληση."}
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(({ cohost, listing, ownerProfile }) => {
          const cover = pickListingCoverPhotoUrl(listing);
          const location = [
            listing.area_display_name || listing.area,
            listing.city_display_name || listing.city,
          ]
            .filter(Boolean)
            .join(", ");
          const ownerName = ownerProfile ? profileDisplayName(ownerProfile) : "Ιδιοκτήτης";

          return (
            <Link
              key={cohost.id}
              href={`/listings/${getListingPublicId(listing)}`}
              className="overflow-hidden rounded-2xl border border-border bg-white shadow-soft transition-shadow hover:shadow-md"
            >
              <div className="relative h-36 bg-sand">
                {cover ? (
                  <Image src={cover} alt="" fill className="object-cover" sizes="320px" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Home className="h-8 w-8 text-muted/40" />
                  </div>
                )}
              </div>
              <div className="p-4">
                <p className="line-clamp-2 font-medium text-charcoal">{listing.title}</p>
                <p className="mt-1 text-sm text-muted">{location}</p>
                <p className="mt-2 text-xs text-muted">Ιδιοκτήτης: {ownerName}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="rounded-full bg-charcoal/8 px-2 py-0.5 text-xs font-medium text-charcoal">
                    Συνοικοδεσπότης
                  </span>
                  <span className="rounded-full bg-sand px-2 py-0.5 text-xs text-muted">
                    {COHOST_PERMISSION_LEVEL_LABELS[cohost.permission_level]}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
