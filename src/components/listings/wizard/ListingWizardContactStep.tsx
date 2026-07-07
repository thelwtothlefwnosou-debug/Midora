"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import type { Profile } from "@/lib/types";
import { REQUIRE_LISTING_PHONE_SMS_VERIFICATION } from "@/lib/constants";
import {
  hasCallablePhone,
  isProfilePhoneVerified,
  listingPhoneReadyForCalls,
} from "@/lib/listing-contact";
import { PhoneSmsVerification } from "@/components/contact/PhoneSmsVerification";
import { cn } from "@/lib/utils";

const inputClass =
  "mt-1 w-full rounded-xl border border-border bg-sand/40 px-4 py-3 text-sm text-charcoal outline-none focus:border-gold/50";

type Props = {
  profile: Profile;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  preferredContact: string;
  useProfileContact: boolean;
  allowPhone: boolean;
  allowWhatsApp: boolean;
  allowViber: boolean;
  allowMessage: boolean;
  whatsappUsePrimary: boolean;
  viberUsePrimary: boolean;
  contactWhatsappPhone: string;
  contactViberPhone: string;
  onContactNameChange: (v: string) => void;
  onContactPhoneChange: (v: string) => void;
  onContactEmailChange: (v: string) => void;
  onPreferredContactChange: (v: string) => void;
  onUseProfileContactChange: (v: boolean) => void;
  onAllowPhoneChange: (v: boolean) => void;
  onAllowWhatsAppChange: (v: boolean) => void;
  onAllowViberChange: (v: boolean) => void;
  onAllowMessageChange: (v: boolean) => void;
  onWhatsappUsePrimaryChange: (v: boolean) => void;
  onViberUsePrimaryChange: (v: boolean) => void;
  onContactWhatsappPhoneChange: (v: string) => void;
  onContactViberPhoneChange: (v: string) => void;
};

