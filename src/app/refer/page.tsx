import Link from "next/link";
import { Gift, TrendingUp, Users } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { getCurrentProfile } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import { generateReferralCode } from "@/lib/referrals";
import { ReferralShareButton } from "@/components/referrals/ReferralShareButton";

export default async function ReferPage() {
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

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-16">
        <div className="mx-auto max-w-3xl px-6">
          <h1 className="font-display text-3xl font-bold text-charcoal sm:text-4xl">
            Σύστησε ιδιοκτήτη, κέρδισε δωρεάν μήνες
          </h1>
          <p className="mt-3 text-muted">
            Μοιράσου τον σύνδεσμό σου. Όταν ο φίλος σου ανεβάσει και εγκριθεί η
            πρώτη του αγγελία, κερδίζεις{" "}
            <strong className="text-charcoal">1 δωρεάν μήνα</strong> στις δικές
            σου αγγελίες και{" "}
            <strong className="text-charcoal">boost στην αναζήτηση</strong> για
            30 ημέρες.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: Users,
                title: "Σύστησε",
                text: "Στείλε τον σύνδεσμο σε ιδιοκτήτη που θέλει να νοικιάσει",
              },
              {
                icon: Gift,
                title: "Κέρδισε μήνα",
                text: "Δωρεάν επέκταση στις δικές σου ενεργές αγγελίες",
              },
              {
                icon: TrendingUp,
                title: "Boost",
                text: "Οι αγγελίες σου εμφανίζονται πιο πάνω στα αποτελέσματα",
              },
            ].map(({ icon: Icon, title, text }) => (
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
                <p className="text-sm font-medium text-charcoal">
                  Ο σύνδεσμός σου σύστασης
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <code className="flex-1 rounded-xl border border-border bg-sand/50 px-4 py-3 text-sm text-charcoal break-all">
                    {shareUrl}
                  </code>
                  <ReferralShareButton url={shareUrl} code={referralCode!} />
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-muted">
                  Κάνε σύνδεση για να πάρεις τον προσωπικό σου σύνδεσμο σύστασης.
                </p>
                <Button href="/login?next=/refer" className="mt-4">
                  Σύνδεση / Εγγραφή
                </Button>
              </>
            )}
          </GlassCard>

          <p className="mt-8 text-center text-sm text-muted">
            Θέλεις να ανεβάσεις εσύ αγγελία;{" "}
            <Link href="/dashboard/listings/new" className="text-gold hover:underline">
              Γίνε ιδιοκτήτης →
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
