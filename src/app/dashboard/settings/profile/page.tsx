import Link from "next/link";
import { requireDashboardContext } from "@/lib/dashboard-context";
import { AccountShell } from "@/components/account/AccountShell";
import { ProfilePhotoUpload } from "@/components/dashboard/ProfilePhotoUpload";
import { GlassCard } from "@/components/ui/GlassCard";
import { getSupabaseUrl } from "@/lib/supabase/config";
import { resolveProfileAvatarUrl } from "@/lib/profile-avatar";

export default async function ProfileSettingsPage() {
  const { profile, email } = await requireDashboardContext("/dashboard/settings/profile");

  const avatarUrl = resolveProfileAvatarUrl(profile, getSupabaseUrl());

  return (
    <AccountShell
      profile={profile}
      email={email}
      active="settings"
      title="Φωτογραφία προφίλ"
      subtitle="Η εικόνα που εμφανίζεται στις αγγελίες σου"
    >
      <div className="space-y-4">
        <Link
          href="/dashboard/settings"
          className="inline-block text-sm text-muted hover:text-gold"
        >
          ← Πίσω στις ρυθμίσεις
        </Link>

        <GlassCard className="p-6 sm:p-8">
          <h2 className="font-semibold text-charcoal">Φωτογραφία προφίλ</h2>
          <p className="mt-1 text-sm text-muted">
            Οι επισκέπτες θα βλέπουν αυτή την εικόνα στην ενότητα αγγελιοδότη.
          </p>
          <div className="mt-6">
            <ProfilePhotoUpload
              profile={{ ...profile, email }}
              avatarUrl={avatarUrl}
              showPublicPhoto={profile.show_profile_photo_public !== false}
            />
          </div>
        </GlassCard>
      </div>
    </AccountShell>
  );
}
