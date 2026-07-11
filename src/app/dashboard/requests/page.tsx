import { Inbox, Camera, CalendarDays, Tag } from "lucide-react";
import { AccountShell } from "@/components/account/AccountShell";
import { PropertyLeadRow } from "@/components/dashboard/PropertyLeadRow";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { requireDashboardContext } from "@/lib/dashboard-context";
import { getOwnerLeads } from "@/lib/leads";

const TIPS = [
  { icon: Camera, text: "Πρόσθεσε 5+ καθαρές φωτογραφίες" },
  { icon: CalendarDays, text: "Συμπλήρωσε τη διαθεσιμότητα" },
  { icon: Tag, text: "Κράτα την τιμή ενημερωμένη" },
] as const;

export default async function DashboardRequestsPage() {
  const { profile, email } = await requireDashboardContext("/dashboard/requests");
  const leads = await getOwnerLeads(profile.id);
  const activeLeads = leads.filter((l) => l.status !== "archived");

  return (
    <AccountShell
      profile={profile}
      email={email}
      active="requests"
      title="Αιτήματα"
      subtitle="Ενδιαφέροντα από επισκέπτες για τις αγγελίες σου."
    >
      {activeLeads.length === 0 ? (
        <GlassCard className="overflow-hidden">
          <div className="flex flex-col items-center px-6 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sand">
              <Inbox className="h-7 w-7 text-gold" strokeWidth={1.5} />
            </div>
            <h2 className="mt-5 font-display text-xl font-semibold text-charcoal">
              Δεν έχεις ακόμα ενδιαφέροντα
            </h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
              Όταν κάποιος επικοινωνήσει για αγγελία σου, θα εμφανιστεί εδώ με τα στοιχεία
              επικοινωνίας του.
            </p>

            <div className="mt-8 w-full max-w-sm rounded-xl border border-border bg-sand/30 p-4 text-left">
              <p className="text-xs font-medium tracking-wide text-muted uppercase">
                Συμβουλές για περισσότερα ενδιαφέροντα
              </p>
              <ul className="mt-3 space-y-2.5">
                {TIPS.map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-center gap-2.5 text-sm text-charcoal">
                    <Icon className="h-4 w-4 shrink-0 text-gold" />
                    {text}
                  </li>
                ))}
              </ul>
            </div>

            <Button href="/dashboard/listings" className="mt-6">
              Δες τις αγγελίες μου
            </Button>
          </div>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {activeLeads.map((lead) => (
            <PropertyLeadRow key={lead.id} lead={lead} />
          ))}
        </div>
      )}
    </AccountShell>
  );
}
