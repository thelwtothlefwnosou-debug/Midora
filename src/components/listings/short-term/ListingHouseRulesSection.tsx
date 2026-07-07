"use client";

import type { ListingPublicDetail } from "@/lib/types";
import { hasStructuredHouseRules, houseRulesItems } from "@/lib/house-rules";
import { cn } from "@/lib/utils";

export function ListingHouseRulesSection({
  listing,
  embedded = false,
}: {
  listing: ListingPublicDetail;
  embedded?: boolean;
}) {
  if (!hasStructuredHouseRules(listing)) return null;

  const items = houseRulesItems(listing);

  const body = (
    <>
      {!embedded && (
        <p className="listing-meta mt-3">
          Οι όροι δηλώνονται από τον αγγελιοδότη και επιβεβαιώνονται πριν από οποιαδήποτε
          συμφωνία.
        </p>
      )}
      <dl className={cn("listing-card space-y-3 p-5", embedded ? "mt-3" : "mt-5")}>
        {items.map((item) => (
          <div key={item.label} className="flex flex-col gap-0.5 sm:flex-row sm:justify-between">
            <dt className="text-sm text-muted">{item.label}</dt>
            <dd className="text-sm font-medium text-charcoal">{item.value}</dd>
          </div>
        ))}
      </dl>
    </>
  );

  if (embedded) {
    return (
      <div>
        <h3 className="text-sm font-semibold text-charcoal">Όροι διαμονής</h3>
        {body}
      </div>
    );
  }

  return (
    <section id="rules" className="listing-section scroll-mt-28">
      <h2 className="listing-section-title">Όροι διαμονής</h2>
      {body}
    </section>
  );
}
