"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { sendPhoneOtp, verifyPhoneOtp } from "@/lib/contact-actions";
import { formatPhoneForDisplay } from "@/lib/phone-e164";
import { isProfilePhoneVerified } from "@/lib/listing-contact";
import type { Profile } from "@/lib/types";

const inputClass =
  "mt-1 w-full rounded-xl border border-border bg-sand/40 px-4 py-3 text-sm text-charcoal outline-none focus:border-gold/50";

type PhoneVerificationPurpose = "primary" | "whatsapp" | "viber";

type Props = {
  phone: string;
  profile: Pick<Profile, "phone" | "primary_phone_verified_at">;
  purpose?: PhoneVerificationPurpose;
  compact?: boolean;
  onVerified?: () => void;
};

export function PhoneSmsVerification({
  phone,
  profile,
  purpose = "primary",
  compact = false,
  onVerified,
}: Props) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const verified = isProfilePhoneVerified(profile, phone);

  if (verified) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-teal/10 px-3 py-2.5 text-sm text-teal">
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        <span>
          Ο αριθμός επιβεβαιώθηκε ({formatPhoneForDisplay(profile.phone ?? phone)})
        </span>
      </div>
    );
  }

  function send() {
    setError(null);
    startTransition(async () => {
      const result = await sendPhoneOtp(purpose, phone);
      if ("error" in result && result.error) {
        setError(result.error);
        return;
      }
      setSent(true);
    });
  }

  function verify() {
    setError(null);
    startTransition(async () => {
      const result = await verifyPhoneOtp(purpose, phone, code);
      if ("error" in result && result.error) {
        setError(result.error);
        return;
      }
      setCode("");
      setSent(false);
      onVerified?.();
      router.refresh();
    });
  }

  return (
    <div className={compact ? "space-y-3" : "mt-4 space-y-3"}>
      {!compact && (
        <p className="text-xs leading-relaxed text-muted">
          Στείλε κωδικό SMS στο κινητό σου για να επιβεβαιώσουμε ότι ο αριθμός είναι δικός σου.
          Μόνο μετά εμφανίζεται δημόσια για κλήσεις.
        </p>
      )}
      {compact && (
        <p className="text-xs leading-relaxed text-amber-900">
          Για κλήσεις από την αγγελία, επιβεβαίωσε με SMS ότι ο αριθμός είναι δικός σου.
        </p>
      )}
      <button
        type="button"
        disabled={pending || !phone.trim()}
        onClick={send}
        className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Αποστολή..." : sent ? "Αποστολή ξανά κωδικού" : "Αποστολή κωδικού SMS"}
      </button>
      {sent && (
        <>
          <label className="block">
            <span className="text-xs text-muted uppercase">Κωδικός SMS (6 ψηφία)</span>
            <input
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className={inputClass}
            />
          </label>
          <button
            type="button"
            disabled={pending || code.length !== 6}
            onClick={verify}
            className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium hover:bg-sand/40 disabled:opacity-60"
          >
            Επιβεβαίωση κωδικού
          </button>
        </>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