export function ListingWizardContactStep({
  profile,
  contactName,
  contactPhone,
  contactEmail,
  preferredContact,
  useProfileContact,
  allowPhone,
  allowWhatsApp,
  allowViber,
  allowMessage,
  whatsappUsePrimary,
  viberUsePrimary,
  contactWhatsappPhone,
  contactViberPhone,
  onContactNameChange,
  onContactPhoneChange,
  onContactEmailChange,
  onPreferredContactChange,
  onUseProfileContactChange,
  onAllowPhoneChange,
  onAllowWhatsAppChange,
  onAllowViberChange,
  onAllowMessageChange,
  onWhatsappUsePrimaryChange,
  onViberUsePrimaryChange,
  onContactWhatsappPhoneChange,
  onContactViberPhoneChange,
}: Props) {
  const phoneValid = hasCallablePhone(contactPhone);
  const phoneVerified = isProfilePhoneVerified(profile, contactPhone);
  const callsReady = listingPhoneReadyForCalls(contactPhone, allowPhone, profile);

  function handleUseProfileChange(checked: boolean) {
    onUseProfileContactChange(checked);
    if (checked && profile.phone?.trim() && !contactPhone.trim()) {
      onContactPhoneChange(profile.phone.trim());
    }
  }

  return (
    <div className="space-y-5">
      <label className="flex items-start gap-3 rounded-xl border border-border bg-sand/20 p-4 text-sm">
        <input
          type="checkbox"
          checked={useProfileContact}
          onChange={(e) => handleUseProfileChange(e.target.checked)}
          className="mt-1 accent-gold"
        />
        <span>
          <span className="font-semibold text-charcoal">
            Χρήση στοιχείων επικοινωνίας του προφίλ μου
          </span>
          <span className="mt-1 block text-xs text-muted">
            Συμπληρώνει αυτόματα το τηλέφωνο από τις ρυθμίσεις του προφίλ σου, αν υπάρχει.
          </span>
        </span>
      </label>

      <label className="block">
        <span className="text-xs text-muted uppercase">Όνομα αγγελιοδότη *</span>
        <input
          value={contactName}
          onChange={(e) => onContactNameChange(e.target.value)}
          className={inputClass}
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block">
            <span className="text-xs text-muted uppercase">Τηλέφωνο / κινητό (+30)</span>
            <input
              type="tel"
              value={contactPhone}
              onChange={(e) => onContactPhoneChange(e.target.value)}
              placeholder={profile.phone?.trim() || "69xxxxxxxx"}
              className={inputClass}
            />
          </label>
          {contactPhone.trim() && !phoneValid && (
            <span className="mt-1 block text-[10px] text-red-600">
              Συμπλήρωσε έγκυρο κινητό (π.χ. 694xxxxxxx).
            </span>
          )}
          {phoneVerified && (
            <span className="mt-2 flex items-center gap-1.5 text-[11px] text-teal">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Επιβεβαιωμένος αριθμός
            </span>
          )}
        </div>
        <label className="block">
          <span className="text-xs text-muted uppercase">Email</span>
          <input
            type="email"
            value={contactEmail}
            onChange={(e) => onContactEmailChange(e.target.value)}
            className={inputClass}
          />
        </label>
      </div>

      {REQUIRE_LISTING_PHONE_SMS_VERIFICATION &&
        allowPhone &&
        phoneValid &&
        !phoneVerified && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4">
          <PhoneSmsVerification phone={contactPhone} profile={profile} compact />
        </div>
      )}

      {!REQUIRE_LISTING_PHONE_SMS_VERIFICATION && allowPhone && phoneValid && (
        <p className="rounded-xl border border-border bg-sand/20 px-4 py-3 text-xs text-muted">
          Η επιβεβαίωση SMS για κλήσεις θα ενεργοποιηθεί σύντομα. Μπορείς να συνεχίσεις και να
          ολοκληρώσεις την αγγελία τώρα.
        </p>
      )}

      <label className="block sm:max-w-xs">
        <span className="text-xs text-muted uppercase">Προτιμώμενος τρόπος</span>
        <select
          value={preferredContact}
          onChange={(e) => onPreferredContactChange(e.target.value)}
          className={inputClass}
        >
          <option value="phone">Κινητό</option>
          <option value="email">Email</option>
          <option value="message">Μήνυμα μέσω Midora</option>
        </select>
      </label>

      <div className="space-y-3 rounded-xl border border-border p-4">
        <p className="text-sm font-semibold text-charcoal">Τρόποι επικοινωνίας στην αγγελία</p>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={allowPhone}
            onChange={(e) => onAllowPhoneChange(e.target.checked)}
            className="accent-gold"
          />
          Εμφάνιση τηλεφώνου για κλήσεις
        </label>
        {!callsReady && allowPhone && REQUIRE_LISTING_PHONE_SMS_VERIFICATION && (
          <p className="text-xs text-amber-800">
            Απαιτείται επιβεβαίωση SMS για να εμφανίζεται δημόσια το τηλέφωνο.
          </p>
        )}
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={allowWhatsApp}
            onChange={(e) => onAllowWhatsAppChange(e.target.checked)}
            className="accent-gold"
          />
          WhatsApp
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={whatsappUsePrimary}
            onChange={(e) => onWhatsappUsePrimaryChange(e.target.checked)}
            className="accent-gold"
          />
          Χρήση βασικού τηλεφώνου για WhatsApp
        </label>
        {!whatsappUsePrimary && (
          <label className="block">
            <span className="text-xs text-muted uppercase">Διαφορετικό τηλέφωνο WhatsApp</span>
            <input
              type="tel"
              value={contactWhatsappPhone}
              onChange={(e) => onContactWhatsappPhoneChange(e.target.value)}
              className={inputClass}
            />
          </label>
        )}
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={allowViber}
            onChange={(e) => onAllowViberChange(e.target.checked)}
            className="accent-gold"
          />
          Viber
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={viberUsePrimary}
            onChange={(e) => onViberUsePrimaryChange(e.target.checked)}
            className="accent-gold"
          />
          Χρήση βασικού τηλεφώνου για Viber
        </label>
        {!viberUsePrimary && (
          <label className="block">
            <span className="text-xs text-muted uppercase">Διαφορετικό τηλέφωνο Viber</span>
            <input
              type="tel"
              value={contactViberPhone}
              onChange={(e) => onContactViberPhoneChange(e.target.value)}
              className={inputClass}
            />
          </label>
        )}
        <label className={cn("flex items-center gap-2 text-sm", useProfileContact && "opacity-70")}>
          <input
            type="checkbox"
            checked={allowMessage}
            disabled={useProfileContact}
            onChange={(e) => onAllowMessageChange(e.target.checked)}
            className="accent-gold"
          />
          Μηνύματα μέσω Midora
        </label>
      </div>

      <p className="text-xs text-muted">
        {REQUIRE_LISTING_PHONE_SMS_VERIFICATION ? (
          <>
            Το τηλέφωνο εμφανίζεται δημόσια μόνο αφού επιβεβαιωθεί με SMS.{" "}
          </>
        ) : (
          <>Μπορείς να αποθηκεύσεις πρόχειρη αγγελία και να την ολοκληρώσεις αργότερα. </>
        )}
        <Link href="/dashboard/settings/contact" className="text-gold-dark hover:underline">
          Ρυθμίσεις επικοινωνίας
        </Link>
      </p>
    </div>
  );
}
