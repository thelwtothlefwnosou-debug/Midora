import { getAdminPayments } from "@/lib/admin/queries";

export default async function AdminSubscriptionsPage() {
  const payments = await getAdminPayments();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-charcoal">Συνδρομές προβολής</h1>
        <p className="mt-1 text-sm text-muted">
          Πακέτα προβολής αγγελιών — ενεργή προβολή στην πλατφόρμα
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-white">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="border-b border-border bg-sand/40 text-xs uppercase text-muted">
            <tr>
              <th className="px-3 py-3">Χρήστης</th>
              <th className="px-3 py-3">Αγγελία</th>
              <th className="px-3 py-3">Πακέτο προβολής</th>
              <th className="px-3 py-3">Ποσό</th>
              <th className="px-3 py-3">Κατάσταση</th>
              <th className="px-3 py-3">Ημερομηνία</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted">
                  Δεν υπάρχουν συνδρομές προβολής ακόμα.
                </td>
              </tr>
            ) : (
              payments.map((payment) => {
                const user = payment.profiles as { full_name?: string } | null;
                const listing = payment.listings as { title?: string } | null;
                return (
                  <tr key={payment.id} className="border-b border-border align-top">
                    <td className="px-3 py-3">{user?.full_name ?? "—"}</td>
                    <td className="px-3 py-3 text-muted">{listing?.title ?? "—"}</td>
                    <td className="px-3 py-3">Συνδρομή προβολής αγγελίας</td>
                    <td className="px-3 py-3">
                      {payment.amount_cents != null
                        ? `${(payment.amount_cents / 100).toFixed(2)} €`
                        : "—"}
                    </td>
                    <td className="px-3 py-3">{payment.status}</td>
                    <td className="px-3 py-3 text-xs text-muted">
                      {new Date(payment.created_at).toLocaleDateString("el-GR")}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
