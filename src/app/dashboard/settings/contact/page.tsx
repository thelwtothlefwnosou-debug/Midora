import { requireDashboardContext } from "@/lib/dashboard-context";
import { AccountShell } from "@/components/account/AccountShell";
import { ContactSettingsForm } from "./ContactSettingsForm";

export default async function ContactSettingsPage() {
  const { profile, email } = await requireDashboardContext("/dashboard/settings/contact");

  return (
    <AccountShell
      profile={profile}
      email={email}
      active="settings"
      title="Επικοινωνία"
      subtitle="Επιβεβαίωση τηλεφώνου και κανάλια επικοινωνίας"
    >
      <ContactSettingsForm profile={profile} />
    </AccountShell>
  );
}
