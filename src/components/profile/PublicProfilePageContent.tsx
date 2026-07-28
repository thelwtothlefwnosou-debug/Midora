import { getTranslations } from "next-intl/server";
import {
  AdvertiserPublicProfileBlock,
  buildAdvertiserPublicProfileData,
} from "@/components/profile/AdvertiserPublicProfileBlock";
import { PublicProfileListingsSection } from "@/components/profile/PublicProfileListingsSection";
import { ListingTrustNote } from "@/components/listings/detail/ListingTrustNote";
import type { PublicProfilePageData } from "@/lib/profile-public-queries";

type Props = {
  data: PublicProfilePageData;
  interestFrom?: string;
  interestTo?: string;
  durationMonths?: number;
  rentalTypeFilter?: string | null;
};

export async function PublicProfilePageContent({
  data,
  interestFrom,
  interestTo,
  durationMonths,
  rentalTypeFilter,
}: Props) {
  const t = await getTranslations("Profile.public");

  const blockData = buildAdvertiserPublicProfileData({
    profile: data.profile,
    displayName: data.displayName,
    roleLabel: data.roleLabel,
    avatarUrl: data.avatarUrl,
    phoneVerified: data.phoneVerified,
    activeListings: data.activeListingsCount,
    rentalMode: "short_term",
    t,
  });

  const bioText = data.profile.bio?.trim()
    ? data.profile.bio.trim()
    : t("neutralBio");

  return (
    <div className="py-2">
      <AdvertiserPublicProfileBlock
        {...blockData}
        showCta={false}
        showTrustNote={false}
        detailsTitle={t("detailsTitle", { name: data.displayName })}
        bioOverride={bioText}
        activeListingsLabel={
          data.activeListingsCount > 0
            ? t("activeListings", { count: data.activeListingsCount })
            : null
        }
      />

      <PublicProfileListingsSection
        displayName={data.displayName}
        ownedListings={data.ownedListings}
        cohostedListings={data.cohostedListings}
        interestFrom={interestFrom}
        interestTo={interestTo}
        durationMonths={durationMonths}
        rentalTypeFilter={rentalTypeFilter}
      />

      <div className="mt-10 max-w-2xl">
        <p className="text-sm text-charcoal/75">{t("contactViaListing")}</p>
        <ListingTrustNote showPaymentNote className="mt-4" />
      </div>
    </div>
  );
}
