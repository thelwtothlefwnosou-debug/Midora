import { Inbox } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";
import { PropertyLeadRow } from "@/components/dashboard/PropertyLeadRow";
import { requireDashboardContext } from "@/lib/dashboard-context";
import { getAccessibleLeads } from "@/lib/leads";
import { getLeadRepliesForLeads } from "@/lib/listing-contact-numbers-db";
import { loadListingWorkspace } from "@/lib/listing-workspace-server";
import type { PropertyLeadReply } from "@/lib/types";

export default async function ListingInquiriesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { profile } = await requireDashboardContext("/dashboard/listings");
  const ctx = await loadListingWorkspace(id, profile.id);
  const t = await getTranslations("Owner.inquiriesTab");
  const allLeads = await getAccessibleLeads(profile.id);
  const leads = allLeads.filter((l) => l.listing_id === id && l.status !== "archived");
  const repliesMap = await getLeadRepliesForLeads(leads.map((l) => l.id));

  return (
    <div>
      <h2 className="mb-1 font-display text-base font-semibold text-charcoal">{t("title")}</h2>
      <p className="mb-4 text-sm text-muted">{t("subtitle", { title: ctx.listing.title })}</p>
      {leads.length === 0 ? (
        <DashboardEmptyState
          compact
          icon={Inbox}
          title={t("emptyTitle")}
          text={t("emptyText")}
        />
      ) : (
        <div className="space-y-2">
          {leads.map((lead) => (
            <PropertyLeadRow
              key={lead.id}
              lead={lead}
              replies={(repliesMap.get(lead.id) ?? []) as PropertyLeadReply[]}
            />
          ))}
        </div>
      )}
    </div>
  );
}
