import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { requireDashboardContext } from "@/lib/dashboard-context";
import { parseSettingsTab } from "@/lib/dashboard-settings-tabs";
import { AccountShell } from "@/components/account/AccountShell";
import { SettingsForm } from "./SettingsForm";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { profile, email } = await requireDashboardContext("/dashboard/settings");
  const { tab } = await searchParams;
  const activeTab = parseSettingsTab(tab);
  const t = await getTranslations("Owner.settings");

  return (
    <AccountShell
      profile={profile}
      email={email}
      active="settings"
      title={t("title")}
      subtitle={t("subtitle")}
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
