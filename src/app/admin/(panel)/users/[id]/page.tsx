import { notFound } from "next/navigation";
import { getAdminUserById } from "@/lib/admin/queries";
import { AdminUserDetail } from "@/components/admin/AdminUserDetail";
import { avatarPublicUrl } from "@/lib/profile-avatar";
import { getSupabaseUrl } from "@/lib/supabase/config";
import type { Profile } from "@/lib/types";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getAdminUserById(id);
  if (!data) notFound();

  const { profile, listings, reportCount } = data;
  const avatarUrl =
    profile.avatar_path && profile.avatar_status === "active"
      ? avatarPublicUrl(getSupabaseUrl(), profile.avatar_path)
      : null;

  return (
    <AdminUserDetail
      profile={profile as Profile}
      listings={listings}
      reportCount={reportCount}
      avatarUrl={avatarUrl}
    />
  );
}
