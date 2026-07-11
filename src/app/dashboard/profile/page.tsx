import { AccountShell } from "@/components/account/AccountShell";
import { ProfileIdentityCard } from "@/components/profile/ProfileIdentityCard";
import { OwnerProfileForm } from "@/components/profile/OwnerProfileForm";
import { requireDashboardContext } from "@/lib/dashboard-context";
import { resolveProfileAvatarUrl } from "@/lib/profile-avatar";
import { getSupabaseUrl } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export default async function OwnerProfilePage() {
  const { profile, email } = await requireDashboardContext("/dashboard/profile");
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
      title="Το προφίλ μου"
      subtitle="Διαχειρίσου τα στοιχεία που εμφανίζονται στους ενδιαφερόμενους."
    >
      <div className="mx-auto max-w-[1080px]">
        <div className="grid gap-6 lg:grid-cols-[minmax(260px,320px)_1fr] lg:items-start">
          <ProfileIdentityCard
            profile={profile}
            email={email}
            avatarUrl={avatarUrl}
            emailVerified={emailVerified}
            showPublicPhoto={profile.show_profile_photo_public !== false}
          />
          <OwnerProfileForm
            profile={profile}
            email={email}
            avatarUrl={avatarUrl}
            phoneVerified={phoneVerified}
            emailVerified={emailVerified}
          />
        </div>
      </div>
    </AccountShell>
  );
}
