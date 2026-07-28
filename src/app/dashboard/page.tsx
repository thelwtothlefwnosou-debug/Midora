import { getTranslations } from "next-intl/server";
import { GlassCard } from "@/components/ui/GlassCard";
import { AccountShell } from "@/components/account/AccountShell";
import { OwnerHomeOverview } from "@/components/dashboard/OwnerHomeOverview";
import { requireDashboardContext } from "@/lib/dashboard-context";
import { getUserListings } from "@/lib/listings";
import { getEffectiveListingStatus } from "@/lib/listing-status";
import { countNewOwnerLeads, getOwnerLeadStatsByListingIds, getOwnerLeads } from "@/lib/leads";
import { attachStoredViewCounts } from "@/lib/listing-views-storage";
import {
  buildOwnerListingRowModel,
  buildOwnerListingsOverview,
} from "@/lib/owner-listings-page";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string; updated?: string }>;
}) {
  const params = await searchParams;
  const { profile, email } = await requireDashboardContext("/dashboard");
  const t = await getTranslations("Owner.homePage");

  let rows: ReturnType<typeof buildOwnerListingRowModel>[] = [];
  let overview = buildOwnerListingsOverview([], 0);
  let recentLeads: Awaited<ReturnType<typeof getOwnerLeads>> = [];

  try {
    const listings = await attachStoredViewCounts(await getUserListings(profile.id));
    const listingIds = listings.map((l) => l.id);
    const [leadStatsMap, newInquiries] = await Promise.all([
      getOwnerLeadStatsByListingIds(profile.id, listingIds),
      countNewOwnerLeads(profile.id),
    ]);
    rows = listings.map((listing) =>
      buildOwnerListingRowModel(
        listing,
        getEffectiveListingStatus(listing),
        leadStatsMap.get(listing.id) ?? { total: 0, last30Days: 0, unread: 0 }
      )
    );
    overview = buildOwnerListingsOverview(rows, newInquiries);
    const leads = await getOwnerLeads(profile.id);
    recentLeads = leads.filter((l) => l.status !== "archived").slice(0, 3);
  } catch (err) {
    console.error("[dashboard] owner home data failed:", err);
  }

  const firstName = profile.full_name?.split(" ")[0] ?? t("defaultName");

  return (
    <AccountShell
      profile={profile}
      email={email}
      active="overview"
      title={t("greeting", { name: firstName })}
      subtitle={t("subtitle")}
    >
      {params.submitted && (
        <GlassCard className="mb-6 border-teal/30 bg-teal/10 p-4">
          <p className="text-sm text-teal">
            {t("submittedBanner")}
          </p>
        </GlassCard>
      )}

      {params.updated && (
        <GlassCard className="mb-6 border-teal/30 bg-teal/10 p-4">
          <p className="text-sm text-teal">{t("changesSaved")}</p>
        </GlassCard>
      )}

      <OwnerHomeOverview
        profile={profile}
        email={email}
        rows={rows}
        overview={overview}
        recentLeads={recentLeads}
      />
    </AccountShell>
  );
}
