import { actionError, authActionError, mustSignInError } from "@/lib/action-error-i18n";
import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

export type PhoneVerificationPurpose = "primary" | "whatsapp" | "viber";

const MAX_SENDS_PER_HOUR = 3;
const MAX_FAILED_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 60_000;

type TwilioClient = {
  verify: {
    v2: {
      services: (sid: string) => {
        verifications: {
          create: (opts: { to: string; channel: string }) => Promise<unknown>;
        };
        verificationChecks: {
          create: (opts: { to: string; code: string }) => Promise<{ status: string }>;
        };
      };
    };
  };
};

function getTwilioConfig() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
  if (!accountSid || !authToken || !serviceSid) return null;
  return { accountSid, authToken, serviceSid };
}

async function getTwilio(): Promise<{ client: TwilioClient; serviceSid: string } | null> {
  const config = getTwilioConfig();
  if (!config) return null;
  const twilio = (await import("twilio")).default;
  return {
    client: twilio(config.accountSid, config.authToken) as TwilioClient,
    serviceSid: config.serviceSid,
  };
}

type SessionRow = {
  sends_this_hour: number;
  hour_window_start: string | null;
  failed_attempts: number;
  last_sent_at: string | null;
  phone_e164: string;
};

async function getSession(
  supabase: SupabaseClient,
  userId: string,
  purpose: PhoneVerificationPurpose
): Promise<SessionRow | null> {
  const { data } = await supabase
    .from("phone_verification_sessions")
    .select("sends_this_hour, hour_window_start, failed_attempts, last_sent_at, phone_e164")
    .eq("user_id", userId)
    .eq("purpose", purpose)
    .maybeSingle();
  return data;
}

function hourWindowExpired(start: string | null): boolean {
  if (!start) return true;
  return Date.now() - new Date(start).getTime() > 60 * 60 * 1000;
}

export async function sendPhoneVerificationOtp(
  supabase: SupabaseClient,
  userId: string,
  phoneE164: string,
  purpose: PhoneVerificationPurpose
): Promise<{ ok: true } | { error: string }> {
  const twilio = await getTwilio();
  if (!twilio) {
    return {
      error: await actionError("smsUnavailable"),
    };
  }

  const session = await getSession(supabase, userId, purpose);
  const now = new Date();

  if (session?.last_sent_at) {
    const elapsed = now.getTime() - new Date(session.last_sent_at).getTime();
    if (elapsed < RESEND_COOLDOWN_MS) {
      const waitSec = Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000);
      return { error: await actionError("smsResendWait", { seconds: waitSec }) };
    }
  }

  let sendsThisHour = session?.sends_this_hour ?? 0;
  let hourStart = session?.hour_window_start ?? null;
  if (hourWindowExpired(hourStart)) {
    sendsThisHour = 0;
    hourStart = now.toISOString();
  }
  if (sendsThisHour >= MAX_SENDS_PER_HOUR) {
    return { error: await actionError("smsRateLimit") };
  }

  if ((session?.failed_attempts ?? 0) >= MAX_FAILED_ATTEMPTS) {
    return { error: await actionError("tooManyAttempts") };
  }

  try {
    await twilio.client.verify.v2.services(twilio.serviceSid).verifications.create({
      to: phoneE164,
      channel: "sms",
    });
  } catch {
    return { error: await actionError("smsSendFailed") };
  }

  await supabase.from("phone_verification_sessions").upsert(
    {
      user_id: userId,
      purpose,
      phone_e164: phoneE164,
      sends_this_hour: sendsThisHour + 1,
      hour_window_start: hourStart ?? now.toISOString(),
      last_sent_at: now.toISOString(),
      updated_at: now.toISOString(),
    },
    { onConflict: "user_id,purpose" }
  );

  await supabase
    .from("profiles")
    .update({ last_verification_sent_at: now.toISOString() })
    .eq("id", userId);

  return { ok: true };
}

export async function verifyPhoneVerificationOtp(
  supabase: SupabaseClient,
  userId: string,
  phoneE164: string,
  purpose: PhoneVerificationPurpose,
  code: string
): Promise<{ ok: true } | { error: string }> {
  const twilio = await getTwilio();
  if (!twilio) {
    return { error: await actionError("phoneVerifyUnavailable") };
  }

  const session = await getSession(supabase, userId, purpose);
  if (!session || session.phone_e164 !== phoneE164) {
    return { error: await actionError("sendCodeFirst") };
  }

  if ((session.failed_attempts ?? 0) >= MAX_FAILED_ATTEMPTS) {
    return { error: await actionError("tooManyAttempts") };
  }

  let status: string;
  try {
    const check = await twilio.client.verify.v2
      .services(twilio.serviceSid)
      .verificationChecks.create({ to: phoneE164, code: code.trim() });
    status = check.status;
  } catch {
    status = "failed";
  }

  if (status !== "approved") {
    const failed = (session.failed_attempts ?? 0) + 1;
    await supabase
      .from("phone_verification_sessions")
      .update({ failed_attempts: failed, updated_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("purpose", purpose);

    await supabase
      .from("profiles")
      .update({ verification_attempt_count: failed })
      .eq("id", userId);

    return { error: await actionError("wrongOrExpiredCode") };
  }

  const now = new Date().toISOString();
  const profilePatch: Record<string, string | number | null> = {
    verification_attempt_count: 0,
  };

  if (purpose === "primary") {
    profilePatch.phone = phoneE164;
    profilePatch.primary_phone_verified_at = now;
  } else if (purpose === "whatsapp") {
    profilePatch.whatsapp_phone = phoneE164;
    profilePatch.whatsapp_phone_verified_at = now;
  } else {
    profilePatch.viber_phone = phoneE164;
    profilePatch.viber_phone_verified_at = now;
  }

  await supabase.from("profiles").update(profilePatch).eq("id", userId);

  await supabase
    .from("phone_verification_sessions")
    .update({ failed_attempts: 0, updated_at: now })
    .eq("user_id", userId)
    .eq("purpose", purpose);

  return { ok: true };
}

export function isPhoneVerifiedAt(
  verifiedAt: string | null | undefined,
  phone: string | null | undefined,
  expectedE164: string | null
): boolean {
  if (!verifiedAt || !phone?.trim() || !expectedE164) return false;
  const normalized = phone.replace(/\s/g, "");
  return normalized === expectedE164 || normalized === expectedE164.replace("+", "");
}
