import Link from "next/link";
import { getAdminUnavailablePeriods } from "@/lib/admin/queries";
import { AdminUnavailableDelete } from "@/components/admin/AdminQuickActions";

export default async function AdminAvailabilityPage() {
  const periods = await getAdminUnavailablePeriods();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-charcoal">Διαθεσιμότητα</h1>
        <p className="mt-1 text-sm text-muted">Μη διαθέσιμες περίοδοι αγγελιών (όχι κρατήσεις)</p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-white">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="border-b border-border bg-sand/40 text-xs uppercase text-muted">
            <tr>
              <th className="px-3 py-3">Αγγελία</th>
              <th className="px-3 py-3">Αγγελιοδότης</th>
              <th className="px-3 py-3">Από</th>
              <th className="px-3 py-3">Έως</th>
              <th className="px-3 py-3">Λόγος</th>
              <th className="px-3 py-3">Δημιουργία</th>
              <th className="px-3 py-3">Ενέργειες</th>
            </tr>
          </thead>
          <tbody>
            {periods.map((period) => {
              const listing = period.listings as { id?: string; title?: string } | null;
              const owner = period.profiles as { full_name?: string } | null;
              return (
                <tr key={period.id} className="border-b border-border align-top">
                  <td className="px-3 py-3">
                    {listing?.id ? (
                      <Link href={`/admin/listings/${listing.id}`} className="text-gold hover:underline">
                        {listing.title}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-3 py-3 text-muted">{owner?.full_name ?? "—"}</td>
                  <td className="px-3 py-3">{period.start_date}</td>
                  <td className="px-3 py-3">{period.end_date}</td>
                  <td className="px-3 py-3 text-muted">{period.reason ?? "—"}</td>
                  <td className="px-3 py-3 text-xs text-muted">
                    {new Date(period.created_at).toLocaleDateString("el-GR")}
                  </td>
                  <td className="px-3 py-3">
                    <AdminUnavailableDelete periodId={period.id} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
