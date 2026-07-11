import Link from "next/link";
import { BadgeCheck, Phone } from "lucide-react";
import type { ListingPublicDetail } from "@/lib/types";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { canShowPublicAvatar, resolveProfileAvatarUrl } from "@/lib/profile-avatar";
import { getSupabaseUrl } from "@/lib/supabase/config";
import {
  advertiserTypeLabel,
  formatCommunicationLanguages,
  profileDisplayName,
} from "@/lib/profile-display";

export function ListingAdvertiserSection({
  listing,
  onContact,
}: {
  listing: ListingPublicDetail;
  onContact?: () => void;
}) {
  const profile = listing.profiles;
  if (!profile?.full_name && !listing.contact_name) return null;

  const displayName = profile
    ? profileDisplayName(profile)
    : listing.contact_name ?? "Αγγελιοδότης";
  const advertiserLabel = profile ? advertiserTypeLabel(profile.advertiser_type) : null;
  const languages = formatCommunicationLanguages(profile?.communication_languages);
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("el-GR", {
        month: "long",
        year: "numeric",
      })
    : null;
  const phoneVerified = Boolean(profile?.primary_phone_verified_at);
  const avatarUrl =
    profile && canShowPublicAvatar(profile)
      ? resolveProfileAvatarUrl(profile, getSupabaseUrl())
      : null;

  return (
    <section id="advertiser" className="listing-section scroll-mt-28">
      <h2 className="listing-section-title">Γνώρισε τον αγγελιοδότη</h2>
      <div className="listing-card mt-5 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <ProfileAvatar profile={profile} imageUrl={avatarUrl} size="lg" />
          <div>
            <p className="text-lg font-semibold tracking-tight text-charcoal">{displayName}</p>
            {advertiserLabel && (
              <p className="mt-0.5 text-sm text-muted">{advertiserLabel}</p>
            )}
            {profile?.bio?.trim() && (
              <p className="mt-2 line-clamp-3 text-sm text-charcoal/80">{profile.bio}</p>
            )}
            {languages && (
              <p className="mt-1 text-sm text-muted">Γλώσσες: {languages}</p>
            )}
            {memberSince && (
              <p className="mt-1 text-sm text-muted">Μέλος από {memberSince}</p>
            )}
            {phoneVerified && (
              <p className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-teal">
                <BadgeCheck className="h-4 w-4" />
                Επαληθευμένο τηλέφωνο
              </p>
            )}
            {(listing.advertiser_active_listings ?? 0) > 1 && (
              <p className="mt-1 text-sm text-muted">
                {listing.advertiser_active_listings} ενεργές αγγελίες
              </p>
            )}
          </div>
        </div>
        {onContact ? (
          <button
            type="button"
            onClick={onContact}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border px-5 text-sm font-medium text-charcoal hover:border-gold/40"
          >
            <Phone className="h-4 w-4 text-gold" />
            Επικοινωνία με αγγελιοδότη
          </button>
        ) : (
          <Link
            href="#listing-contact"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border px-5 text-sm font-medium text-charcoal hover:border-gold/40"
          >
            <Phone className="h-4 w-4 text-gold" />
            Επικοινωνία με αγγελιοδότη
          </Link>
        )}
      </div>
    </section>
  );
}
