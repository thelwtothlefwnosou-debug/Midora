import Link from "next/link";
import { CreditCard, Home } from "lucide-react";
import { AccountShell } from "@/components/account/AccountShell";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { requireDashboardContext } from "@/lib/dashboard-context";
import { getUserListings } from "@/lib/listings";
import { getEffectiveListingStatus } from "@/lib/listing-status";
import { getTranslations } from "next-intl/server";

export default async function SubscriptionDashboardPage() {
  const tFooter = await getTranslations("Footer");
  const t = await getTranslations("Owner.subscriptionPage");
  const { profile, email } = await requireDashboardContext("/dashboard/subscription");
  const listings = await getUserListings(profile.id);
  const activeListings = listings.filter(
    (l) => getEffectiveListingStatus(l) === "approved"
  ).length;

  const isFree = process.env.NEXT_PUBLIC_FREE_LISTINGS === "true";

  return (
    <AccountShell
      profile={profile}
      email={email}
      active="subscription"
      title={t("title")}
      subtitle={t("subtitle")}
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard glow className="p-6">
          <div className="flex items-center gap-3">
            <CreditCard className="h-6 w-6 text-gold" />
            <h2 className="font-display text-lg font-semibold text-charcoal">
              {t("currentPlan")}
            </h2>
          </div>
          <p className="mt-4 font-display text-3xl font-bold text-charcoal">
            {isFree ? t("freePlan") : t("basicPlan")}
          </p>
          <p className="mt-2 text-sm text-muted">
            {isFree ? t("freeDesc") : t("basicDesc")}
          </p>
          <ul className="mt-5 space-y-2 text-sm text-charcoal/80">
            <li>{t("activeListings", { count: activeListings })}</li>
            <li>{t("totalListings", { count: listings.length })}</li>
          </ul>
          {!isFree && (
            <p className="mt-4 text-xs text-muted">{t("billingNote")}</p>
          )}
        </GlassCard>

        <GlassCard className="p-6">
          <h2 className="font-display text-lg font-semibold text-charcoal">
            {t("manageListingsTitle")}
          </h2>
          <p className="mt-2 text-sm text-muted">{t("manageListingsDesc")}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button href="/dashboard/listings" variant="outline">
              <Home className="h-4 w-4" />
              {t("myListings")}
            </Button>
            <Button href="/dashboard/listings/new">{t("newListing")}</Button>
          </div>
          {listings.length > 0 && (
            <ul className="mt-6 space-y-2 border-t border-border pt-4">
              {listings.slice(0, 5).map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate text-charcoal">{l.title}</span>
                  <Link
                    href={`/dashboard/listings/${l.id}/pay`}
                    className="shrink-0 text-gold hover:underline"
                  >
                    {t("visibilityPackage")}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>
      </div>

      <GlassCard className="mt-6 p-5 text-sm leading-relaxed text-muted">
        {tFooter("legalBlocks.platform")}
      </GlassCard>
    </AccountShell>
  );
}
