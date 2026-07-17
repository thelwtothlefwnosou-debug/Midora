import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
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

/** Core columns only — optional profile columns (email, referral_code, …) often absent. */
const PROFILE_SELECT_MINIMAL =
  "id, full_name, phone, role, created_at, display_name" as const;

const PROFILE_SELECT_CORE = "id, full_name, phone, role, created_at" as const;

function isMissingColumnError(message: string | undefined): boolean {
  const msg = message ?? "";
  return (
    msg.includes("does not exist") ||
    msg.includes("Could not find") ||
    msg.includes("column")
  );
}

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

async function loadProfileRow(
  client: SupabaseClient,
  userId: string
): Promise<Profile | null> {
  const full = await client.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (!full.error && full.data) return profileFromRow(full.data as Record<string, unknown>);

  const minimal = await client
    .from("profiles")
    .select(PROFILE_SELECT_MINIMAL)
    .eq("id", userId)
    .maybeSingle();
  if (!minimal.error && minimal.data) {
    return profileFromRow(minimal.data as Record<string, unknown>);
  }
  if (minimal.error && !isMissingColumnError(minimal.error.message)) {
    console.error("[getCurrentProfile] minimal select failed:", minimal.error.message);
  }

  const core = await client
    .from("profiles")
    .select(PROFILE_SELECT_CORE)
    .eq("id", userId)
    .maybeSingle();
  if (!core.error && core.data) {
    return profileFromRow(core.data as Record<string, unknown>);
  }
  if (core.error) {
    console.error("[getCurrentProfile] core select failed:", core.error.message);
  }

  return null;
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

  let profile = await loadProfileRow(supabase, user.id);
  if (profile) return profile;

  // RLS or race after bootstrap: retry once via service role (own row only).
  try {
    const { createServiceClient } = await import("@/lib/supabase/service");
    const service = createServiceClient();
    if (service) {
      profile = await loadProfileRow(service, user.id);
      if (profile) return profile;
    }
  } catch (err) {
    console.error("[getCurrentProfile] service fallback failed:", err);
  }

  return null;
}
