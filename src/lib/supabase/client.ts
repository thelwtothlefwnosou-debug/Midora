import { createBrowserClient } from "@supabase/ssr";
import {
  getSupabaseAnonKey,
  getSupabaseUrl,
  isSupabaseConfigured,
} from "@/lib/supabase/config";

export { isSupabaseConfigured } from "@/lib/supabase/config";

export function createClient() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured");
  }

  try {
    return createBrowserClient(getSupabaseUrl(), getSupabaseAnonKey());
  } catch (error) {
    console.error("[supabase] browser createClient failed:", error);
    throw new Error("Supabase is not configured");
  }
}
