"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { BadgeCheck, Building2, Languages } from "lucide-react";
import { useTranslations } from "next-intl";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { ListingTrustNote } from "@/components/listings/detail/ListingTrustNote";
import { PublicCohostsBlock } from "@/components/listings/detail/PublicCohostsBlock";
import {
  advertiserListingNote,
  advertiserOwnerTypeDetail,
  formatActiveListingsLabel,
  formatCommunicationLanguages,
  getAdvertiserListingNote,
  getAdvertiserOwnerTypeDetail,
  getFormatActiveListingsLabel,
  getProfileJoinedLabel,
  profileJoinedLabel,
} from "@/lib/profile-display";
import type { ListingCohostWithProfile, ListingContactNumber, Profile } from "@/lib/types";
import type { PublicProfileLinkContext } from "@/lib/profile-public-url";
import { cn } from "@/lib/utils";

export type AdvertiserPublicProfileData = {
  displayName: string;
  roleLabel: string;
  bio: string | null;
  avatarUrl: string | null;
  profileForAvatar?: Pick<Profile, "full_name" | "display_name"> | null;
  phoneVerified: boolean;
  joinedLabel: string | null;
  activeListingsLabel: string | null;
  profession: string | null;
  languages: string | null;
  ownerTypeDetail: string | null;
  advertiserNote: string | null;
  rentalMode?: "short_term" | "monthly";
};

type Props = AdvertiserPublicProfileData & {
  onContact?: () => void;
  showCta?: boolean;
  className?: string;
  profileHref?: string | null;
  detailsTitle?: string;
  bioOverride?: string | null;
  showTrustNote?: boolean;
  cohosts?: ListingCohostWithProfile[];
  cohostPhones?: ListingContactNumber[];
  profileLinkContext?: PublicProfileLinkContext;
};

function ProfileIdentityLink({
  href,
  children,
  className,
}: {
  href?: string | null;
  children: ReactNode;
  className?: string;
}) {
  if (!href) return <div className={className}>{children}</div>;
  return (
    <Link
      href={href}
      className={cn(
        "group block rounded-2xl transition-colors hover:bg-sand/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40",
        className
      )}
    >
      {children}
    </Link>
  );
}

export function AdvertiserPublicProfileBlock({
  displayName,
  roleLabel,
  bio,
  avatarUrl,
  profileForAvatar,
  phoneVerified,
  joinedLabel,
  activeListingsLabel,
  languages,
  ownerTypeDetail,
  advertiserNote,
  rentalMode = "short_term",
  onContact,
  showCta = true,
  className,
  profileHref,
  detailsTitle,
  bioOverride,
  showTrustNote = true,
  cohosts = [],
  cohostPhones = [],
  profileLinkContext,
}: Props) {
  const t = useTranslations("Legal.shared");
  const tProfile = useTranslations("Profile.public");
  const isShortTerm = rentalMode === "short_term";
  const introTitle =
    detailsTitle ??
    (isShortTerm ? tProfile("contactHostTitle") : tProfile("contactOwnerTitle"));

  const realBio = bioOverride?.trim() || bio?.trim() || null;
  const summaryText =
    realBio ||
    (isShortTerm ? tProfile("shortTermDefaultBio") : tProfile("monthlyDefaultBio"));

  const ctaLabel = isShortTerm
    ? t("hostMessageCtaShortTerm")
    : t("hostMessageCtaMonthly");
  const ctaHelper = isShortTerm
    ? t("hostMessageHelperShortTerm")
    : t("hostMessageHelperMonthly");

  const ctaClass =
    "inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-charcoal/12 bg-charcoal/[0.03] px-5 text-sm font-semibold text-charcoal transition-colors hover:border-charcoal/22 hover:bg-sand/50";

  const metaBits = [
    roleLabel,
    ownerTypeDetail,
    joinedLabel,
    activeListingsLabel,
  ].filter(Boolean) as string[];

  return (
    <div
      className={cn(
        "grid gap-5 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)] lg:items-start lg:gap-8",
        className
      )}
    >
      <div className="min-w-0 space-y-3">
        <ProfileIdentityLink href={profileHref} className="w-full">
          <div className="rounded-2xl border border-charcoal/8 bg-white px-5 py-5 text-center shadow-[0_8px_28px_-16px_rgba(26,26,26,0.22)] sm:px-6 sm:py-5">
            <ProfileAvatar
              profile={profileForAvatar ?? undefined}
              imageUrl={avatarUrl}
              size="lg"
              className="mx-auto h-16 w-16 text-base"
            />

            {phoneVerified ? (
              <p className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-teal/10 px-2.5 py-0.5 text-[11px] font-medium text-teal">
                <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
                {tProfile("phoneVerified")}
              </p>
            ) : null}

            <p
              className={cn(
                "mt-2.5 text-lg font-semibold tracking-tight text-charcoal",
                profileHref && "group-hover:underline"
              )}
            >
              {displayName}
            </p>

            {metaBits.length > 0 ? (
              <p className="mt-1 text-sm leading-snug text-muted">{metaBits.join(" · ")}</p>
            ) : null}
          </div>
        </ProfileIdentityLink>

        {(languages || advertiserNote) && (
          <ul className="space-y-1.5 px-1 text-sm text-charcoal/75">
            {languages ? (
              <li className="flex items-start gap-2">
                <Languages className="mt-0.5 h-4 w-4 shrink-0 text-gold/90" aria-hidden />
                <span>{tProfile("languagesLine", { languages })}</span>
              </li>
            ) : null}
            {advertiserNote ? (
              <li className="flex items-start gap-2 text-charcoal/60">
                <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-gold/90" aria-hidden />
                <span>{advertiserNote}</span>
              </li>
            ) : null}
          </ul>
        )}
      </div>

      <div className="min-w-0 space-y-4">
        <div>
          <h3 className="font-display text-base font-semibold text-charcoal">{introTitle}</h3>
          <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-charcoal/75">
            {summaryText}
          </p>
        </div>

        {cohosts.length > 0 ? (
          <PublicCohostsBlock
            cohosts={cohosts}
            publicPhones={cohostPhones}
            profileLinkContext={profileLinkContext}
            compact
          />
        ) : null}

        {showCta ? (
          <div className="max-w-md">
            {onContact ? (
              <button type="button" onClick={onContact} className={ctaClass}>
                {ctaLabel}
              </button>
            ) : (
              <Link href="#listing-contact" className={ctaClass}>
                {ctaLabel}
              </Link>
            )}
            <p className="mt-2 text-sm leading-relaxed text-muted">{ctaHelper}</p>
          </div>
        ) : null}

        {showTrustNote ? (
          <ListingTrustNote
            compact
            showTitle
            showPaymentNote
            className="max-w-md"
          />
        ) : null}

        <p className="sr-only">
          {isShortTerm ? tProfile("srContactHost") : tProfile("srContactOwner")}
        </p>
      </div>
    </div>
  );
}

