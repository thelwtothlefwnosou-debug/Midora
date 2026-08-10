import { Inbox, Camera, CalendarDays, Tag } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { AccountShell } from "@/components/account/AccountShell";
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";
import { PropertyLeadRow } from "@/components/dashboard/PropertyLeadRow";
import { requireDashboardContext } from "@/lib/dashboard-context";
import { getOwnerLeads } from "@/lib/leads";
import { getUserListings } from "@/lib/listings";
import { OWNER_LISTING_NEW_PATH } from "@/lib/owner-flow";

export default async function DashboardRequestsPage() {
  const { profile, email } = await requireDashboardContext("/dashboard/requests");
  const [leads, listings] = await Promise.all([
    getOwnerLeads(profile.id),
    getUserListings(profile.id),
  ]);
  const activeLeads = leads.filter((l) => l.status !== "archived");
  const hasListings = listings.length > 0;
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
          title={
            hasListings ? t("emptyWithListingsTitle") : t("emptyNoListingsTitle")
          }
          text={
            hasListings ? t("emptyWithListingsBody") : t("emptyNoListingsBody")
          }
          actionLabel={
            hasListings ? t("emptyWithListingsCta") : t("emptyNoListingsCta")
          }
          actionHref={hasListings ? "/dashboard/listings" : OWNER_LISTING_NEW_PATH}
        >
          {hasListings ? (
            <div className="mt-7 w-full max-w-sm rounded-xl border border-border bg-sand/30 p-4 text-left">
              <p className="text-[11px] font-medium tracking-wide text-muted uppercase">
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
          ) : null}
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
