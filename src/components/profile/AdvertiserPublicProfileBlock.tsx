import type { ReactNode } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  Briefcase,
  Building2,
  Languages,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { ListingTrustNote } from "@/components/listings/detail/ListingTrustNote";
import {
  OWNER_PUBLIC_DEFAULT_BIO,
  advertiserListingNote,
  advertiserOwnerTypeDetail,
  formatActiveListingsLabel,
  formatCommunicationLanguages,
  profileJoinedLabel,
} from "@/lib/profile-display";
import type { Profile } from "@/lib/types";
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
        "group block rounded-2xl transition-colors hover:bg-sand/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40",
        className
      )}
    >
      {children}
    </Link>
  );
}

type DetailRow = {
  icon: LucideIcon;
  label: string;
};

function OwnerDetailRow({ icon: Icon, label }: DetailRow) {
  return (
    <li className="flex items-start gap-3 text-sm text-charcoal/80">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-gold/90" strokeWidth={1.75} aria-hidden />
      <span>{label}</span>
    </li>
  );
}

function buildDetailRows(data: AdvertiserPublicProfileData): DetailRow[] {
  const rows: DetailRow[] = [];

  if (data.profession) {
    rows.push({
      icon: Briefcase,
      label: `Η δουλειά μου: ${data.profession}`,
    });
  }
  if (data.languages) {
    rows.push({
      icon: Languages,
      label: `Γλώσσες: ${data.languages}`,
    });
  }
  if (data.ownerTypeDetail) {
    rows.push({
      icon: Building2,
      label: data.ownerTypeDetail,
    });
  }

  return rows;
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
  profession,
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
}: Props) {
  const detailRows = buildDetailRows({
    displayName,
    roleLabel,
    bio,
    avatarUrl,
    profileForAvatar,
    phoneVerified,
    joinedLabel,
    activeListingsLabel,
    profession,
    languages,
    ownerTypeDetail,
    advertiserNote,
    rentalMode,
  });

  const bioText =
    bioOverride?.trim() ||
    (bio?.trim() ? bio.trim() : OWNER_PUBLIC_DEFAULT_BIO);
  const ctaLabel =
    rentalMode === "short_term"
      ? "Στείλε αίτημα διαθεσιμότητας"
      : "Στείλε αίτημα μίσθωσης";

  const ctaClass =
    "inline-flex min-h-11 w-full max-w-[380px] items-center justify-center rounded-xl bg-gold px-5 text-sm font-semibold text-white transition-colors hover:bg-gold-dark";

  return (
    <div
      className={cn(
        "grid gap-8 lg:grid-cols-[minmax(0,480px)_minmax(0,1fr)] lg:items-start lg:gap-12",
        className
      )}
    >
      <div className="min-w-0">
        <ProfileIdentityLink
          href={profileHref}
          className="mx-auto w-full max-w-[440px] px-2 py-1"
        >
          <div className="rounded-[24px] border border-charcoal/8 bg-white px-8 py-8 text-center shadow-[0_10px_36px_-14px_rgba(26,26,26,0.18)] sm:px-10 sm:py-9">
            <ProfileAvatar
              profile={profileForAvatar ?? undefined}
              imageUrl={avatarUrl}
              size="lg"
              className="mx-auto h-24 w-24 text-xl"
            />

            {phoneVerified ? (
              <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-teal/10 px-3 py-1 text-xs font-medium text-teal">
                <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
                Επαληθευμένο τηλέφωνο
              </p>
            ) : null}

            <p
              className={cn(
                "mt-4 text-xl font-semibold tracking-tight text-charcoal",
                profileHref && "group-hover:underline"
              )}
            >
              {displayName}
            </p>
            <p className="mt-1 text-sm text-muted">{roleLabel}</p>

            {joinedLabel ? (
              <p className="mt-2 text-sm text-charcoal/65">{joinedLabel}</p>
            ) : null}
            {activeListingsLabel ? (
              <p className="mt-1 text-sm text-charcoal/65">{activeListingsLabel}</p>
            ) : null}
          </div>
        </ProfileIdentityLink>

        {detailRows.length > 0 ? (
          <ul className="mx-auto mt-5 max-w-[440px] space-y-3">
            {detailRows.map((row) => (
              <OwnerDetailRow key={row.label} icon={row.icon} label={row.label} />
            ))}
          </ul>
        ) : null}
      </div>

      <div className="min-w-0 lg:pt-1">
        <h3 className="font-display text-base font-semibold text-charcoal">
          {detailsTitle ?? "Στοιχεία ιδιοκτήτη"}
        </h3>

        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-charcoal/80">{bioText}</p>

        {showCta ? (
          onContact ? (
            <button type="button" onClick={onContact} className={cn(ctaClass, "mt-6")}>
              {ctaLabel}
            </button>
          ) : (
            <Link href="#listing-contact" className={cn(ctaClass, "mt-6")}>
              {ctaLabel}
            </Link>
          )
        ) : null}

        {showTrustNote ? (
          <>
            <div className="my-6 h-px max-w-xl bg-charcoal/8" />
            <ListingTrustNote showPaymentNote className="max-w-xl" />
          </>
        ) : null}

        {advertiserNote ? (
          <>
            <div className="my-5 h-px max-w-xl bg-charcoal/8" />
            <p className="max-w-xl text-sm text-charcoal/65">{advertiserNote}</p>
          </>
        ) : null}
      </div>
    </div>
  );
}

export function buildAdvertiserPublicProfileData({
  profile,
  displayName,
  roleLabel,
  avatarUrl,
  phoneVerified,
  activeListings,
  rentalMode = "short_term",
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
    joinedLabel: profileJoinedLabel(profile?.created_at),
    activeListingsLabel: formatActiveListingsLabel(activeListings),
    profession: profile?.business_title?.trim() || null,
    languages: languages || null,
    ownerTypeDetail: profile
      ? advertiserOwnerTypeDetail(profile.advertiser_type, profile.business_name)
      : null,
    advertiserNote: profile
      ? advertiserListingNote(profile.advertiser_type, profile.business_name)
      : null,
    rentalMode,
  };
}
