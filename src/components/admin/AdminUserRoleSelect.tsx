"use client";

import { useTransition } from "react";
import { adminUpdateUserRole } from "@/lib/admin/actions";

const ROLES = [
  { value: "user", label: "user" },
  { value: "advertiser", label: "advertiser" },
  { value: "admin", label: "admin" },
] as const;

export function AdminUserRoleSelect({
  userId,
  currentRole,
}: {
  userId: string;
  currentRole: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <select
      disabled={pending}
      value={currentRole}
      onChange={(e) => {
        startTransition(async () => {
          await adminUpdateUserRole(userId, e.target.value);
        });
      }}
      className="rounded border border-border px-2 py-1 text-xs"
    >
      {ROLES.map((r) => (
        <option key={r.value} value={r.value}>
          {r.label}
        </option>
      ))}
    </select>
  );
}
