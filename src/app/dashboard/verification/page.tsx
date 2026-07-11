import Link from "next/link";
import {
  Phone,
  Mail,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { AccountShell } from "@/components/account/AccountShell";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { requireDashboardContext } from "@/lib/dashboard-context";
import { createClient } from "@/lib/supabase/server";

export default async function VerificationDashboardPage() {
  const { profile, email } = await requireDashboardContext("/dashboard/verification");
  const supabase = await createClient();
  const authUser = (await supabase?.auth.getUser())?.data.user;
  const emailVerified = Boolean(authUser?.email_confirmed_at);
  const phoneVerified = Boolean(profile.primary_phone_verified_at);

  return (
    <AccountShell
      profile={profile}
      email={email}
      active="verification"
      title="Επαλήθευση λογαριασμού"
      subtitle="Ολοκλήρωσε τις διαδικασίες επαλήθευσης για αξιόπιστη επικοινωνία"
    >
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <GlassCard className="flex flex-col p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sand">
                <Mail className="h-5 w-5 text-charcoal/70" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold text-charcoal">Email</h2>
                <p className="mt-1 text-sm text-muted">
                  Επιβεβαίωση διεύθυνσης email για ασφαλή σύνδεση
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm">
              {emailVerified ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-teal" />
                  <span className="font-medium text-teal">Επιβεβαιώθηκε</span>
                </>
              ) : (
                <>
                  <Circle className="h-4 w-4 text-muted" />
                  <span className="text-muted">Δεν έχει επιβεβαιωθεί</span>
                </>
              )}
            </div>
            {!emailVerified && (
              <p className="mt-4 text-sm text-muted">
                Έλεγξε τα εισερχόμενά σου για email επιβεβαίωσης ή{" "}
                <Link href="/auth/forgot-password" className="text-gold hover:underline">
                  ζήτησε νέο link
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
                <h2 className="font-semibold text-charcoal">Τηλέφωνο</h2>
                <p className="mt-1 text-sm text-muted">
                  Επιβεβαίωση κινητού για αξιόπιστη επικοινωνία
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm">
              {phoneVerified ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-teal" />
                  <span className="font-medium text-teal">Επιβεβαιώθηκε</span>
                </>
              ) : (
                <>
                  <Circle className="h-4 w-4 text-muted" />
                  <span className="text-muted">Δεν έχει επιβεβαιωθεί</span>
                </>
              )}
            </div>
            {!phoneVerified && (
              <Button href="/dashboard/settings/contact" className="mt-5" size="sm">
                Επιβεβαίωση τηλεφώνου
              </Button>
            )}
          </GlassCard>
        </div>

        <p className="rounded-xl border border-border bg-sand/30 px-4 py-3 text-sm text-muted">
          Η πρόσθετη επαλήθευση ταυτότητας θα είναι διαθέσιμη σύντομα.
        </p>

        <p className="text-sm text-muted">
          Για στοιχεία προφίλ και φωτογραφία, πήγαινε στο{" "}
          <Link href="/dashboard/profile" className="font-medium text-gold hover:underline">
            Το προφίλ μου
          </Link>
          . Για στοιχεία αγγελιών, χρησιμοποίησε τη{" "}
          <Link href="/dashboard/listings" className="font-medium text-gold hover:underline">
            Διαχείριση αγγελιών
          </Link>
          .
        </p>
      </div>
    </AccountShell>
  );
}
