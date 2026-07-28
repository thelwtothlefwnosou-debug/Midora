"use client";

import { useLocale, useTranslations } from "next-intl";
import type { ListingCohostWithProfile, ListingContactNumber, ListingPublicDetail } from "@/lib/types";
import { canShowPublicAvatar, resolveProfileAvatarUrl } from "@/lib/profile-avatar";
import { getSupabaseUrl } from "@/lib/supabase/config";
import { getAdvertiserSectionTitle, profileDisplayName } from "@/lib/profile-display";
import {
  publicProfilePath,
  type PublicProfileLinkContext,
} from "@/lib/profile-public-url";
import {
  AdvertiserPublicProfileBlock,
  buildAdvertiserPublicProfileData,
} from "@/components/profile/AdvertiserPublicProfileBlock";

export function ListingAdvertiserSection({
  listing,
  onContact,
  rentalMode = "short_term",
  cohosts = [],
  publicContactPhones = [],
  profileLinkContext,
}: {
  listing: ListingPublicDetail;
  onContact?: () => void;
  rentalMode?: "short_term" | "monthly";
  cohosts?: ListingCohostWithProfile[];
  publicContactPhones?: ListingContactNumber[];
  profileLinkContext?: PublicProfileLinkContext;
}) {
  const tProfile = useTranslations("Profile.public");
  const locale = useLocale();
  const profile = listing.profiles;
  if (!profile?.full_name && !profile?.display_name && !listing.contact_name) return null;

  const displayName = profile
    ? profileDisplayName(profile, locale)
    : listing.contact_name ?? tProfile("ownerFallback");
  const phoneVerified = Boolean(profile?.primary_phone_verified_at);
  const avatarUrl =
    profile && canShowPublicAvatar(profile)
      ? resolveProfileAvatarUrl(profile, getSupabaseUrl())
      : null;
  const roleLabel = rentalMode === "short_term" ? tProfile("hostRole") : tProfile("ownerRole");

  const ownerPublicPhone = publicContactPhones.find((p) => p.role === "owner");

  const ownerProfileHref =
    profile?.id != null
      ? publicProfilePath(
          {
            id: profile.id,
            public_slug: profile.public_slug,
            public_profile_enabled: profile.public_profile_enabled,
          },
          profileLinkContext
        )
      : null;

  const blockData = buildAdvertiserPublicProfileData({
    profile: profile ?? null,
    displayName,
    roleLabel,
    avatarUrl,
    phoneVerified,
    activeListings: listing.advertiser_active_listings ?? 0,
    rentalMode,
    t: tProfile,
  });

  return (
    <section id="advertiser" className="listing-section scroll-mt-28">
      <h2 className="listing-section-title">{getAdvertiserSectionTitle(rentalMode, tProfile)}</h2>

      <div className="mt-5">
        <AdvertiserPublicProfileBlock
          {...blockData}
          onContact={onContact}
          profileHref={ownerProfileHref}
          cohosts={cohosts}
          cohostPhones={publicContactPhones.filter((p) => p.role === "cohost")}
          profileLinkContext={profileLinkContext}
        />

        {ownerPublicPhone ? (
          <p className="mt-4 text-sm text-charcoal/75">
            <span className="font-medium text-charcoal">{tProfile("phoneLabel")}</span>{" "}
            <a
              href={`tel:${ownerPublicPhone.phone_number}`}
              className="hover:text-gold-dark"
            >
              {ownerPublicPhone.phone_number}
            </a>
          </p>
        ) : null}
      </div>
    </section>
  );
}
