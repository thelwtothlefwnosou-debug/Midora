import { promoteAdminFromEmail } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";

export async function requireAdmin() {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase δεν είναι ρυθμισμένο" as const };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Πρέπει να συνδεθείς" as const };

  await promoteAdminFromEmail(user.id, user.email);

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") return { error: "Δεν έχεις δικαίωμα" as const };
  return { supabase, user };
}
