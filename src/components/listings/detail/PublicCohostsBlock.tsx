"use client";

import Link from "next/link";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { profileDisplayName } from "@/lib/profile-display";
import {
  publicProfilePath,
  type PublicProfileLinkContext,
} from "@/lib/profile-public-url";
import type { ListingCohostWithProfile, ListingContactNumber } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  cohosts: ListingCohostWithProfile[];
  publicPhones?: ListingContactNumber[];
  profileLinkContext?: PublicProfileLinkContext;
};

export function PublicCohostsBlock({
  cohosts,
  publicPhones = [],
  profileLinkContext,
}: Props) {
  if (!cohosts.length) return null;

  return (
    <div className="mt-6 border-t border-charcoal/8 pt-6">
      <h3 className="text-sm font-semibold text-charcoal">Συνοικοδεσπότες</h3>
      <ul className="mt-4 space-y-3">
        {cohosts.map((cohost) => {
          const name = cohost.profile
            ? profileDisplayName(cohost.profile)
            : cohost.invited_name || cohost.invited_email;
          const phone = publicPhones.find((p) => p.user_id === cohost.cohost_user_id);
          const profileHref =
            cohost.profile?.id != null
              ? publicProfilePath(
                  {
                    id: cohost.profile.id,
                    public_slug: cohost.profile.public_slug,
                    public_profile_enabled: cohost.profile.public_profile_enabled,
                  },
                  profileLinkContext
                )
              : null;

          const content = (
            <>
              <ProfileAvatar profile={cohost.profile ?? { full_name: name }} size="md" />
              <div className="min-w-0">
                <p
                  className={cn(
                    "font-medium text-charcoal",
                    profileHref && "group-hover:underline"
                  )}
                >
                  {name}
                </p>
                <p className="text-sm text-muted">Συνοικοδεσπότης</p>
                {phone && (
                  <a
                    href={`tel:${phone.phone_number}`}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-0.5 block text-sm text-charcoal/75 hover:text-gold-dark"
                  >
                    {phone.phone_number}
                  </a>
                )}
              </div>
            </>
          );

          return (
            <li key={cohost.id}>
              {profileHref ? (
                <Link
                  href={profileHref}
                  className="group flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-sand/40"
                >
                  {content}
                </Link>
              ) : (
                <div className="flex items-center gap-3 px-2 py-2">{content}</div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
