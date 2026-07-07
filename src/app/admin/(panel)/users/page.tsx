import { getAdminUsers } from "@/lib/admin/queries";
import { AdminUserRow } from "@/components/admin/AdminUserRow";

export default async function AdminUsersPage() {
  const users = await getAdminUsers();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-charcoal">Χρήστες</h1>
        <p className="mt-1 text-sm text-muted">{users.length} χρήστες</p>
      </div>

      <div className="space-y-3">
        {users.map((user) => (
          <AdminUserRow key={user.id} user={user} />
        ))}
      </div>
    </div>
  );
}
