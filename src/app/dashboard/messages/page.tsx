import { MessageSquare, Inbox } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AccountShell } from "@/components/account/AccountShell";
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";
import { PropertyLeadRow } from "@/components/dashboard/PropertyLeadRow";
import { GlassCard } from "@/components/ui/GlassCard";
import { requireDashboardContext } from "@/lib/dashboard-context";
import { getOwnerLeads } from "@/lib/leads";
import { getUserListings } from "@/lib/listings";
import { OWNER_LISTING_NEW_PATH } from "@/lib/owner-flow";

export default async function DashboardMessagesPage() {
  const { profile, email } = await requireDashboardContext("/dashboard/messages");
  const [leads, listings] = await Promise.all([
    getOwnerLeads(profile.id),
    getUserListings(profile.id),
  ]);
  const activeLeads = leads.filter((l) => l.status !== "archived");
  const hasListings = listings.length > 0;
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
      <GlassCard hover={false} className="mb-6 border-gold/20 bg-sand/30 p-4 sm:p-5">
        <div className="flex gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white">
            <MessageSquare className="h-4 w-4 text-gold" />
          </div>
          <div className="text-sm">
            <p className="font-medium text-charcoal">{t("viaMidora")}</p>
            <p className="mt-1 leading-relaxed text-muted">{tLegal("threadSafety")}</p>
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
        <DashboardEmptyState
          icon={MessageSquare}
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
        />
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
