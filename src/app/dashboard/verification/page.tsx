import Link from "next/link";
import {
  Phone,
  Mail,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { AccountShell } from "@/components/account/AccountShell";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { requireDashboardContext } from "@/lib/dashboard-context";
import { createClient } from "@/lib/supabase/server";

export default async function VerificationDashboardPage() {
  const { profile, email } = await requireDashboardContext("/dashboard/verification");
  const t = await getTranslations("Owner.verification");
  const supabase = await createClient();
  const authUser = (await supabase?.auth.getUser())?.data.user;
  const emailVerified = Boolean(authUser?.email_confirmed_at);
  const phoneVerified = Boolean(profile.primary_phone_verified_at);

  return (
    <AccountShell
      profile={profile}
      email={email}
      active="verification"
      title={t("title")}
      subtitle={t("subtitle")}
    >
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <GlassCard className="flex flex-col p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sand">
                <Mail className="h-5 w-5 text-charcoal/70" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold text-charcoal">{t("emailTitle")}</h2>
                <p className="mt-1 text-sm text-muted">{t("emailDesc")}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm">
              {emailVerified ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-teal" />
                  <span className="font-medium text-teal">{t("verified")}</span>
                </>
              ) : (
                <>
                  <Circle className="h-4 w-4 text-muted" />
                  <span className="text-muted">{t("notVerified")}</span>
                </>
              )}
            </div>
            {!emailVerified && (
              <p className="mt-4 text-sm text-muted">
                {t("checkInboxPrefix")}{" "}
                <Link href="/auth/forgot-password" className="text-gold hover:underline">
                  {t("requestNewLink")}
                </Link>
                .
              </p>
            )}
          </GlassCard>

          <GlassCard className="flex flex-col p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sand">
                <Phone className="h-5 w-5 text-charcoal/70" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold text-charcoal">{t("phoneTitle")}</h2>
                <p className="mt-1 text-sm text-muted">{t("phoneDesc")}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm">
              {phoneVerified ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-teal" />
                  <span className="font-medium text-teal">{t("verified")}</span>
                </>
              ) : (
                <>
                  <Circle className="h-4 w-4 text-muted" />
                  <span className="text-muted">{t("notVerified")}</span>
                </>
              )}
            </div>
            {!phoneVerified && (
              <Button href="/dashboard/settings/contact" className="mt-5" size="sm">
                {t("verifyPhoneCta")}
              </Button>
            )}
          </GlassCard>
        </div>

        <p className="rounded-xl border border-border bg-sand/30 px-4 py-3 text-sm text-muted">
          {t("identityComingSoon")}
        </p>

        <p className="text-sm text-muted">
          {t("profileHintPrefix")}{" "}
          <Link href="/dashboard/profile" className="font-medium text-gold hover:underline">
            {t("myProfileLink")}
          </Link>
          . {t("listingsHintMiddle")}{" "}
          <Link href="/dashboard/listings" className="font-medium text-gold hover:underline">
            {t("manageListingsLink")}
          </Link>
          .
        </p>
      </div>
    </AccountShell>
  );
}
