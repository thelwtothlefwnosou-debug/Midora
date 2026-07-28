import Link from "next/link";
import { Gift, TrendingUp, Users } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { getCurrentProfile } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import { generateReferralCode } from "@/lib/referrals";
import { ReferralShareButton } from "@/components/referrals/ReferralShareButton";

export default async function ReferPage() {
  const t = await getTranslations("Refer");
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  let referralCode = profile?.referral_code ?? null;
  if (profile && !referralCode && supabase) {
    referralCode = generateReferralCode(profile.id);
    await supabase
      .from("profiles")
      .update({ referral_code: referralCode })
      .eq("id", profile.id);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const shareUrl = referralCode
    ? `${appUrl}/register?ref=${referralCode}`
    : `${appUrl}/register`;

  const steps = [
    { icon: Users, title: t("step1Title"), text: t("step1Text") },
    { icon: Gift, title: t("step2Title"), text: t("step2Text") },
    { icon: TrendingUp, title: t("step3Title"), text: t("step3Text") },
  ] as const;

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-16">
        <div className="mx-auto max-w-3xl px-6">
          <h1 className="font-display text-3xl font-bold text-charcoal sm:text-4xl">
            {t("title")}
          </h1>
          <p className="mt-3 text-muted">
            {t.rich("subtitle", {
              freeMonth: (chunks) => (
                <strong className="text-charcoal">{chunks}</strong>
              ),
              boost: (chunks) => (
                <strong className="text-charcoal">{chunks}</strong>
              ),
            })}
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {steps.map(({ icon: Icon, title, text }) => (
              <GlassCard key={title} className="p-5">
                <Icon className="h-6 w-6 text-gold" />
                <h3 className="mt-3 font-semibold text-charcoal">{title}</h3>
                <p className="mt-1 text-sm text-muted">{text}</p>
              </GlassCard>
            ))}
          </div>

          <GlassCard glow className="mt-10 p-6">
            {profile ? (
              <>
                <p className="text-sm font-medium text-charcoal">{t("yourReferralLink")}</p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <code className="flex-1 rounded-xl border border-border bg-sand/50 px-4 py-3 text-sm text-charcoal break-all">
                    {shareUrl}
                  </code>
                  <ReferralShareButton url={shareUrl} code={referralCode!} />
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-muted">{t("loginPrompt")}</p>
                <Button href="/login?next=/refer" className="mt-4">
                  {t("loginCta")}
                </Button>
              </>
            )}
          </GlassCard>

          <p className="mt-8 text-center text-sm text-muted">
            {t("wantToList")}{" "}
            <Link href="/dashboard/listings/new" className="text-gold hover:underline">
              {t("becomeOwner")}
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
