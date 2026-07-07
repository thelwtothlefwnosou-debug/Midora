import { MessageSquare, Inbox } from "lucide-react";
import Link from "next/link";
import { AccountShell } from "@/components/account/AccountShell";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { requireDashboardContext } from "@/lib/dashboard-context";

export default async function DashboardMessagesPage() {
  const { profile, email } = await requireDashboardContext("/dashboard/messages");

  // TODO: load conversations when messaging is available
  const messages: never[] = [];

  return (
    <AccountShell
      profile={profile}
      email={email}
      active="messages"
      title="Μηνύματα"
      subtitle="Συνομιλίες με ενδιαφερόμενους μετά το αρχικό ενδιαφέρον"
    >
      <GlassCard className="mb-6 border-gold/20 bg-sand/30 p-4 sm:p-5">
        <div className="flex gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white">
            <MessageSquare className="h-4 w-4 text-gold" />
          </div>
          <div className="text-sm">
            <p className="font-medium text-charcoal">Διαφορά από τα Ενδιαφέροντα</p>
            <p className="mt-1 leading-relaxed text-muted">
              Τα <span className="font-medium text-charcoal">Ενδιαφέροντα</span> είναι τα
              πρώτα αιτήματα επικοινωνίας από επισκέπτες. Τα{" "}
              <span className="font-medium text-charcoal">Μηνύματα</span> είναι οι συνεχείς
              συνομιλίες που ακολουθούν — όταν ξεκινήσεις επικοινωνία με κάποιον ενδιαφερόμενο.
            </p>
            <Link
              href="/dashboard/requests"
              className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-gold hover:underline"
            >
              <Inbox className="h-3.5 w-3.5" />
              Δες τα ενδιαφέροντα
            </Link>
          </div>
        </div>
      </GlassCard>

      {messages.length === 0 ? (
        <GlassCard className="flex flex-col items-center px-6 py-14 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sand">
            <MessageSquare className="h-7 w-7 text-gold" strokeWidth={1.5} />
          </div>
          <h2 className="mt-5 font-display text-xl font-semibold text-charcoal">
            Δεν έχεις ακόμα μηνύματα
          </h2>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
            Οι συνομιλίες θα εμφανίζονται εδώ όταν απαντήσεις σε ενδιαφέρον ή ξεκινήσεις
            επικοινωνία με επισκέπτη. Προς το παρόν, διαχειρίσου τα αιτήματα από τα
            Ενδιαφέροντα.
          </p>
          <Button href="/dashboard/requests" className="mt-6" variant="outline">
            Πήγαινε στα Ενδιαφέροντα
          </Button>
        </GlassCard>
      ) : null}
    </AccountShell>
  );
}