/** next-intl translator for `Profile.public` (or compatible) messages. */
type ProfilePublicT = (key: string, values?: Record<string, string | number>) => string;

export function buildAdvertiserPublicProfileData({
  profile,
  displayName,
  roleLabel,
  avatarUrl,
  phoneVerified,
  activeListings,
  rentalMode = "short_term",
  t,
  locale,
}: {
  profile: {
    bio?: string | null;
    advertiser_type?: Profile["advertiser_type"];
    business_name?: string | null;
    business_title?: string | null;
    communication_languages?: string[] | null;
    created_at?: string | null;
    full_name?: string;
    display_name?: string | null;
  } | null;
  displayName: string;
  roleLabel: string;
  avatarUrl: string | null;
  phoneVerified: boolean;
  activeListings: number;
  rentalMode?: "short_term" | "monthly";
  /** When provided, uses i18n-aware labels via `Profile.public` messages. */
  t?: ProfilePublicT;
  /** Locale for deprecated Greek/English fallbacks when `t` is omitted. */
  locale?: string;
}): AdvertiserPublicProfileData {
  const languages = formatCommunicationLanguages(profile?.communication_languages);

  return {
    displayName,
    roleLabel,
    bio: profile?.bio ?? null,
    avatarUrl,
    profileForAvatar: profile
      ? {
          full_name: profile.full_name ?? "",
          display_name: profile.display_name ?? null,
        }
      : null,
    phoneVerified,
    joinedLabel: t
      ? getProfileJoinedLabel(profile?.created_at, t)
      : profileJoinedLabel(profile?.created_at, locale),
    activeListingsLabel: t
      ? getFormatActiveListingsLabel(activeListings, t)
      : formatActiveListingsLabel(activeListings, locale),
    profession: profile?.business_title?.trim() || null,
    languages: languages || null,
    ownerTypeDetail: profile
      ? t
        ? getAdvertiserOwnerTypeDetail(profile.advertiser_type, profile.business_name, t)
        : advertiserOwnerTypeDetail(profile.advertiser_type, profile.business_name, locale)
      : null,
    advertiserNote: profile
      ? t
        ? getAdvertiserListingNote(profile.advertiser_type, profile.business_name, t)
        : advertiserListingNote(profile.advertiser_type, profile.business_name, locale)
      : null,
    rentalMode,
  };
}
