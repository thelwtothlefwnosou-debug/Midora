"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { Profile } from "@/lib/types";
import { updateContactPreferences } from "@/lib/contact-actions";
import { PhoneSmsVerification } from "@/components/contact/PhoneSmsVerification";
import { cn } from "@/lib/utils";

type Props = {
  profile: Profile;
};

export function ContactSettingsForm({ profile }: Props) {
  const [phone, setPhone] = useState(profile.phone ?? "");

  const [prefsPending, startPrefs] = useTransition();
  const [prefsError, setPrefsError] = useState<string | null>(null);
  const [prefsSaved, setPrefsSaved] = useState(false);
  const [whatsappUsePrimary, setWhatsappUsePrimary] = useState(
    profile.whatsapp_use_primary_phone !== false
  );
  const [viberUsePrimary, setViberUsePrimary] = useState(
    profile.viber_use_primary_phone !== false
  );

  function savePrefs(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setPrefsError(null);
    setPrefsSaved(false);
    startPrefs(async () => {
      const result = await updateContactPreferences(fd);
      if ("error" in result && result.error) {
        setPrefsError(result.error);
        return;
      }
      setPrefsSaved(true);
    });
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="font-display text-lg font-semibold text-charcoal">Βασικό τηλέφωνο</h2>
        <p className="mt-2 text-sm text-muted">
          Χρησιμοποιείται για κλήσεις και ως προεπιλογή για WhatsApp/Viber. Η επιβεβαίωση με SMS
          αποδεικνύει ότι ο αριθμός είναι δικός σου.
        </p>
        <div className="mt-5 rounded-xl border border-border bg-white p-5">
          <label className="block">
            <span className="text-xs text-muted uppercase">Αριθμός (+30)</span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="69xxxxxxxx"
              className="mt-1 w-full rounded-xl border border-border bg-sand/40 px-4 py-3 text-sm text-charcoal outline-none focus:border-gold/50"
            />
          </label>
          <PhoneSmsVerification phone={phone} profile={profile} />
        </div>
      </section>

      <section>
        <h2 className="font-display text-lg font-semibold text-charcoal">
          WhatsApp και Viber
        </h2>
        <form onSubmit={savePrefs} className="mt-5 space-y-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="allow_whatsapp"
              defaultChecked={profile.allow_whatsapp === true}
              className="accent-gold"
            />
            Εμφάνιση WhatsApp στις αγγελίες
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={whatsappUsePrimary}
              onChange={(e) => setWhatsappUsePrimary(e.target.checked)}
              className="accent-gold"
            />
            Χρήση βασικού τηλεφώνου για WhatsApp
          </label>
          <input
            type="hidden"
            name="whatsapp_use_primary_phone"
            value={whatsappUsePrimary ? "on" : "off"}
          />

          <label className="flex items-center gap-2 text-sm pt-2">
            <input
              type="checkbox"
              name="allow_viber"
              defaultChecked={profile.allow_viber === true}
              className="accent-gold"
            />
            Εμφάνιση Viber στις αγγελίες
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={viberUsePrimary}
              onChange={(e) => setViberUsePrimary(e.target.checked)}
              className="accent-gold"
            />
            Χρήση βασικού τηλεφώνου για Viber
          </label>
          <input type="hidden" name="viber_use_primary_phone" value={viberUsePrimary ? "on" : "off"} />

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="allow_phone_contact"
              defaultChecked={profile.allow_phone_contact !== false}
              className="accent-gold"
            />
            Εμφάνιση τηλεφώνου για κλήσεις
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="allow_message"
              defaultChecked={profile.allow_message !== false}
              className="accent-gold"
            />
            Μηνύματα μέσω Midora
          </label>

          <button
            type="submit"
            disabled={prefsPending}
            className={cn(
              "rounded-xl bg-charcoal px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            )}
          >
            {prefsPending ? "Αποθήκευση…" : "Αποθήκευση προτιμήσεων"}
          </button>
          {prefsSaved && (
            <p className="text-sm text-teal">Οι αλλαγές αποθηκεύτηκαν.</p>
          )}
          {prefsError && <p className="text-sm text-red-600">{prefsError}</p>}
        </form>
      </section>

      <p className="text-xs text-muted">
        <Link href="/dashboard/settings" className="text-gold-dark hover:underline">
          ← Επιστροφή στις ρυθμίσεις
        </Link>
      </p>
    </div>
  );
}
