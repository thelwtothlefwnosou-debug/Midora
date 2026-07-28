"use client";

import { useLocale, useTranslations } from "next-intl";
import {
  AdvertiserPublicProfileBlock,
  buildAdvertiserPublicProfileData,
} from "@/components/profile/AdvertiserPublicProfileBlock";
import { getAdvertiserSectionTitle, profileDisplayName } from "@/lib/profile-display";
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
  const t = useTranslations("Owner.profilePreview");
  const tProfile = useTranslations("Profile.public");
  const locale = useLocale();
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

  const displayName = profileDisplayName(previewProfile, locale);
  const publicAvatar =
    canShowPublicAvatar(previewProfile) && avatarUrl ? avatarUrl : null;

  const blockData = buildAdvertiserPublicProfileData({
    profile: previewProfile,
    displayName,
    roleLabel: rentalMode === "short_term" ? t("hostRole") : t("ownerRole"),
    avatarUrl: publicAvatar,
    phoneVerified,
    activeListings: 1,
    rentalMode,
    t: tProfile,
  });

  return (
    <section className="rounded-2xl border border-gold/25 bg-[#faf7f2] p-5 sm:p-6">
      <p className="text-xs font-semibold tracking-wide text-gold-dark uppercase">
        {t("previewLabel")}
      </p>
      <h3 className="listing-section-title mt-2">
        {getAdvertiserSectionTitle(rentalMode, tProfile)}
      </h3>
      <p className="mt-1 text-sm text-muted">
        {t("sectionSubtitle")}
      </p>

      <div className="mt-5">
        <AdvertiserPublicProfileBlock {...blockData} showCta={false} showTrustNote={false} />
      </div>

      {!avatarUrl ? (
        <p className="mt-4 text-xs text-muted">
          {t("uploadPhotoHint")}
        </p>
      ) : null}
      {avatarUrl && showPublicPhoto === false ? (
        <p className="mt-4 text-xs text-muted">
          {t("hiddenPhotoHint")}
        </p>
      ) : null}
    </section>
  );
}
