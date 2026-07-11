import { Suspense } from "react";
import { requireDashboardContext } from "@/lib/dashboard-context";
import { AccountShell } from "@/components/account/AccountShell";
import { SettingsForm } from "./SettingsForm";
import { parseSettingsTab } from "@/components/dashboard/DashboardSettingsTabs";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { profile, email } = await requireDashboardContext("/dashboard/settings");
  const { tab } = await searchParams;
  const activeTab = parseSettingsTab(tab);

  return (
    <AccountShell
      profile={profile}
      email={email}
      active="settings"
      title="Ρυθμίσεις"
      subtitle="Διαχείριση επικοινωνίας, ασφάλειας και ειδοποιήσεων"
    >
      <Suspense fallback={null}>
        <SettingsForm
          fullName={profile.full_name ?? ""}
          phone={profile.phone ?? ""}
          email={email}
          activeTab={activeTab}
        />
      </Suspense>
    </AccountShell>
  );
}
