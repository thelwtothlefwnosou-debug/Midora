import Link from "next/link";
import { BadgeCheck, ChevronRight } from "lucide-react";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { avatarPublicUrl } from "@/lib/profile-avatar";
import { getSupabaseUrl } from "@/lib/supabase/config";
import { cn } from "@/lib/utils";

export type AdminUserRowData = {
  id: string;
  full_name: string | null;
  /** Auth email is on auth.users; profiles.email is optional / often absent. */
  email?: string | null;
  phone: string | null;
  role: string | null;
  created_at: string;
  avatar_path?: string | null;
  avatar_status?: string | null;
  primary_phone_verified_at?: string | null;
  account_status?: string | null;
  listingCount: number;
  newLeads: number;
  reportCount: number;
};

export function AdminUserRow({ user }: { user: AdminUserRowData }) {
  const avatarUrl =
    user.avatar_path && user.avatar_status === "active"
      ? avatarPublicUrl(getSupabaseUrl(), user.avatar_path)
      : null;
  const isSuspended = user.account_status === "suspended";

  return (
    <Link
      href={`/admin/users/${user.id}`}
      className={cn(
        "group flex flex-col gap-4 rounded-xl border border-border bg-white p-4 shadow-soft transition hover:border-gold/30 sm:flex-row sm:items-center",
        isSuspended && "border-red-200/60 bg-red-50/20"
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <ProfileAvatar
          profile={{ full_name: user.full_name, email: user.email, avatar_path: user.avatar_path }}
          imageUrl={avatarUrl}
          size="md"
        />
        <div className="min-w-0">
          <p className="truncate font-medium text-charcoal">{user.full_name ?? "—"}</p>
          <p className="truncate text-sm text-muted">{user.email ?? "—"}</p>
          {user.phone && <p className="truncate text-xs text-muted">{user.phone}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
        <div>
          <p className="text-xs text-muted">Τηλέφωνο</p>
          <p className="flex items-center gap-1 font-medium text-charcoal">
            {user.primary_phone_verified_at ? (
              <>
                <BadgeCheck className="h-3.5 w-3.5 text-teal" />
                Επαληθευμένο
              </>
            ) : (
              "—"
            )}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted">Εγγραφή</p>
          <p className="font-medium text-charcoal">
            {new Date(user.created_at).toLocaleDateString("el-GR")}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted">Αγγελίες</p>
          <p className="font-medium text-charcoal">{user.listingCount}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Αναφορές</p>
          <p className="font-medium text-charcoal">{user.reportCount}</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
        <span
          className={cn(
            "rounded-full px-2.5 py-0.5 text-xs font-medium",
            isSuspended
              ? "bg-red-100 text-red-700"
              : "bg-teal/10 text-teal"
          )}
        >
          {isSuspended ? "Αναστολή" : "Ενεργός"}
        </span>
        <ChevronRight className="h-4 w-4 text-muted group-hover:text-gold" />
      </div>
    </Link>
  );
}
