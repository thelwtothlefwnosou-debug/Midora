import Link from "next/link";
import { redirect } from "next/navigation";
import { AccountShell } from "@/components/account/AccountShell";
import { SavedSearchRow } from "@/components/saved-searches/SavedSearchRow";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { getSavedSearches } from "@/lib/user-features";
import { getCurrentProfile, createClient } from "@/lib/supabase/server";

export default async function SavedSearchesPage() {
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
      title="Αποθηκευμένες αναζητήσεις"
      subtitle="Επανάλαβε αναζήτηση, ενεργοποίησε email alerts ή διέγραψε παλιές"
    >
      {searches.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <p className="text-muted">Δεν έχεις αποθηκευμένες αναζητήσεις ακόμα.</p>
          <Button href="/listings" className="mt-4">
            Αναζήτηση ακινήτων
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
        Νέα αναζήτηση;{" "}
        <Link href="/listings" className="text-gold hover:underline">
          Πήγαινε στα ακίνητα →
        </Link>
      </p>
    </AccountShell>
  );
}
