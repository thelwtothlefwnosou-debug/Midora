import { AccountShell } from "@/components/account/AccountShell";
import { GlassCard } from "@/components/ui/GlassCard";
import { activateListingFree } from "@/lib/actions";
import { createClient } from "@/lib/supabase/server";
import { requireDashboardContext } from "@/lib/dashboard-context";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function PayListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { profile, email } = await requireDashboardContext("/dashboard/listings");
  const supabase = await createClient();
  if (!supabase) redirect("/login");

  const { data: listing } = await supabase
    .from("listings")
    .select("title, user_id, status, expires_at")
    .eq("id", id)
    .single();

  if (!listing || listing.user_id !== profile.id) redirect("/dashboard");

  const isFree = process.env.NEXT_PUBLIC_FREE_LISTINGS === "true";
  const isExpired =
    listing.status === "approved" &&
    listing.expires_at &&
    new Date(listing.expires_at) <= new Date();

  return (
    <AccountShell
      profile={profile}
      email={email}
      active="listings"
      title={isFree ? "Συνδρομή προβολής" : "Χρέωση δημοσίευσης αγγελίας"}
      subtitle={listing.title}
    >
      <p className="mb-6 text-sm text-muted">
        Η χρέωση αφορά μόνο την προβολή της αγγελίας — όχι μισθώσεις ή συμφωνίες.
      </p>

      <GlassCard glow className="mx-auto max-w-lg p-8 text-center">
        {isFree ? (
          <>
            <p className="font-display text-5xl font-bold text-gold">Δωρεάν</p>
            <p className="mt-2 text-muted">Προσφορά launch — χωρίς χρέωση</p>
            <form action={activateListingFree.bind(null, id)} className="mt-8">
              <button
                type="submit"
                className="w-full rounded-full bg-gradient-to-r from-gold to-gold-light py-4 font-semibold text-charcoal"
              >
                {isExpired ? "Ανανέωση αγγελίας" : "Υποβολή για έγκριση"}
              </button>
            </form>
          </>
        ) : (
          <>
            <p className="font-display text-5xl font-bold text-gold">1€</p>
            <p className="mt-2 text-muted">Πακέτο προβολής — 1 μήνας ενεργής προβολής</p>
            <Link
              href={`/api/checkout?listingId=${id}`}
              className="mt-8 block w-full rounded-full bg-gradient-to-r from-gold to-gold-light py-4 font-semibold text-charcoal"
            >
              Ενεργοποίηση προβολής αγγελίας
            </Link>
          </>
        )}
      </GlassCard>
    </AccountShell>
  );
}
