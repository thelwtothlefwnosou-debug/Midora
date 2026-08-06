import { AccountShell } from "@/components/account/AccountShell";
import { NotificationsPageClient } from "@/components/notifications/NotificationsPageClient";
import { requireDashboardContext } from "@/lib/dashboard-context";
import {
  countUnreadUserNotifications,
  listUserNotifications,
} from "@/lib/notifications/queries";

export default async function DashboardNotificationsPage() {
  const { profile, email } = await requireDashboardContext(
    "/dashboard/notifications"
  );
  const [notifications, unreadCount] = await Promise.all([
    listUserNotifications(profile.id, { limit: 40 }),
    countUnreadUserNotifications(profile.id),
  ]);

  return (
    <AccountShell profile={profile} email={email} active="settings" title="">
      <NotificationsPageClient
        initialNotifications={notifications}
        initialUnreadCount={unreadCount}
      />
    </AccountShell>
  );
}
