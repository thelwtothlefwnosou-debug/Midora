import { getTranslations } from "next-intl/server";
import { GlassCard } from "@/components/ui/GlassCard";
import { activateListingFree } from "@/lib/actions";
import { createClient } from "@/lib/supabase/server";
import { requireDashboardContext } from "@/lib/dashboard-context";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function PayListingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error: errorParam } = await searchParams;
  const { profile } = await requireDashboardContext("/dashboard/listings");
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
  const t = await getTranslations("Owner.payPage");

  return (
    <>
      <p className="mb-6 text-sm text-muted">
        {t("billingNote")}
      </p>

      <GlassCard glow className="mx-auto max-w-lg p-8 text-center">
        {errorParam && (
          <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorParam === "config" ? t("serviceUnavailable") : errorParam}
          </p>
        )}
        {isFree ? (
          <>
            <p className="font-display text-5xl font-bold text-gold">{t("free")}</p>
            <p className="mt-2 text-muted">{t("launchOffer")}</p>
            <form action={activateListingFree.bind(null, id)} className="mt-8">
              <button
                type="submit"
                className="w-full rounded-full bg-gradient-to-r from-gold to-gold-light py-4 font-semibold text-charcoal"
              >
                {isExpired ? t("renewListing") : t("submitForApproval")}
              </button>
            </form>
          </>
        ) : (
          <>
            <p className="font-display text-5xl font-bold text-gold">{t("packagePrice")}</p>
            <p className="mt-2 text-muted">{t("visibilityPackage")}</p>
            <Link
              href={`/api/checkout?listingId=${id}`}
              className="mt-8 block w-full rounded-full bg-gradient-to-r from-gold to-gold-light py-4 font-semibold text-charcoal"
            >
              {t("activateVisibility")}
            </Link>
          </>
        )}
      </GlassCard>
    </>
  );
}
