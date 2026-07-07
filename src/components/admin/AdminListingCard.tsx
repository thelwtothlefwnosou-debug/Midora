import Image from "next/image";
import Link from "next/link";
import { ExternalLink, MapPin, CheckCircle2, XCircle } from "lucide-react";
import { AdminListingsRowActions } from "@/components/admin/AdminListingsRowActions";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { getListingCompleteness } from "@/lib/admin/listing-completeness";
import { getEffectiveListingStatus } from "@/lib/listing-status";
import { resolveProfileAvatarUrl, type ProfileAvatarFields } from "@/lib/profile-avatar";
import {
  listingRentalBadgeLabels,
  listingRentalType,
  rentalTypeLabel,
} from "@/lib/rental-types";
import type { ListingWithImages } from "@/lib/types";
import { getListingPublicId } from "@/lib/utils";
import { cn } from "@/lib/utils";

const APPROVAL_STATUS_LABELS: Record<string, string> = {
  draft: "Πρόχειρο",
  pending_review: "Σε έλεγχο",
  needs_changes: "Χρειάζονται αλλαγές",
  approved: "Εγκρίθηκε",
  rejected: "Απορρίφθηκε",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Σε έλεγχο",
  approved: "Ενεργή",
  rejected: "Απορρίφθηκε",
  expired: "Έληξε",
};

export type AdminListingCardProps = {
  listing: ListingWithImages & {
    report_count?: number;
    owner_active_listing_count?: number;
  };
  supabaseUrl?: string;
};

function coverUrl(listing: ListingWithImages): string | null {
  const images = listing.listing_images ?? [];
  const cover = images.find((i) => i.is_cover) ?? images[0];
  return cover?.url ?? null;
}

function formatPrice(listing: ListingWithImages): string {
  const rentalType = listingRentalType(listing);
  if (rentalType === "short_term" && listing.price_per_night) {
    return `€${listing.price_per_night}/βράδυ`;
  }
  if (listing.price_monthly) {
    return `€${listing.price_monthly}/μήνα`;
  }
  if (listing.price_per_night) {
    return `€${listing.price_per_night}/βράδυ`;
  }
  return "—";
}

function statusLabel(listing: ListingWithImages): string {
  if (listing.is_hidden) return "Κρυφή";
  const approval = listing.approval_status;
  if (approval && APPROVAL_STATUS_LABELS[approval]) {
    return APPROVAL_STATUS_LABELS[approval];
  }
  const effective = getEffectiveListingStatus(listing);
  return STATUS_LABELS[effective] ?? effective;
}

