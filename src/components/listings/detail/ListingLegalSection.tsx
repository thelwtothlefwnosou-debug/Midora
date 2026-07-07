import { ListingRegistrySection } from "@/components/listings/short-term/ListingRegistrySection";
import { ListingHouseRulesSection } from "@/components/listings/short-term/ListingHouseRulesSection";
import { ListingPortalNote } from "@/components/listings/ListingPortalNote";
import { hasStructuredHouseRules } from "@/lib/house-rules";
import { formatAmaDisplay } from "@/lib/rental-types";
import type { ListingPublicDetail } from "@/lib/types";

type Props = {
  listing: ListingPublicDetail;
};

export function ListingLegalSection({ listing }: Props) {
  const hasRules = hasStructuredHouseRules(listing);
  const hasRegistry = Boolean(formatAmaDisplay(listing));

  if (!hasRules && !hasRegistry) {
    return (
      <section className="listing-section border-t border-charcoal/8 pt-10">
        <h2 className="listing-section-title text-base">
          Νομικές και πρόσθετες πληροφορίες
        </h2>
        <ListingPortalNote className="mt-4" />
      </section>
    );
  }

  return (
    <section
      id="legal"
      className="listing-section scroll-mt-32 border-t border-charcoal/8 pt-10"
    >
      <h2 className="listing-section-title">Νομικές και πρόσθετες πληροφορίες</h2>
      <div className="mt-6 space-y-8">
        {hasRules && <ListingHouseRulesSection listing={listing} embedded />}
        {hasRegistry && <ListingRegistrySection listing={listing} embedded />}
        <ListingPortalNote />
      </div>
    </section>
  );
}
