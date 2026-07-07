import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getSupabaseUrl, isServiceRoleConfigured } from "@/lib/supabase/config";

/** Service role client — bypasses RLS. Server-only (webhooks, admin jobs). */
export function createServiceClient() {
  if (!isServiceRoleConfigured()) return null;

  try {
    return createSupabaseClient(
      getSupabaseUrl(),
      process.env.SUPABASE_SERVICE_ROLE_KEY!.trim().replace(/^["']|["']$/g, ""),
      {
        auth: { autoRefreshToken: false, persistSession: false },
      }
    );
  } catch (error) {
    console.error("[supabase] createServiceClient failed:", error);
    return null;
  }
}
