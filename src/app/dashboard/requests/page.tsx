import { Inbox, Camera, CalendarDays, Tag } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { AccountShell } from "@/components/account/AccountShell";
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";
import { PropertyLeadRow } from "@/components/dashboard/PropertyLeadRow";
import { requireDashboardContext } from "@/lib/dashboard-context";
import { getOwnerLeads } from "@/lib/leads";

export default async function DashboardRequestsPage() {
  const { profile, email } = await requireDashboardContext("/dashboard/requests");
  const leads = await getOwnerLeads(profile.id);
  const activeLeads = leads.filter((l) => l.status !== "archived");
  const t = await getTranslations("Owner.requestsPage");

  const tips = [
    { icon: Camera, text: t("tipPhotos") },
    { icon: CalendarDays, text: t("tipAvailability") },
    { icon: Tag, text: t("tipPrice") },
  ] as const;

  return (
    <AccountShell
      profile={profile}
      email={email}
      active="requests"
      title={t("title")}
      subtitle={t("subtitle")}
    >
      {activeLeads.length === 0 ? (
        <DashboardEmptyState
          icon={Inbox}
          title={t("emptyTitle")}
          text={t("emptyDesc")}
          actionLabel={t("viewMyListings")}
          actionHref="/dashboard/listings"
        >
          <div className="mt-7 w-full max-w-sm rounded-xl border border-border bg-sand/30 p-4 text-left">
            <p className="text-xs font-medium tracking-wide text-muted uppercase">
              {t("tipsTitle")}
            </p>
            <ul className="mt-3 space-y-2.5">
              {tips.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-2.5 text-sm text-charcoal">
                  <Icon className="h-4 w-4 shrink-0 text-gold" />
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </DashboardEmptyState>
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
