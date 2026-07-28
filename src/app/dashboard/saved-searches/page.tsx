import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AccountShell } from "@/components/account/AccountShell";
import { SavedSearchRow } from "@/components/saved-searches/SavedSearchRow";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { getSavedSearches } from "@/lib/user-features";
import { getCurrentProfile, createClient } from "@/lib/supabase/server";

export default async function SavedSearchesPage() {
  const t = await getTranslations("Owner.savedSearchesPage");
  const supabase = await createClient();
  if (!supabase) redirect("/login");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard/saved-searches");

  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const email = user.email ?? "";
  const searches = await getSavedSearches();

  return (
    <AccountShell
      profile={profile}
      email={email}
      active="overview"
      title={t("title")}
      subtitle={t("subtitle")}
    >
      {searches.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <p className="text-muted">{t("emptyText")}</p>
          <Button href="/listings?rentalType=short_term" className="mt-4">
            {t("searchProperties")}
          </Button>
        </GlassCard>
      ) : (
        <ul className="space-y-3">
          {searches.map((search) => (
            <SavedSearchRow key={search.id} search={search} />
          ))}
        </ul>
      )}

      <p className="mt-8 text-center text-sm text-muted">
        {t("newSearchPrompt")}{" "}
        <Link href="/listings?rentalType=short_term" className="text-gold hover:underline">
          {t("goToProperties")}
        </Link>
      </p>
    </AccountShell>
  );
}
