"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("Wizard.contact");
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
            {t("useProfile")}
          </span>
          <span className="mt-1 block text-xs text-muted">
            {t("useProfileHint")}
          </span>
        </span>
      </label>

      <label className="block">
        <span className="text-xs text-muted uppercase">{t("advertiserName")}</span>
        <input
          value={contactName}
          onChange={(e) => onContactNameChange(e.target.value)}
          className={inputClass}
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block">
            <span className="text-xs text-muted uppercase">{t("phone")}</span>
            <input
              type="tel"
              value={contactPhone}
              onChange={(e) => onContactPhoneChange(e.target.value)}
              placeholder={profile.phone?.trim() || t("phonePlaceholder")}
              className={inputClass}
            />
          </label>
          {contactPhone.trim() && !phoneValid && (
            <span className="mt-1 block text-[10px] text-red-600">
              {t("phoneInvalid")}
            </span>
          )}
          {phoneVerified && (
            <span className="mt-2 flex items-center gap-1.5 text-[11px] text-teal">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {t("phoneVerifiedLabel")}
            </span>
          )}
        </div>
        <label className="block">
          <span className="text-xs text-muted uppercase">{t("email")}</span>
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
          {t("smsComingSoon")}
        </p>
      )}

      <label className="block sm:max-w-xs">
        <span className="text-xs text-muted uppercase">{t("preferredMethod")}</span>
        <select
          value={preferredContact}
          onChange={(e) => onPreferredContactChange(e.target.value)}
          className={inputClass}
        >
          <option value="phone">{t("mobile")}</option>
          <option value="email">{t("email")}</option>
          <option value="message">{t("midoraMessage")}</option>
        </select>
      </label>

      <div className="space-y-3 rounded-xl border border-border p-4">
        <p className="text-sm font-semibold text-charcoal">{t("contactMethods")}</p>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={allowPhone}
            onChange={(e) => onAllowPhoneChange(e.target.checked)}
            className="accent-gold"
          />
          {t("showPhone")}
        </label>
        {!callsReady && allowPhone && REQUIRE_LISTING_PHONE_SMS_VERIFICATION && (
          <p className="text-xs text-amber-800">
            {t("smsRequiredForPublicPhone")}
          </p>
        )}
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={allowWhatsApp}
            onChange={(e) => onAllowWhatsAppChange(e.target.checked)}
            className="accent-gold"
          />
          {t("whatsapp")}
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={whatsappUsePrimary}
            onChange={(e) => onWhatsappUsePrimaryChange(e.target.checked)}
            className="accent-gold"
          />
          {t("useMainPhoneWhatsapp")}
        </label>
        {!whatsappUsePrimary && (
          <label className="block">
            <span className="text-xs text-muted uppercase">{t("differentPhoneWhatsapp")}</span>
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
          {t("viber")}
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={viberUsePrimary}
            onChange={(e) => onViberUsePrimaryChange(e.target.checked)}
            className="accent-gold"
          />
          {t("useMainPhoneViber")}
        </label>
        {!viberUsePrimary && (
          <label className="block">
            <span className="text-xs text-muted uppercase">{t("differentPhoneViber")}</span>
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
          {t("messagesViaMidora")}
        </label>
      </div>

      <p className="text-xs text-muted">
        {REQUIRE_LISTING_PHONE_SMS_VERIFICATION ? (
          <>{t("phonePublicAfterSms")} </>
        ) : (
          <>{t("saveDraftHint")} </>
        )}
        <Link href="/dashboard/settings/contact" className="text-gold-dark hover:underline">
          {t("contactSettings")}
        </Link>
      </p>
    </div>
  );
}
