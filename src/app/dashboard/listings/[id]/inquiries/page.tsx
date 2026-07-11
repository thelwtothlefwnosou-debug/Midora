import { PropertyLeadRow } from "@/components/dashboard/PropertyLeadRow";
import { requireDashboardContext } from "@/lib/dashboard-context";
import { getOwnerLeads } from "@/lib/leads";
import { loadListingWorkspace } from "@/lib/listing-workspace-server";

export default async function ListingInquiriesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { profile } = await requireDashboardContext("/dashboard/listings");
  const ctx = await loadListingWorkspace(id, profile.id);
  const allLeads = await getOwnerLeads(profile.id);
  const leads = allLeads.filter((l) => l.listing_id === id && l.status !== "archived");

  return (
    <div>
      <h2 className="mb-1 font-display text-lg font-semibold text-charcoal">Αιτήματα</h2>
      <p className="mb-5 text-sm text-muted">
        Ενδιαφέροντα για «{ctx.listing.title}».
      </p>
      {leads.length === 0 ? (
        <p className="rounded-xl border border-border bg-white px-5 py-8 text-center text-sm text-muted shadow-soft">
          Δεν υπάρχουν αιτήματα για αυτό το ακίνητο ακόμα.
        </p>
      ) : (
        <div className="space-y-3">
          {leads.map((lead) => (
            <PropertyLeadRow key={lead.id} lead={lead} />
          ))}
        </div>
      )}
    </div>
  );
}
