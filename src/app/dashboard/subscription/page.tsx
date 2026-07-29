import Link from "next/link";
import { CreditCard, Home, Plus } from "lucide-react";
import { AccountShell } from "@/components/account/AccountShell";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { requireDashboardContext } from "@/lib/dashboard-context";
import { getUserListings } from "@/lib/listings";
import { getEffectiveListingStatus } from "@/lib/listing-status";
import { getOwnerListingStatus } from "@/lib/dashboard-listings";
import { getTranslations } from "next-intl/server";

export default async function SubscriptionDashboardPage() {
  const tFooter = await getTranslations("Footer");
  const t = await getTranslations("Owner.subscriptionPage");
  const { profile, email } = await requireDashboardContext("/dashboard/subscription");
  const listings = await getUserListings(profile.id);

  let liveCount = 0;
  let draftCount = 0;
  let needsActionCount = 0;

  for (const listing of listings) {
    const effective = getEffectiveListingStatus(listing);
    const ownerKey = getOwnerListingStatus(listing, effective).key;
    if (ownerKey === "published" || ownerKey === "paused") liveCount += 1;
    else if (ownerKey === "draft") draftCount += 1;
    else if (ownerKey === "needs_fixes" || ownerKey === "expired") needsActionCount += 1;
  }

  const isFree = process.env.NEXT_PUBLIC_FREE_LISTINGS === "true";
  const nextHref = listings.length === 0 ? "/dashboard/listings/new" : "/dashboard/listings";
  const nextLabel = listings.length === 0 ? t("newListing") : t("myListings");

  return (
    <AccountShell
      profile={profile}
      email={email}
      active="subscription"
      title={t("title")}
      subtitle={t("subtitle")}
    >
      <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
        <GlassCard hover={false} className="p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sand">
              <CreditCard className="h-5 w-5 text-gold-dark" strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-[11px] font-medium tracking-wide text-muted uppercase">
                {t("currentPlan")}
              </p>
              <h2 className="font-display text-xl font-semibold text-charcoal">
                {isFree ? t("freePlan") : t("basicPlan")}
              </h2>
            </div>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            {isFree ? t("freeDesc") : t("basicDesc")}
          </p>
          <ul className="mt-5 space-y-2 text-sm text-charcoal/85">
            <li>{t("activeListings", { count: liveCount })}</li>
            <li>{t("totalListings", { count: listings.length })}</li>
          </ul>
          {!isFree ? (
            <p className="mt-4 text-xs leading-relaxed text-muted">{t("billingNote")}</p>
          ) : null}
        </GlassCard>

        <GlassCard hover={false} className="p-5 sm:p-6">
          <h2 className="font-display text-lg font-semibold text-charcoal">
            {t("listingStatusTitle")}
          </h2>
          <p className="mt-1.5 text-sm text-muted">{t("listingStatusDesc")}</p>
          <dl className="mt-5 grid grid-cols-3 gap-2.5">
            <div className="rounded-xl border border-border bg-cream/40 px-3 py-3 text-center">
              <dt className="text-[11px] text-muted">{t("statusLive")}</dt>
              <dd className="mt-1 font-display text-xl font-semibold tabular-nums text-charcoal">
                {liveCount}
              </dd>
            </div>
            <div className="rounded-xl border border-border bg-cream/40 px-3 py-3 text-center">
              <dt className="text-[11px] text-muted">{t("statusDraft")}</dt>
              <dd className="mt-1 font-display text-xl font-semibold tabular-nums text-charcoal">
                {draftCount}
              </dd>
            </div>
            <div className="rounded-xl border border-border bg-cream/40 px-3 py-3 text-center">
              <dt className="text-[11px] text-muted">{t("statusAction")}</dt>
              <dd className="mt-1 font-display text-xl font-semibold tabular-nums text-charcoal">
                {needsActionCount}
              </dd>
            </div>
          </dl>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button href={nextHref}>
              {listings.length === 0 ? (
                <Plus className="h-4 w-4" />
              ) : (
                <Home className="h-4 w-4" />
              )}
              {nextLabel}
            </Button>
            {listings.length > 0 ? (
              <Button href="/dashboard/listings/new" variant="outline">
                {t("newListing")}
              </Button>
            ) : null}
          </div>

          {listings.length > 0 ? (
            <ul className="mt-6 space-y-2 border-t border-border pt-4">
              {listings.slice(0, 5).map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate text-charcoal">{l.title}</span>
                  <Link
                    href={`/dashboard/listings/${l.id}/pay`}
                    className="shrink-0 text-gold-dark hover:underline"
                  >
                    {t("visibilityPackage")}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </GlassCard>
      </div>

      <GlassCard hover={false} className="mt-6 p-5 text-sm leading-relaxed text-muted">
        {tFooter("roleStatement")}
      </GlassCard>
    </AccountShell>
  );
}
