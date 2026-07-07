import { redirect } from "next/navigation";
import { createClient, getCurrentProfile } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import type { Profile } from "@/lib/types";

export type UserRole = "user" | "advertiser" | "admin";

export function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS ?? "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return getAdminEmails().includes(email.trim().toLowerCase());
}

export async function promoteAdminFromEmail(userId: string, email: string | null | undefined) {
  if (!isAdminEmail(email)) return;
  const db = createServiceClient();
  if (!db) return;
  await db.from("profiles").update({ role: "admin", email: email ?? null }).eq("id", userId);
}

export async function isAdmin(userId: string): Promise<boolean> {
  const db = createServiceClient() ?? (await createClient());
  if (!db) return false;
  const { data } = await db.from("profiles").select("role").eq("id", userId).maybeSingle();
  return data?.role === "admin";
}

export async function requireAdminContext(redirectPath = "/admin"): Promise<{
  profile: Profile;
  email: string;
  userId: string;
}> {
  const supabase = await createClient();
  if (!supabase) redirect("/login?redirect=" + encodeURIComponent(redirectPath));

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=" + encodeURIComponent(redirectPath));

  await promoteAdminFromEmail(user.id, user.email);

  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") {
    redirect("/admin/forbidden");
  }

  return {
    profile: profile as Profile,
    email: user.email ?? "",
    userId: user.id,
  };
}
