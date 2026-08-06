import { requireDashboardContext } from "@/lib/dashboard-context";
import { countNewOwnerLeads } from "@/lib/leads";
import {
  countUnreadUserNotifications,
  listUserNotifications,
} from "@/lib/notifications/queries";
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

  let notifications: Awaited<ReturnType<typeof listUserNotifications>> = [];
  let unreadNotificationCount = 0;
  let newLeads = 0;
  let avatarUrl: string | null = null;

  try {
    const [leadsCount, recentNotifications, unreadCount] = await Promise.all([
      countNewOwnerLeads(profile.id),
      listUserNotifications(profile.id, { limit: 6 }),
      countUnreadUserNotifications(profile.id),
    ]);
    newLeads = leadsCount;
    notifications = recentNotifications;
    unreadNotificationCount = unreadCount;
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
        unreadNotificationCount={unreadNotificationCount}
        newLeadsCount={newLeads}
      >
        {children}
        <DevBuildInfoStrip />
      </DashboardLayoutProvider>
    </OwnerIntlProvider>
  );
}
