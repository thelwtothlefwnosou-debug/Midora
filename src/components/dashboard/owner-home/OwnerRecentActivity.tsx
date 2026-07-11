import Link from "next/link";
import { PropertyLeadRow } from "@/components/dashboard/PropertyLeadRow";
import type { PropertyLeadWithListing } from "@/lib/types";

type Props = {
  recentLeads: PropertyLeadWithListing[];
  hasPublished: boolean;
};

export function OwnerRecentActivity({ recentLeads, hasPublished }: Props) {
  return (
    <section className="rounded-2xl border border-border bg-white p-4 shadow-soft sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-display text-base font-semibold text-charcoal">
          {recentLeads.length > 0 ? "Τελευταία αιτήματα" : "Πρόσφατη δραστηριότητα"}
        </h2>
        {recentLeads.length > 0 && (
          <Link href="/dashboard/requests" className="text-xs font-medium text-gold hover:underline">
            Όλα →
          </Link>
        )}
      </div>

      {recentLeads.length > 0 ? (
        <div className="space-y-2">
          {recentLeads.slice(0, 2).map((lead) => (
            <PropertyLeadRow key={lead.id} lead={lead} />
          ))}
        </div>
      ) : (
        <p className="text-sm leading-relaxed text-muted">
          {hasPublished
            ? "Δεν υπάρχουν ακόμη αιτήματα ενδιαφέροντος. Θα εμφανίζονται εδώ όταν κάποιος επικοινωνήσει."
            : "Δεν υπάρχουν ακόμη αιτήματα ενδιαφέροντος. Μόλις η αγγελία σου δημοσιευτεί, θα εμφανίζονται εδώ."}
        </p>
      )}
    </section>
  );
}
