import {
  AdvertiserPublicProfileBlock,
  buildAdvertiserPublicProfileData,
} from "@/components/profile/AdvertiserPublicProfileBlock";
import { PublicProfileListingsSection } from "@/components/profile/PublicProfileListingsSection";
import { ListingTrustNote } from "@/components/listings/detail/ListingTrustNote";
import {
  OWNER_PUBLIC_PROFILE_NEUTRAL_BIO,
  formatActiveListingsLabel,
} from "@/lib/profile-display";
import type { PublicProfilePageData } from "@/lib/profile-public-queries";

type Props = {
  data: PublicProfilePageData;
  interestFrom?: string;
  interestTo?: string;
  durationMonths?: number;
  rentalTypeFilter?: string | null;
};

export function PublicProfilePageContent({
  data,
  interestFrom,
  interestTo,
  durationMonths,
  rentalTypeFilter,
}: Props) {
  const blockData = buildAdvertiserPublicProfileData({
    profile: data.profile,
    displayName: data.displayName,
    roleLabel: data.roleLabel,
    avatarUrl: data.avatarUrl,
    phoneVerified: data.phoneVerified,
    activeListings: data.activeListingsCount,
    rentalMode: "short_term",
  });

  const bioText = data.profile.bio?.trim()
    ? data.profile.bio.trim()
    : OWNER_PUBLIC_PROFILE_NEUTRAL_BIO;

  return (
    <div className="py-2">
      <AdvertiserPublicProfileBlock
        {...blockData}
        showCta={false}
        showTrustNote={false}
        detailsTitle={`Πληροφορίες για τον/την ${data.displayName}`}
        bioOverride={bioText}
        activeListingsLabel={formatActiveListingsLabel(data.activeListingsCount)}
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
        <p className="text-sm text-charcoal/75">
          Επικοινώνησε μέσω αγγελίας — επίλεξε ακίνητο για αίτημα διαθεσιμότητας ή μίσθωσης.
        </p>
        <ListingTrustNote showPaymentNote className="mt-4" />
      </div>
    </div>
  );
}
