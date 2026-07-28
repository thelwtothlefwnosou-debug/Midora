"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
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
  /** Compact chips for host section right column */
  compact?: boolean;
};

const MAX_VISIBLE = 3;

export function PublicCohostsBlock({
  cohosts,
  publicPhones = [],
  profileLinkContext,
  compact = false,
}: Props) {
  const t = useTranslations("Profile.public");
  const locale = useLocale();
  if (!cohosts.length) return null;

  const visible = cohosts.slice(0, MAX_VISIBLE);
  const remaining = cohosts.length - visible.length;

  if (compact) {
    return (
      <div>
        <h4 className="text-sm font-semibold text-charcoal">{t("cohosts")}</h4>
        <ul className="mt-2.5 flex flex-wrap gap-2">
          {visible.map((cohost) => {
            const name = cohost.profile
              ? profileDisplayName(cohost.profile, locale)
              : cohost.invited_name || cohost.invited_email;
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

            const chip = (
              <span className="inline-flex items-center gap-2 rounded-full border border-charcoal/10 bg-white py-1 pr-3 pl-1">
                <ProfileAvatar
                  profile={cohost.profile ?? { full_name: name }}
                  size="sm"
                  className="h-7 w-7 text-[10px]"
                />
                <span className="min-w-0">
                  <span className="block max-w-[9rem] truncate text-sm font-medium text-charcoal">
                    {name}
                  </span>
                  <span className="block text-[11px] text-muted">{t("cohost")}</span>
                </span>
              </span>
            );

            return (
              <li key={cohost.id}>
                {profileHref ? (
                  <Link
                    href={profileHref}
                    className="transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
                  >
                    {chip}
                  </Link>
                ) : (
                  chip
                )}
              </li>
            );
          })}
          {remaining > 0 ? (
            <li className="inline-flex items-center rounded-full border border-charcoal/10 bg-sand/40 px-3 py-2 text-xs font-medium text-muted">
              {t("moreCohosts", { count: remaining })}
            </li>
          ) : null}
        </ul>
      </div>
    );
  }

  return (
    <div className="mt-6 border-t border-charcoal/8 pt-6">
      <h3 className="text-sm font-semibold text-charcoal">{t("cohosts")}</h3>
      <ul className="mt-4 space-y-3">
        {cohosts.map((cohost) => {
          const name = cohost.profile
            ? profileDisplayName(cohost.profile, locale)
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
                <p className="text-sm text-muted">{t("cohost")}</p>
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
