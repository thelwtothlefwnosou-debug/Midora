"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { normalizePhoneToE164, isValidGreekMobileE164 } from "@/lib/phone-e164";
import {
  sendPhoneVerificationOtp,
  verifyPhoneVerificationOtp,
  type PhoneVerificationPurpose,
} from "@/lib/phone-verification";

async function requireUser() {
  const supabase = await createClient();
  if (!supabase) return { error: "Δεν ήταν δυνατή η σύνδεση." } as const;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Πρέπει να συνδεθείς." } as const;
  return { supabase, user } as const;
}

export async function sendPhoneOtp(purpose: PhoneVerificationPurpose, phone: string) {
  const auth = await requireUser();
  if ("error" in auth) return { error: auth.error };

  const e164 = normalizePhoneToE164(phone);
  if (!e164 || !isValidGreekMobileE164(e164)) {
    return { error: "Συμπλήρωσε έγκυρο κινητό τηλέφωνο (Ελλάδα)." };
  }

  return sendPhoneVerificationOtp(auth.supabase, auth.user.id, e164, purpose);
}

export async function verifyPhoneOtp(
  purpose: PhoneVerificationPurpose,
  phone: string,
  code: string
) {
  const auth = await requireUser();
  if ("error" in auth) return { error: auth.error };

  const e164 = normalizePhoneToE164(phone);
  if (!e164) return { error: "Μη έγκυρος αριθμός τηλεφώνου." };
  if (!/^\d{6}$/.test(code.trim())) {
    return { error: "Ο κωδικός πρέπει να είναι 6 ψηφία." };
  }

  const result = await verifyPhoneVerificationOtp(
    auth.supabase,
    auth.user.id,
    e164,
    purpose,
    code
  );
  if ("error" in result) return result;

  revalidatePath("/dashboard/settings/contact");
  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/verification");
  revalidatePath("/dashboard/listings/new");
  return { success: true };
}

export async function updateContactPreferences(formData: FormData) {
  const auth = await requireUser();
  if ("error" in auth) return { error: auth.error };

  const patch = {
    allow_phone_contact: formData.get("allow_phone_contact") === "on",
    allow_whatsapp: formData.get("allow_whatsapp") === "on",
    allow_viber: formData.get("allow_viber") === "on",
    allow_message: formData.get("allow_message") !== "off",
    whatsapp_use_primary_phone: formData.get("whatsapp_use_primary_phone") !== "off",
    viber_use_primary_phone: formData.get("viber_use_primary_phone") !== "off",
  };

  let { error } = await auth.supabase.from("profiles").update(patch).eq("id", auth.user.id);
  if (error?.message?.includes("allow_message")) {
    const { allow_message: _omit, ...withoutMessage } = patch;
    ({ error } = await auth.supabase
      .from("profiles")
      .update(withoutMessage)
      .eq("id", auth.user.id));
  }
  if (error) return { error: error.message };

  revalidatePath("/dashboard/settings/contact");
  return { success: true };
}
