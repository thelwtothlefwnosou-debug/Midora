"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BadgeCheck } from "lucide-react";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { AdminUserRoleSelect } from "@/components/admin/AdminUserRoleSelect";
import {
  adminHideUserAvatar,
  adminRemoveUserAvatar,
} from "@/lib/profile-avatar-actions";
import { adminSuspendUser, adminUnsuspendUser } from "@/lib/admin/actions";
import type { Profile } from "@/lib/types";
import { cn } from "@/lib/utils";

type ListingRow = {
  id: string;
  title: string;
  city: string;
  area: string;
  status: string;
  approval_status?: string | null;
  created_at: string;
  is_hidden?: boolean | null;
};

export function AdminUserDetail({
  profile,
  listings,
  reportCount,
  avatarUrl,
}: {
  profile: Profile;
  listings: ListingRow[];
  reportCount: number;
  avatarUrl: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const isSuspended = profile.account_status === "suspended";

  function run(action: () => Promise<{ error?: string } | void>) {
    startTransition(async () => {
      setError(null);
      const result = await action();
      if (result && "error" in result && result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <ProfileAvatar profile={profile} imageUrl={avatarUrl} size="lg" className="h-16 w-16 text-lg" />
          <div>
            <h1 className="font-display text-2xl font-semibold text-charcoal">
              {profile.full_name ?? "—"}
            </h1>
            <p className="text-sm text-muted">{profile.email ?? "—"}</p>
            {profile.phone && <p className="text-sm text-muted">{profile.phone}</p>}
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              {profile.primary_phone_verified_at && (
                <span className="inline-flex items-center gap-1 text-teal">
                  <BadgeCheck className="h-4 w-4" />
                  Επαληθευμένο τηλέφωνο
                </span>
              )}
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-medium",
                  isSuspended ? "bg-red-100 text-red-700" : "bg-teal/10 text-teal"
                )}
              >
                {isSuspended ? "Αναστολή λογαριασμού" : "Ενεργός"}
              </span>
            </div>
          </div>
        </div>
        <Link href="/admin/users" className="text-sm text-muted hover:text-gold">
          ← Επιστροφή στη λίστα
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Αγγελίες" value={String(listings.length)} />
        <StatCard label="Αναφορές" value={String(reportCount)} />
        <StatCard
          label="Εγγραφή"
          value={new Date(profile.created_at).toLocaleDateString("el-GR")}
        />
      </div>

      <section className="rounded-xl border border-border bg-white p-5">
        <h2 className="font-display text-lg font-semibold text-charcoal">Διαχείριση λογαριασμού</h2>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="text-sm text-muted">Ρόλος:</span>
          <AdminUserRoleSelect userId={profile.id} currentRole={profile.role ?? "user"} />
          {isSuspended ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => adminUnsuspendUser(profile.id))}
              className="rounded-lg border border-teal/40 bg-teal/10 px-3 py-1.5 text-sm font-medium text-teal hover:bg-teal/15 disabled:opacity-50"
            >
              Άρση αναστολής
            </button>
          ) : (
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => adminSuspendUser(profile.id))}
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
            >
              Αναστολή λογαριασμού
            </button>
          )}
        </div>
      </section>

      {profile.avatar_path && (
        <section className="rounded-xl border border-border bg-white p-5">
          <h2 className="font-display text-lg font-semibold text-charcoal">Φωτογραφία προφίλ</h2>
          <p className="mt-1 text-sm text-muted">
            Κατάσταση: {profile.avatar_status ?? "active"}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {profile.avatar_status !== "hidden_by_admin" && (
              <button
                type="button"
                disabled={pending}
                onClick={() => run(() => adminHideUserAvatar(profile.id))}
                className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-sm text-amber-900 hover:bg-amber-100 disabled:opacity-50"
              >
                Απόκρυψη φωτογραφίας
              </button>
            )}
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => adminRemoveUserAvatar(profile.id))}
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm text-red-700 hover:bg-red-100 disabled:opacity-50"
            >
              Αφαίρεση φωτογραφίας
            </button>
          </div>
        </section>
      )}

      <section className="rounded-xl border border-border bg-white p-5">
        <h2 className="font-display text-lg font-semibold text-charcoal">Αγγελίες</h2>
        {listings.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Δεν υπάρχουν αγγελίες.</p>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {listings.map((listing) => (
              <li key={listing.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-medium text-charcoal">{listing.title}</p>
                  <p className="text-sm text-muted">
                    {listing.area}, {listing.city} · {listing.approval_status ?? listing.status}
                    {listing.is_hidden ? " (κρυφή)" : ""}
                  </p>
                </div>
                <Link
                  href={`/admin/listings/${listing.id}`}
                  className="text-sm font-medium text-gold hover:underline"
                >
                  Έλεγχος
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-white p-4">
      <p className="text-xs uppercase text-muted">{label}</p>
      <p className="mt-1 text-xl font-semibold text-charcoal">{value}</p>
    </div>
  );
}
