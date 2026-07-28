import { getTranslations } from "next-intl/server";
import { requireDashboardContext } from "@/lib/dashboard-context";
import { AccountShell } from "@/components/account/AccountShell";
import { ContactSettingsForm } from "./ContactSettingsForm";

export default async function ContactSettingsPage() {
  const { profile, email } = await requireDashboardContext("/dashboard/settings/contact");
  const t = await getTranslations("Owner.contactSettings");

  return (
    <AccountShell
      profile={profile}
      email={email}
      active="settings"
      title={t("pageTitle")}
      subtitle={t("pageSubtitle")}
    >
      <ContactSettingsForm profile={profile} />
    </AccountShell>
  );
}
