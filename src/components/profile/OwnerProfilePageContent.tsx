"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { ProfileIdentityCard } from "@/components/profile/ProfileIdentityCard";
import { OwnerProfileForm } from "@/components/profile/OwnerProfileForm";
import { OWNER_LISTING_NEW_PATH } from "@/lib/owner-flow";
import { ownerListingContinueWizardHref } from "@/lib/owner-listing-ui-status";
import type { Profile } from "@/lib/types";

type Props = {
  profile: Profile;
  email: string;
  avatarUrl?: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  totalListings?: number;
  publishedCount?: number;
  draftCount?: number;
  firstDraftId?: string | null;
};

export function OwnerProfilePageContent({
  profile,
  email,
  avatarUrl,
  emailVerified,
  phoneVerified,
  totalListings = 0,
  publishedCount = 0,
  draftCount = 0,
  firstDraftId = null,
}: Props) {
  const t = useTranslations("Owner.profilePage");
  const [showPublicPhoto, setShowPublicPhoto] = useState(
    profile.show_profile_photo_public !== false
  );

  const showZeroListingNudge = totalListings === 0 && publishedCount === 0;
  const showContinueDraft =
    publishedCount === 0 && draftCount > 0 && Boolean(firstDraftId);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(260px,320px)_1fr] lg:items-start">
      <div className="space-y-4">
        <ProfileIdentityCard
          profile={profile}
          email={email}
          avatarUrl={avatarUrl}
          emailVerified={emailVerified}
          showPublicPhoto={showPublicPhoto}
          onShowPublicPhotoChange={setShowPublicPhoto}
        />
        {showZeroListingNudge ? (
          <div className="rounded-2xl border border-border bg-white p-4 shadow-soft">
            <p className="font-display text-sm font-semibold text-charcoal">
              {t("zeroListingTitle")}
            </p>
            <p className="mt-1 text-sm text-muted">{t("zeroListingBody")}</p>
            <Link
              href={OWNER_LISTING_NEW_PATH}
              className="mt-3 inline-flex min-h-11 items-center rounded-full bg-charcoal px-4 text-sm font-medium text-white hover:bg-charcoal/90"
            >
              {t("zeroListingCta")}
            </Link>
          </div>
        ) : null}
        {showContinueDraft && firstDraftId ? (
          <div className="rounded-2xl border border-border bg-white p-4 shadow-soft">
            <p className="font-display text-sm font-semibold text-charcoal">
              {t("continueListingCta")}
            </p>
            <Link
              href={ownerListingContinueWizardHref(firstDraftId)}
              className="mt-3 inline-flex min-h-11 items-center rounded-full bg-charcoal px-4 text-sm font-medium text-white hover:bg-charcoal/90"
            >
              {t("continueListingCta")}
            </Link>
          </div>
        ) : null}
      </div>
      <OwnerProfileForm
        profile={profile}
        email={email}
        avatarUrl={avatarUrl}
        phoneVerified={phoneVerified}
        emailVerified={emailVerified}
        showPublicPhoto={showPublicPhoto}
      />
    </div>
  );
}