export function AdminListingCard({ listing, supabaseUrl }: AdminListingCardProps) {
  const owner = listing.profiles as ProfileAvatarFields & {
    id?: string;
    phone?: string;
    primary_phone_verified_at?: string | null;
  } | null;
  const thumb = coverUrl(listing);
  const completeness = getListingCompleteness(listing);
  const rentalBadges = listingRentalBadgeLabels(listing);
  const avatarUrl = resolveProfileAvatarUrl(owner, supabaseUrl);
  const publicId = getListingPublicId(listing);
  const submittedAt = listing.updated_at ?? listing.created_at;
  const effective = getEffectiveListingStatus(listing);
  const isPending =
    effective === "pending" || listing.approval_status === "pending_review";
  const phoneVerified = Boolean(owner?.primary_phone_verified_at);
  const activeCount = listing.owner_active_listing_count ?? 0;
  const reportCount = listing.report_count ?? 0;

  return (
    <article className="rounded-2xl border border-border bg-white p-4 shadow-soft">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.9fr)_auto] xl:items-center">
        {/* LEFT */}
        <div className="flex gap-3 min-w-0">
          <div className="relative h-[72px] w-24 shrink-0 overflow-hidden rounded-lg bg-sand">
            {thumb ? (
              <Image src={thumb} alt="" fill className="object-cover" sizes="96px" />
            ) : (
              <div className="flex h-full items-center justify-center text-[10px] text-muted">
                Χωρίς εικόνα
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-sm font-semibold text-charcoal line-clamp-2">
              {listing.title}
            </h3>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
              <MapPin className="h-3 w-3 shrink-0" />
              {listing.area}, {listing.city}
            </p>
            <p className="mt-1 font-mono text-[10px] text-muted/80">#{listing.id.slice(0, 8)}</p>
            <Link
              href={`/listings/${publicId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-gold hover:underline"
            >
              Δημόσια προεπισκόπηση
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* MIDDLE */}
        <div className="space-y-1.5 text-sm">
          <div className="flex flex-wrap gap-1">
            <span className="rounded-full bg-sand px-2 py-0.5 text-[11px] font-medium text-charcoal">
              {rentalBadges.primary}
            </span>
            {rentalBadges.secondary && (
              <span className="rounded-full bg-gold/10 px-2 py-0.5 text-[11px] font-medium text-gold-dark">
                {rentalBadges.secondary}
              </span>
            )}
            {!rentalBadges.secondary && (
              <span className="rounded-full bg-white px-2 py-0.5 text-[11px] text-muted ring-1 ring-border">
                {rentalTypeLabel(listing.rental_type)}
              </span>
            )}
          </div>
          <p className="font-semibold text-charcoal">{formatPrice(listing)}</p>
          <p className="text-xs text-muted">
            <span className="font-medium text-charcoal">Κατάσταση: </span>
            {statusLabel(listing)}
            {reportCount > 0 && (
              <span className="ml-1.5 text-red-600">· {reportCount} αναφορ{reportCount === 1 ? "ά" : "ές"}</span>
            )}
          </p>
          <p className="text-[11px] text-muted">
            Υποβλήθηκε {new Date(submittedAt).toLocaleDateString("el-GR")}
          </p>
        </div>

        {/* OWNER */}
        <div className="flex items-start gap-2.5 min-w-0">
          <ProfileAvatar profile={owner} imageUrl={avatarUrl} size="sm" />
          <div className="min-w-0 text-sm">
            <p className="font-medium text-charcoal truncate">{owner?.full_name ?? "—"}</p>
            <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted">
              {phoneVerified ? (
                <>
                  <CheckCircle2 className="h-3 w-3 text-teal" />
                  Επαληθευμένο τηλ.
                </>
              ) : (
                <>
                  <XCircle className="h-3 w-3 text-amber-600" />
                  Μη επαληθευμένο τηλ.
                </>
              )}
            </p>
            <p className="mt-0.5 truncate text-[11px] text-muted">{owner?.email ?? "—"}</p>
            <p className="mt-0.5 text-[11px] text-muted">
              {activeCount} ενεργ{activeCount === 1 ? "ή" : "ές"} αγγελί{activeCount === 1 ? "α" : "ες"}
            </p>
          </div>
        </div>

        {/* COMPLETENESS */}
        <div className="text-sm">
          <div className="flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-sand">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  completeness.score === completeness.total ? "bg-teal" : "bg-gold"
                )}
                style={{ width: `${(completeness.score / completeness.total) * 100}%` }}
              />
            </div>
            <span className="shrink-0 text-xs font-semibold tabular-nums text-charcoal">
              {completeness.score}/{completeness.total}
            </span>
          </div>
          {completeness.missingLabels.length > 0 ? (
            <p className="mt-1.5 text-[11px] leading-snug text-amber-900">
              Λείπουν: {completeness.missingLabels.slice(0, 3).join(", ")}
              {completeness.missingLabels.length > 3 ? "…" : ""}
            </p>
          ) : (
            <p className="mt-1.5 text-[11px] text-teal">Πλήρης</p>
          )}
        </div>

        {/* RIGHT */}
        <div className="flex flex-col gap-2 xl:items-end">
          <AdminListingsRowActions
            listingId={listing.id}
            isHidden={Boolean(listing.is_hidden)}
            isPending={isPending}
          />
        </div>
      </div>
    </article>
  );
}
