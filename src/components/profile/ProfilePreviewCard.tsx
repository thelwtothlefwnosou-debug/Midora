"use client";

import { BadgeCheck, Mail } from "lucide-react";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import {
  advertiserTypeLabel,
  formatCommunicationLanguages,
  profileDisplayName,
} from "@/lib/profile-display";
import { canShowPublicAvatar } from "@/lib/profile-avatar";
import type { Profile } from "@/lib/types";

type Props = {
  profile: Profile;
  email: string;
  avatarUrl?: string | null;
  phoneVerified?: boolean;
  emailVerified?: boolean;
  displayNameOverride?: string;
};

export function ProfilePreviewCard({
  profile,
  email,
  avatarUrl,
  phoneVerified = false,
  emailVerified = false,
  displayNameOverride,
}: Props) {
  const previewProfile = displayNameOverride
    ? { ...profile, display_name: displayNameOverride }
    : profile;
  const displayName = profileDisplayName(previewProfile);
  const publicAvatar =
    canShowPublicAvatar(profile) && avatarUrl ? avatarUrl : null;
  const languages = formatCommunicationLanguages(profile.communication_languages);

  return (
    <div className="rounded-2xl border border-dashed border-border bg-sand/20 p-5">
      <p className="text-xs font-medium tracking-wide text-muted uppercase">
        Έτσι εμφανίζεται το προφίλ σου στους ενδιαφερόμενους
      </p>
      <div className="mt-4 flex items-start gap-4 rounded-xl border border-border bg-white p-4">
        <ProfileAvatar
          profile={{ ...profile, email }}
          imageUrl={publicAvatar}
          size="lg"
          className="h-14 w-14"
        />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-charcoal">{displayName}</p>
          <p className="mt-0.5 text-sm text-muted">
            {advertiserTypeLabel(profile.advertiser_type)}
          </p>
          {profile.bio?.trim() && (
            <p className="mt-2 line-clamp-3 text-sm text-charcoal/80">{profile.bio}</p>
          )}
          {languages && (
            <p className="mt-2 text-xs text-muted">Γλώσσες: {languages}</p>
          )}
          {(emailVerified || phoneVerified) && (
            <div className="mt-2 flex flex-wrap gap-2">
              {emailVerified && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-teal">
                  <Mail className="h-3.5 w-3.5" />
                  Επιβεβαιωμένο email
                </span>
              )}
              {phoneVerified && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-teal">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  Επιβεβαιωμένο τηλέφωνο
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
