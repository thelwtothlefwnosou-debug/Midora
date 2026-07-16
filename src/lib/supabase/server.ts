import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  getSupabaseAnonKey,
  getSupabaseUrl,
  isSupabaseConfigured,
} from "@/lib/supabase/config";
import { bootstrapAuthProfile } from "@/lib/profile-bootstrap";
import { resolveAuthProfileName } from "@/lib/auth-profile-name";
import type { Profile } from "@/lib/types";

export { isSupabaseConfigured, isServiceRoleConfigured } from "@/lib/supabase/config";

const PROFILE_SELECT_MINIMAL =
  "id, full_name, phone, role, created_at, email, referral_code, display_name, public_slug, public_profile_enabled" as const;

function profileFromRow(row: Record<string, unknown>): Profile {
  return {
    ...row,
    id: String(row.id),
    full_name: String(row.full_name ?? "Χρήστης"),
    phone: String(row.phone ?? ""),
    role: (row.role as Profile["role"]) ?? "user",
    created_at: String(row.created_at ?? new Date().toISOString()),
  } as Profile;
}

export async function createClient() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const cookieStore = await cookies();

  try {
    return createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from Server Component — ignore
          }
        },
      },
    });
  } catch (error) {
    console.error("[supabase] createClient failed:", error);
    return null;
  }
}

export async function getCurrentProfile() {
  const supabase = await createClient();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { promoteAdminFromEmail } = await import("@/lib/admin/auth");
  await promoteAdminFromEmail(user.id, user.email);

  const meta = user.user_metadata ?? {};
  await bootstrapAuthProfile(supabase, {
    userId: user.id,
    fullName: resolveAuthProfileName({
      email: user.email,
      userMetadata: meta,
      identities: user.identities,
    }),
    email: user.email ?? null,
    phone: typeof meta.phone === "string" ? meta.phone : undefined,
    displayName: typeof meta.display_name === "string" ? meta.display_name : null,
    auth: {
      email: user.email,
      userMetadata: meta,
      identities: user.identities,
    },
  });

  const full = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!full.error && full.data) return profileFromRow(full.data as Record<string, unknown>);

  const minimal = await supabase
    .from("profiles")
    .select(PROFILE_SELECT_MINIMAL)
    .eq("id", user.id)
    .single();

  if (!minimal.error && minimal.data) {
    return profileFromRow(minimal.data as Record<string, unknown>);
  }

  return null;
}
