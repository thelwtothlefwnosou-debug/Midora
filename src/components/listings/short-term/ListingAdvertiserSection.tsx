import type { ListingCohostWithProfile, ListingContactNumber, ListingPublicDetail } from "@/lib/types";

import { canShowPublicAvatar, resolveProfileAvatarUrl } from "@/lib/profile-avatar";

import { getSupabaseUrl } from "@/lib/supabase/config";

import { advertiserSectionTitle, profileDisplayName } from "@/lib/profile-display";

import {

  publicProfilePath,

  type PublicProfileLinkContext,

} from "@/lib/profile-public-url";

import {

  AdvertiserPublicProfileBlock,

  buildAdvertiserPublicProfileData,

} from "@/components/profile/AdvertiserPublicProfileBlock";

import { PublicCohostsBlock } from "@/components/listings/detail/PublicCohostsBlock";



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

  const profile = listing.profiles;

  if (!profile?.full_name && !profile?.display_name && !listing.contact_name) return null;



  const displayName = profile

    ? profileDisplayName(profile)

    : listing.contact_name ?? "Ιδιοκτήτης";

  const phoneVerified = Boolean(profile?.primary_phone_verified_at);

  const avatarUrl =

    profile && canShowPublicAvatar(profile)

      ? resolveProfileAvatarUrl(profile, getSupabaseUrl())

      : null;

  const roleLabel = rentalMode === "short_term" ? "Οικοδεσπότης" : "Ιδιοκτήτης";



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

  });



  return (

    <section id="advertiser" className="listing-section scroll-mt-28">

      <h2 className="listing-section-title">{advertiserSectionTitle(rentalMode)}</h2>



      <div className="mt-6">

        <AdvertiserPublicProfileBlock

          {...blockData}

          onContact={onContact}

          profileHref={ownerProfileHref}

        />

        {ownerPublicPhone && (

          <div className="mt-4 text-sm text-charcoal/80">

            <p className="font-medium text-charcoal">Τηλέφωνα επικοινωνίας</p>

            <p className="mt-1">

              {displayName} — {ownerPublicPhone.label || "Ιδιοκτήτης"} —{" "}

              <a href={`tel:${ownerPublicPhone.phone_number}`} className="hover:text-gold-dark">

                {ownerPublicPhone.phone_number}

              </a>

            </p>

          </div>

        )}

        <PublicCohostsBlock

          cohosts={cohosts}

          publicPhones={publicContactPhones.filter((p) => p.role === "cohost")}

          profileLinkContext={profileLinkContext}

        />

      </div>

    </section>

  );

}

