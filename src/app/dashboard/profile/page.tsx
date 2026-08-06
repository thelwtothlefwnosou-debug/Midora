import { getTranslations } from "next-intl/server";
import { AccountShell } from "@/components/account/AccountShell";
import { OwnerProfilePageContent } from "@/components/profile/OwnerProfilePageContent";
import { requireDashboardContext } from "@/lib/dashboard-context";
import { getUserListings } from "@/lib/listings";
import { getEffectiveListingStatus } from "@/lib/listing-status";
import { getOwnerListingStatus } from "@/lib/dashboard-listings";
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
  const listings = await getUserListings(profile.id);

  let publishedCount = 0;
  let draftCount = 0;
  for (const listing of listings) {
    const key = getOwnerListingStatus(listing, getEffectiveListingStatus(listing)).key;
    if (key === "published" || key === "paused") publishedCount += 1;
    else if (key === "draft" || key === "needs_fixes") draftCount += 1;
  }

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
          totalListings={listings.length}
          publishedCount={publishedCount}
          draftCount={draftCount}
          firstDraftId={
            listings.find((l) => {
              const key = getOwnerListingStatus(l, getEffectiveListingStatus(l)).key;
              return key === "draft" || key === "needs_fixes";
            })?.id ?? null
          }
        />
      </div>
    </AccountShell>
  );
}
