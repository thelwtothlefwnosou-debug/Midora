"use client";

import {
  AdvertiserPublicProfileBlock,
  buildAdvertiserPublicProfileData,
} from "@/components/profile/AdvertiserPublicProfileBlock";
import { advertiserSectionTitle, profileDisplayName } from "@/lib/profile-display";
import { canShowPublicAvatar } from "@/lib/profile-avatar";
import type { Profile } from "@/lib/types";

type Props = {
  profile: Profile;
  avatarUrl?: string | null;
  phoneVerified?: boolean;
  displayNameOverride?: string;
  bioOverride?: string;
  advertiserTypeOverride?: Profile["advertiser_type"];
  languagesOverride?: string[] | null;
  businessTitleOverride?: string;
  rentalMode?: "short_term" | "monthly";
  showPublicPhoto?: boolean;
};

export function ProfilePreviewCard({
  profile,
  avatarUrl,
  phoneVerified = false,
  displayNameOverride,
  bioOverride,
  advertiserTypeOverride,
  languagesOverride,
  businessTitleOverride,
  rentalMode = "short_term",
  showPublicPhoto,
}: Props) {
  const previewProfile: Profile = {
    ...profile,
    display_name: displayNameOverride ?? profile.display_name,
    bio: bioOverride ?? profile.bio,
    advertiser_type: advertiserTypeOverride ?? profile.advertiser_type,
    communication_languages: languagesOverride ?? profile.communication_languages,
    business_title: businessTitleOverride ?? profile.business_title,
    show_profile_photo_public:
      showPublicPhoto !== undefined
        ? showPublicPhoto
        : profile.show_profile_photo_public,
  };

  const displayName = profileDisplayName(previewProfile);
  const publicAvatar =
    canShowPublicAvatar(previewProfile) && avatarUrl ? avatarUrl : null;

  const blockData = buildAdvertiserPublicProfileData({
    profile: previewProfile,
    displayName,
    roleLabel: rentalMode === "short_term" ? "Οικοδεσπότης" : "Ιδιοκτήτης",
    avatarUrl: publicAvatar,
    phoneVerified,
    activeListings: 1,
    rentalMode,
  });

  return (
    <section className="rounded-2xl border border-gold/25 bg-[#faf7f2] p-5 sm:p-6">
      <p className="text-xs font-semibold tracking-wide text-gold-dark uppercase">
        Προεπισκόπηση στην αγγελία
      </p>
      <h3 className="listing-section-title mt-2">
        {advertiserSectionTitle(rentalMode)}
      </h3>
      <p className="mt-1 text-sm text-muted">
        Έτσι εμφανίζεται το προφίλ σου στην ενότητα ιδιοκτήτη της δημόσιας αγγελίας.
      </p>

      <div className="mt-5">
        <AdvertiserPublicProfileBlock {...blockData} showCta={false} />
      </div>

      {!avatarUrl ? (
        <p className="mt-4 text-xs text-muted">
          Ανέβασε φωτογραφία και ενεργοποίησε «Εμφάνιση δημόσια στις αγγελίες» για να φαίνεται
          avatar στην αγγελία.
        </p>
      ) : null}
      {avatarUrl && showPublicPhoto === false ? (
        <p className="mt-4 text-xs text-muted">
          Η φωτογραφία σου είναι κρυφή — στην αγγελία θα εμφανίζεται μόνο τα αρχικά σου.
        </p>
      ) : null}
    </section>
  );
}
