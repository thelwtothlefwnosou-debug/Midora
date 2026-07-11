import { MessageSquare } from "lucide-react";
import { requireDashboardContext } from "@/lib/dashboard-context";
import { loadListingWorkspace } from "@/lib/listing-workspace-server";

export default async function ListingMessagesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { profile } = await requireDashboardContext("/dashboard/listings");
  const ctx = await loadListingWorkspace(id, profile.id);

  return (
    <div className="rounded-2xl border border-border bg-white p-8 text-center shadow-soft">
      <MessageSquare className="mx-auto h-8 w-8 text-gold/70" />
      <h2 className="mt-4 font-display text-lg font-semibold text-charcoal">Μηνύματα</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted">
        Οι συνομιλίες για «{ctx.listing.title}» θα εμφανίζονται εδώ όταν είναι διαθέσιμο το
        inbox.
      </p>
    </div>
  );
}
