import { getTranslations } from "next-intl/server";
import { AccountShell } from "@/components/account/AccountShell";
import { OwnerProfilePageContent } from "@/components/profile/OwnerProfilePageContent";
import { requireDashboardContext } from "@/lib/dashboard-context";
import { resolveProfileAvatarUrl } from "@/lib/profile-avatar";
import { getSupabaseUrl } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export default async function OwnerProfilePage() {
  const { profile, email } = await requireDashboardContext("/dashboard/profile");
  const t = await getTranslations("Owner.profilePage");
  const supabase = await createClient();
  const authUser = (await supabase?.auth.getUser())?.data.user;
  const emailVerified = Boolean(authUser?.email_confirmed_at);

  const avatarUrl = resolveProfileAvatarUrl(profile, getSupabaseUrl());
  const phoneVerified = Boolean(profile.primary_phone_verified_at);

  return (
    <AccountShell
      profile={profile}
      email={email}
      active="profile"
      title={t("title")}
      subtitle={t("subtitle")}
    >
      <div className="mx-auto max-w-[1080px]">
        <OwnerProfilePageContent
          profile={profile}
          email={email}
          avatarUrl={avatarUrl}
          emailVerified={emailVerified}
          phoneVerified={phoneVerified}
        />
      </div>
    </AccountShell>
  );
}
