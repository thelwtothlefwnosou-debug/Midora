import { redirect } from "next/navigation";
import { getCurrentProfile, createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export type DashboardContext = {
  profile: Profile;
  email: string;
};

export async function requireDashboardContext(
  redirectPath?: string
): Promise<DashboardContext> {
  const profile = await getCurrentProfile();
  if (!profile) {
    const target = redirectPath
      ? `/login?redirect=${encodeURIComponent(redirectPath)}`
      : "/login";
    redirect(target);
  }

  const supabase = await createClient();
  const email = (await supabase?.auth.getUser())?.data.user?.email ?? "";

  return { profile, email };
}
