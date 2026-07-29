import { requireDashboardContext } from "@/lib/dashboard-context";
import { getUserListingsForDashboardShell } from "@/lib/listings";
import { countNewOwnerLeads } from "@/lib/leads";
import { getEffectiveListingStatus } from "@/lib/listing-status";
import { buildOwnerNotifications } from "@/lib/owner-dashboard";
import { resolveProfileAvatarUrl } from "@/lib/profile-avatar";
import { getSupabaseUrl } from "@/lib/supabase/config";
import { DashboardLayoutProvider } from "@/components/dashboard/DashboardLayoutProvider";
import { DevBuildInfoStrip } from "@/components/dev/DevBuildInfoStrip";
import { OwnerIntlProvider } from "@/components/i18n/OwnerIntlProvider";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile, email } = await requireDashboardContext("/dashboard");

  let notifications: ReturnType<typeof buildOwnerNotifications> = [];
  let newLeads = 0;
  let avatarUrl: string | null = null;

  try {
    const [listings, leadsCount] = await Promise.all([
      getUserListingsForDashboardShell(profile.id),
      countNewOwnerLeads(profile.id),
    ]);
    newLeads = leadsCount;
    notifications = buildOwnerNotifications({
      profile,
      listings,
      newLeadsCount: newLeads,
      getEffectiveStatus: getEffectiveListingStatus,
    });
    avatarUrl = resolveProfileAvatarUrl(profile, getSupabaseUrl());
  } catch (err) {
    console.error("[dashboard] layout chrome data failed:", err);
  }

  return (
    <OwnerIntlProvider>
      <DashboardLayoutProvider
        profile={profile}
        email={email}
        avatarUrl={avatarUrl}
        notifications={notifications}
        newLeadsCount={newLeads}
      >
        {children}
        <DevBuildInfoStrip />
      </DashboardLayoutProvider>
    </OwnerIntlProvider>
  );
}
