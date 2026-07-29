"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { GlassCard } from "@/components/ui/GlassCard";
import { ListingForm } from "@/components/listings/ListingForm";
import { ListingBedroomsEditor } from "@/components/dashboard/ListingBedroomsEditor";
import { ListingAmenitiesEditor } from "@/components/dashboard/ListingAmenitiesEditor";
import { ListingLocationEditor } from "@/components/dashboard/ListingLocationEditor";
import { ListingExternalLinksEditor } from "@/components/dashboard/ListingExternalLinksEditor";
import { DeleteListingButton } from "@/components/dashboard/DeleteListingButton";
import { ListingCompletenessCard } from "@/components/dashboard/ListingCompletenessCard";
import { WorkspaceSectionCard } from "@/components/dashboard/listing-workspace/WorkspaceSectionCard";
import { listingRentalType } from "@/lib/rental-types";
import type { ListingUnavailablePeriod } from "@/lib/unavailable-periods";
import { updateListing } from "@/lib/actions";
import type {
  ListingAmenityRow,
  ListingPriceRule,
  ListingSleepingArrangement,
  ListingWithImages,
  Profile,
} from "@/lib/types";
import type { ListingExternalLink } from "@/lib/listing-external-links";

type Props = {
  listing: ListingWithImages;
  profile: Profile;
  email: string;
  unavailablePeriods: ListingUnavailablePeriod[];
  priceRules: ListingPriceRule[];
  sleepingArrangements: ListingSleepingArrangement[];
  externalLinks: ListingExternalLink[];
  amenities: ListingAmenityRow[];
};

function SectionIntro({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mb-3">
      <h3 className="font-display text-sm font-semibold text-charcoal sm:text-[15px]">
        {title}
      </h3>
      <p className="mt-1 text-sm text-muted">{description}</p>
    </div>
  );
}

export function EditListingForm({
  listing,
  sleepingArrangements,
  externalLinks,
  amenities,
}: Props) {
  const t = useTranslations("Workspace.editForm");
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string; saved?: boolean } | null, formData: FormData) => {
      const result = await updateListing(listing.id, formData);
      if (result && "error" in result && result.error) {
        return { error: result.error };
      }
      return { saved: true };
    },
    null
  );

  const rentalType = listingRentalType(listing);
  const isShortTerm = rentalType === "short_term";
  const photoCount = listing.listing_images?.length ?? 0;
  const pricingHref = isShortTerm
    ? `/dashboard/listings/${listing.id}/availability`
    : `/dashboard/listings/${listing.id}/pricing`;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-lg font-semibold text-charcoal">{t("title")}</h2>
        <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>
      </div>

      {state?.saved && (
        <p className="rounded-xl border border-teal/30 bg-teal/10 px-4 py-3 text-sm text-teal">
          {t("saved")}
        </p>
      )}
      {state?.error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </p>
      )}

      {isShortTerm && (
        <ListingCompletenessCard
          listing={listing}
          photoCount={photoCount}
          amenityCount={amenities.length}
          hideEditLink
        />
      )}

      <section>
        <SectionIntro title={t("sectionBasics")} description={t("sectionBasicsBody")} />
        <GlassCard className="p-6 sm:p-8">
          <ListingForm
            listing={listing}
            action={formAction}
            pending={pending}
            error={state?.error}
            submitLabel={pending ? t("saving") : t("saveChanges")}
          />
        </GlassCard>
      </section>

      <section>
        <SectionIntro
          title={t("sectionLocation")}
          description={t("sectionLocationBody")}
        />
        <ListingLocationEditor listing={listing} />
      </section>

      {isShortTerm && (
        <section>
          <SectionIntro
            title={t("sectionSleeping")}
            description={t("sectionSleepingBody")}
          />
          <ListingBedroomsEditor
            listing={listing}
            initialArrangements={sleepingArrangements}
          />
        </section>
      )}

      <section>
        <SectionIntro
          title={t("sectionAmenities")}
          description={t("sectionAmenitiesBody")}
        />
        <ListingAmenitiesEditor listing={listing} initialAmenities={amenities} />
      </section>

      <section>
        <SectionIntro title={t("sectionLinks")} description={t("sectionLinksBody")} />
        <ListingExternalLinksEditor
          listingId={listing.id}
          initialLinks={externalLinks}
          className="mt-0"
        />
      </section>

      <div className="flex flex-wrap gap-4 text-sm text-muted">
        <Link
          href={`/dashboard/listings/${listing.id}/photos`}
          className="font-medium text-gold-dark hover:underline"
        >
          {t("managePhotos")}
        </Link>
        <Link
          href={`/dashboard/listings/${listing.id}/availability`}
          className="font-medium text-gold-dark hover:underline"
        >
          {t("availability")}
        </Link>
        <Link
          href={pricingHref}
          className="font-medium text-gold-dark hover:underline"
        >
          {t("pricing")}
        </Link>
      </div>

      <WorkspaceSectionCard
        title={t("dangerTitle")}
        description={t("dangerBody")}
        tone="muted"
      >
        <DeleteListingButton listingId={listing.id} />
      </WorkspaceSectionCard>
    </div>
  );
}
