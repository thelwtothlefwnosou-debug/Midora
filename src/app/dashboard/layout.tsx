import { requireDashboardContext } from "@/lib/dashboard-context";
import { getUserListings } from "@/lib/listings";
import { countNewOwnerLeads } from "@/lib/leads";
import { getEffectiveListingStatus } from "@/lib/listing-status";
import { buildOwnerNotifications } from "@/lib/owner-dashboard";
import { resolveProfileAvatarUrl } from "@/lib/profile-avatar";
import { getSupabaseUrl } from "@/lib/supabase/config";
import { DashboardLayoutProvider } from "@/components/dashboard/DashboardLayoutProvider";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile, email } = await requireDashboardContext("/dashboard");
  const listings = await getUserListings(profile.id);
  const newLeads = await countNewOwnerLeads(profile.id);
  const notifications = buildOwnerNotifications({
    profile,
    listings,
    newLeadsCount: newLeads,
    getEffectiveStatus: getEffectiveListingStatus,
  });
  const avatarUrl = resolveProfileAvatarUrl(profile, getSupabaseUrl());

  return (
    <DashboardLayoutProvider
      profile={profile}
      email={email}
      avatarUrl={avatarUrl}
      notifications={notifications}
      newLeadsCount={newLeads}
    >
      {children}
    </DashboardLayoutProvider>
  );
}
