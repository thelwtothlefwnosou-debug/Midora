import Link from "next/link";
import { AccountShell } from "@/components/account/AccountShell";
import { DashboardActionCard } from "@/components/dashboard/DashboardActionCard";
import { PropertyLeadRow } from "@/components/dashboard/PropertyLeadRow";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Plus } from "lucide-react";
import { requireDashboardContext } from "@/lib/dashboard-context";
import { getUserListings } from "@/lib/listings";
import { getEffectiveListingStatus } from "@/lib/listing-status";
import { countListingsByOwnerStatus } from "@/lib/dashboard-listings";
import { countNewOwnerLeads, getOwnerLeads } from "@/lib/leads";
import { attachStoredViewCounts } from "@/lib/listing-views-storage";
import { getDisplayViewCount } from "@/lib/listing-views";
import { buildOwnerActionItems } from "@/lib/owner-dashboard";
import { OWNER_LISTING_NEW_PATH } from "@/lib/owner-flow";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string; updated?: string }>;
}) {
  const params = await searchParams;
  const { profile, email } = await requireDashboardContext("/dashboard");

  const listings = await attachStoredViewCounts(await getUserListings(profile.id));
  const counts = countListingsByOwnerStatus(listings, getEffectiveListingStatus);
  const newLeads = await countNewOwnerLeads(profile.id);
  const leads = await getOwnerLeads(profile.id);
  const recentLeads = leads.filter((l) => l.status !== "archived").slice(0, 3);
  const totalViews = listings
    .filter((l) => getEffectiveListingStatus(l) === "approved")
    .reduce((sum, l) => sum + getDisplayViewCount(l), 0);

  const firstName = profile.full_name?.split(" ")[0] ?? "φίλε";
  const actions = buildOwnerActionItems({
    profile,
    listings,
    newLeadsCount: newLeads,
    getEffectiveStatus: getEffectiveListingStatus,
  }).slice(0, 6);

  const metrics = [
    { label: "Ενεργές αγγελίες", value: counts.active, href: "/dashboard/listings" },
    { label: "Σε έλεγχο", value: counts.review, href: "/dashboard/listings" },
    { label: "Νέα ενδιαφέροντα", value: newLeads, href: "/dashboard/requests" },
    { label: "Συνολικές προβολές", value: totalViews, href: "/dashboard/listings" },
  ];

  return (
    <AccountShell
      profile={profile}
      email={email}
      active="overview"
      title={`Καλημέρα, ${firstName}`}
      subtitle="Διαχειρίσου τις αγγελίες, τα ενδιαφέροντα και την επαλήθευσή σου."
    >
      {params.submitted && (
        <GlassCard className="mb-6 border-teal/30 bg-teal/10 p-4">
          <p className="text-sm text-teal">
            Η αγγελία υποβλήθηκε για έλεγχο. Θα ενημερωθείς όταν ολοκληρωθεί η διαδικασία.
          </p>
        </GlassCard>
      )}

      {params.updated && (
        <GlassCard className="mb-6 border-teal/30 bg-teal/10 p-4">
          <p className="text-sm text-teal">Οι αλλαγές αποθηκεύτηκαν.</p>
        </GlassCard>
      )}

      {actions.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-4 font-display text-lg font-semibold text-charcoal">
            Τι χρειάζεται την προσοχή σου
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {actions.map((item) => (
              <DashboardActionCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}

      <section className="mb-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((m) => (
          <Link
            key={m.label}
            href={m.href}
            className="rounded-2xl border border-border bg-white p-5 shadow-soft transition-shadow hover:shadow-card"
          >
            <p className="font-display text-2xl font-bold tabular-nums text-charcoal">{m.value}</p>
            <p className="mt-1 text-sm text-muted">{m.label}</p>
          </Link>
        ))}
      </section>

      {recentLeads.length > 0 && (
        <section className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-charcoal">
              Πρόσφατα ενδιαφέροντα
            </h2>
            <Link href="/dashboard/requests" className="text-sm text-gold hover:underline">
              Όλα →
            </Link>
          </div>
          <div className="space-y-3">
            {recentLeads.map((lead) => (
              <PropertyLeadRow key={lead.id} lead={lead} />
            ))}
          </div>
        </section>
      )}

      {counts.total === 0 ? (
        <GlassCard className="p-8 text-center">
          <p className="font-display text-lg font-semibold text-charcoal">
            Δεν έχεις ανεβάσει ακόμα αγγελία
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Δημοσίευσε την πρώτη σου αγγελία — βραχυχρόνια ή μηνιαία/μεσοπρόθεσμη διαμονή.
          </p>
          <Button href={OWNER_LISTING_NEW_PATH} className="mt-5">
            <Plus className="h-4 w-4" />
            Νέα αγγελία
          </Button>
        </GlassCard>
      ) : (
        <section className="rounded-2xl border border-border bg-white p-5 shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-semibold text-charcoal">Οι αγγελίες σου</h2>
              <p className="mt-1 text-sm text-muted">
                {counts.total} {counts.total === 1 ? "αγγελία" : "αγγελίες"} · {counts.active}{" "}
                ενεργές
              </p>
            </div>
            <Link
              href="/dashboard/listings"
              className="rounded-xl bg-charcoal px-4 py-2 text-sm font-semibold text-white hover:bg-charcoal/90"
            >
              Διαχείριση αγγελιών
            </Link>
          </div>
        </section>
      )}
    </AccountShell>
  );
}
