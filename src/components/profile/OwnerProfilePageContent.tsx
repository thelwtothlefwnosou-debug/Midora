"use client";

import { useState } from "react";
import { ProfileIdentityCard } from "@/components/profile/ProfileIdentityCard";
import { OwnerProfileForm } from "@/components/profile/OwnerProfileForm";
import type { Profile } from "@/lib/types";

type Props = {
  profile: Profile;
  email: string;
  avatarUrl?: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
};

export function OwnerProfilePageContent({
  profile,
  email,
  avatarUrl,
  emailVerified,
  phoneVerified,
}: Props) {
  const [showPublicPhoto, setShowPublicPhoto] = useState(
    profile.show_profile_photo_public !== false
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(260px,320px)_1fr] lg:items-start">
      <ProfileIdentityCard
        profile={profile}
        email={email}
        avatarUrl={avatarUrl}
        emailVerified={emailVerified}
        showPublicPhoto={showPublicPhoto}
        onShowPublicPhotoChange={setShowPublicPhoto}
      />
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
