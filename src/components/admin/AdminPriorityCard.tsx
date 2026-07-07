import Link from "next/link";
import Image from "next/image";
import { MapPin, AlertTriangle } from "lucide-react";
import type { PriorityListingMeta } from "@/lib/admin/priority";
import { formatRelativeTimeGreek } from "@/lib/admin/priority";
import { rentalTypeLabel } from "@/lib/rental-types";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { cn } from "@/lib/utils";

function coverUrl(listing: PriorityListingMeta["listing"]): string | null {
  const images = listing.listing_images ?? [];
  const cover = images.find((i) => i.is_cover) ?? images[0];
  return cover?.url ?? null;
}

const priorityStyles = {
  critical: "border-red-200/80 bg-red-50/30",
  high: "border-amber-200/80 bg-amber-50/40",
  medium: "border-gold/20 bg-white",
  low: "border-border bg-white",
};

export function AdminPriorityCard({ meta }: { meta: PriorityListingMeta }) {
  const { listing, priority, missingLabels, riskBadges } = meta;
  const owner = listing.profiles as {
    full_name?: string;
    email?: string;
    avatar_path?: string | null;
    avatar_status?: "active" | "hidden_by_admin" | "removed" | null;
  } | null;
  const thumb = coverUrl(listing);
  const submittedAt = listing.updated_at ?? listing.created_at;

  return (
    <article
      className={cn(
        "flex flex-col gap-4 rounded-2xl border p-4 shadow-soft sm:flex-row sm:items-stretch",
        priorityStyles[priority]
      )}
    >
      <div className="relative h-28 w-full shrink-0 overflow-hidden rounded-xl bg-sand sm:h-auto sm:w-36">
        {thumb ? (
          <Image src={thumb} alt="" fill className="object-cover" sizes="144px" />
        ) : (
          <div className="flex h-full min-h-[7rem] items-center justify-center text-xs text-muted">
            Χωρίς εικόνα
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-display text-base font-semibold text-charcoal line-clamp-2">
              {listing.title}
            </h3>
            <p className="mt-1 flex items-center gap-1 text-sm text-muted">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              {listing.area}, {listing.city}
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-white/80 px-2.5 py-0.5 text-[11px] font-medium text-charcoal ring-1 ring-border">
            {rentalTypeLabel(listing.rental_type)}
          </span>
        </div>

        <div className="mt-3 flex items-center gap-2.5">
          <ProfileAvatar profile={owner} size="sm" />
          <div className="min-w-0 text-sm">
            <p className="font-medium text-charcoal truncate">
              {owner?.full_name ?? "Αγγελιοδότης"}
            </p>
            <p className="text-xs text-muted">Υποβλήθηκε {formatRelativeTimeGreek(submittedAt)}</p>
          </div>
        </div>

        {missingLabels.length > 0 && (
          <p className="mt-2 text-sm text-amber-900">
            <span className="font-medium">Λείπουν: </span>
            {missingLabels.slice(0, 4).join(", ")}
            {missingLabels.length > 4 ? "…" : ""}
          </p>
        )}

        {riskBadges.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {riskBadges.map((badge) => (
              <span
                key={badge}
                className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[11px] font-medium text-red-700"
              >
                <AlertTriangle className="h-3 w-3" />
                {badge}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto pt-3">
          <Link
            href={`/admin/listings/${listing.id}`}
            className="inline-flex min-h-10 items-center justify-center rounded-xl bg-gold px-4 text-sm font-semibold text-white hover:bg-gold-dark"
          >
            Προβολή &amp; έλεγχος
          </Link>
        </div>
      </div>
    </article>
  );
}
