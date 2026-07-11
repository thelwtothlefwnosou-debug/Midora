"use client";

import Link from "next/link";
import { Bell, KeyRound, ShieldCheck, Phone } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import {
  DashboardSettingsTabs,
  type SettingsTabId,
} from "@/components/dashboard/DashboardSettingsTabs";

type SettingsFormProps = {
  fullName: string;
  phone: string;
  email: string;
  activeTab: SettingsTabId;
};

export function SettingsForm({ fullName, phone, email, activeTab }: SettingsFormProps) {
  return (
    <DashboardSettingsTabs active={activeTab}>
      {activeTab === "contact" && (
        <GlassCard className="p-6 sm:p-8">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sand">
              <Phone className="h-5 w-5 text-charcoal/70" />
            </div>
            <div>
              <h2 className="font-semibold text-charcoal">Επικοινωνία</h2>
              <p className="text-sm text-muted">
                Τηλέφωνο, SMS επιβεβαίωση, WhatsApp και Viber
              </p>
            </div>
          </div>
          <p className="text-sm text-muted">
            Το βασικό τηλέφωνό σου: <span className="font-medium text-charcoal">{phone || "—"}</span>
          </p>
          <p className="mt-3 text-sm text-muted">
            Για πλήρη διαχείριση επικοινωνίας, επιβεβαίωση SMS και ρυθμίσεις WhatsApp/Viber:
          </p>
          <Button href="/dashboard/settings/contact" className="mt-5" variant="outline">
            Άνοιγμα ρυθμίσεων επικοινωνίας
          </Button>
        </GlassCard>
      )}

      {activeTab === "privacy" && (
        <div className="space-y-6">
          <GlassCard className="p-6 sm:p-8">
            <h2 className="font-semibold text-charcoal">Απόρρητο</h2>
            <p className="mt-2 text-sm text-muted">
              Έλεγχος του τι εμφανίζεται δημόσια στις αγγελίες σου.
            </p>
            <div className="mt-5 space-y-3 text-sm">
              <label className="flex items-start gap-3 rounded-xl border border-border bg-sand/30 px-4 py-3">
                <input type="checkbox" disabled className="mt-0.5 accent-gold opacity-60" />
                <span>
                  <span className="font-medium text-charcoal">
                    Εμφάνιση φωτογραφίας προφίλ στις αγγελίες μου
                  </span>
                  <span className="mt-0.5 block text-muted">
                    Διαχειρίσου από το{" "}
                    <Link href="/dashboard/profile" className="text-gold hover:underline">
                      Το προφίλ μου
                    </Link>
                    .
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-3 rounded-xl border border-border bg-sand/30 px-4 py-3">
                <input type="checkbox" checked disabled className="mt-0.5 accent-gold" />
                <span>
                  <span className="font-medium text-charcoal">
                    Στοιχεία επικοινωνίας μετά από ενδιαφέρον
                  </span>
                  <span className="mt-0.5 block text-muted">
                    Τα στοιχεία επικοινωνίας εμφανίζονται μόνο αφού ο επισκέπτης εκδηλώσει
                    ενδιαφέρον.
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-3 rounded-xl border border-border bg-sand/30 px-4 py-3">
                <input type="checkbox" disabled className="mt-0.5 accent-gold opacity-60" />
                <span className="text-muted">Ενημερωτικά email marketing (σύντομα)</span>
              </label>
            </div>
          </GlassCard>

          <GlassCard className="border-teal/20 bg-teal/5 p-6">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-teal" />
              <div className="text-sm text-charcoal/80">
                <p className="font-medium text-charcoal">Προστασία δεδομένων</p>
                <p className="mt-1 text-muted">
                  Το τηλέφωνό σου εμφανίζεται μόνο σε ενεργές αγγελίες. Δεν κοινοποιούμε τα
                  στοιχεία σου σε τρίτους χωρίς τη συγκατάθεσή σου.
                </p>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {activeTab === "security" && (
        <GlassCard className="p-6 sm:p-8">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sand">
              <KeyRound className="h-5 w-5 text-charcoal/70" />
            </div>
            <div>
              <h2 className="font-semibold text-charcoal">Ασφάλεια</h2>
              <p className="text-sm text-muted">Κωδικός πρόσβασης και λογαριασμός</p>
            </div>
          </div>
          <div className="space-y-4 text-sm">
            <div className="rounded-xl border border-border bg-sand/30 px-4 py-3">
              <p className="text-xs text-muted uppercase">Email σύνδεσης</p>
              <p className="mt-1 font-medium text-charcoal">{email}</p>
            </div>
            <Link
              href="/auth/forgot-password"
              className="inline-flex items-center gap-2 font-medium text-gold hover:underline"
            >
              Αλλαγή κωδικού
            </Link>
            <p className="text-xs text-muted">
              Ενεργές συνεδρίες και αίτημα διαγραφής λογαριασμού θα είναι διαθέσιμα σύντομα.
            </p>
          </div>
        </GlassCard>
      )}

      {activeTab === "notifications" && (
        <GlassCard className="p-6 sm:p-8">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10">
              <Bell className="h-5 w-5 text-gold" />
            </div>
            <div>
              <h2 className="font-semibold text-charcoal">Ειδοποιήσεις</h2>
              <p className="text-sm text-muted">Email ειδοποιήσεις για τη δραστηριότητά σου</p>
            </div>
          </div>
          <div className="space-y-3 text-sm text-muted">
            <label className="flex items-center gap-3 rounded-xl border border-border bg-sand/30 px-4 py-3">
              <input type="checkbox" disabled className="accent-gold opacity-60" />
              <span>Email για νέα ενδιαφέροντα</span>
            </label>
            <label className="flex items-center gap-3 rounded-xl border border-border bg-sand/30 px-4 py-3">
              <input type="checkbox" disabled className="accent-gold opacity-60" />
              <span>Email για νέα μηνύματα</span>
            </label>
            <label className="flex items-center gap-3 rounded-xl border border-border bg-sand/30 px-4 py-3">
              <input type="checkbox" disabled className="accent-gold opacity-60" />
              <span>Email για κατάσταση έγκρισης αγγελίας</span>
            </label>
            <label className="flex items-center gap-3 rounded-xl border border-border bg-sand/30 px-4 py-3">
              <input type="checkbox" disabled className="accent-gold opacity-60" />
              <span>Εβδομαδιαία σύνοψη απόδοσης</span>
            </label>
            <p className="text-xs text-muted/80">
              Οι προτιμήσεις ειδοποιήσεων θα είναι διαθέσιμες σύντομα.
            </p>
          </div>
        </GlassCard>
      )}
    </DashboardSettingsTabs>
  );
}
