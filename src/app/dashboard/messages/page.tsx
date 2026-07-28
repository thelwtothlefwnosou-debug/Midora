import { MessageSquare, Inbox } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AccountShell } from "@/components/account/AccountShell";
import { PropertyLeadRow } from "@/components/dashboard/PropertyLeadRow";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { requireDashboardContext } from "@/lib/dashboard-context";
import { getOwnerLeads } from "@/lib/leads";

export default async function DashboardMessagesPage() {
  const { profile, email } = await requireDashboardContext("/dashboard/messages");
  const leads = await getOwnerLeads(profile.id);
  const activeLeads = leads.filter((l) => l.status !== "archived");
  const t = await getTranslations("Owner.messages");
  const tLegal = await getTranslations("Legal.shared");

  return (
    <AccountShell
      profile={profile}
      email={email}
      active="messages"
      title={t("title")}
      subtitle={t("subtitle")}
    >
      <GlassCard className="mb-6 border-gold/20 bg-sand/30 p-4 sm:p-5">
        <div className="flex gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white">
            <MessageSquare className="h-4 w-4 text-gold" />
          </div>
          <div className="text-sm">
            <p className="font-medium text-charcoal">{t("viaMidora")}</p>
            <p className="mt-1 leading-relaxed text-muted">
              {tLegal("threadSafety")}
            </p>
            <Link
              href="/dashboard/requests"
              className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-gold hover:underline"
            >
              <Inbox className="h-3.5 w-3.5" />
              {t("viewInRequests")}
            </Link>
          </div>
        </div>
      </GlassCard>

      {activeLeads.length === 0 ? (
        <GlassCard className="flex flex-col items-center px-6 py-14 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sand">
            <MessageSquare className="h-7 w-7 text-gold" strokeWidth={1.5} />
          </div>
          <h2 className="mt-5 font-display text-xl font-semibold text-charcoal">
            {t("emptyTitle")}
          </h2>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
            {t("emptyBody")}
          </p>
          <Button href="/dashboard/listings" className="mt-6" variant="outline">
            {t("viewListings")}
          </Button>
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
