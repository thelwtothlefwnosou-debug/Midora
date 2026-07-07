import { getAdminBugReports } from "@/lib/admin/queries";
import { AdminBugReportActions } from "@/components/admin/AdminQuickActions";

const CATEGORY_LABELS: Record<string, string> = {
  search: "Αναζήτηση",
  listing: "Αγγελία",
  dashboard: "Dashboard",
  calendar: "Ημερολόγιο",
  photos: "Φωτογραφίες",
  contact: "Επικοινωνία",
  verification: "Επαλήθευση",
  account: "Λογαριασμός",
  other: "Άλλο",
};

export default async function AdminBugReportsPage() {
  const reports = await getAdminBugReports();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-charcoal">Αναφορές προβλημάτων</h1>
        <p className="mt-1 text-sm text-muted">{reports.length} αναφορές από χρήστες</p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-white">
        <table className="w-full min-w-[1000px] text-left text-sm">
          <thead className="border-b border-border bg-sand/40 text-xs uppercase text-muted">
            <tr>
              <th className="px-3 py-3">Ημερομηνία</th>
              <th className="px-3 py-3">Κατηγορία</th>
              <th className="px-3 py-3">Σελίδα</th>
              <th className="px-3 py-3">Χρήστης</th>
              <th className="px-3 py-3">Μήνυμα</th>
              <th className="px-3 py-3">Browser</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Ενέργειες</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => {
              const user = report.profiles as { full_name?: string } | null;
              const browser =
                report.browser_info && typeof report.browser_info === "object"
                  ? JSON.stringify(report.browser_info).slice(0, 80)
                  : "—";
              return (
                <tr key={report.id} className="border-b border-border align-top">
                  <td className="px-3 py-3 text-xs text-muted">
                    {new Date(report.created_at).toLocaleString("el-GR")}
                  </td>
                  <td className="px-3 py-3">
                    {CATEGORY_LABELS[report.category ?? ""] ?? report.category ?? "—"}
                  </td>
                  <td className="px-3 py-3 max-w-[120px] truncate text-xs text-muted">
                    {report.page_url ?? "—"}
                  </td>
                  <td className="px-3 py-3">{user?.full_name ?? "Ανώνυμος"}</td>
                  <td className="px-3 py-3 max-w-xs text-xs">{report.message}</td>
                  <td className="px-3 py-3 max-w-[100px] truncate text-xs text-muted">{browser}</td>
                  <td className="px-3 py-3">{report.status}</td>
                  <td className="px-3 py-3">
                    <AdminBugReportActions reportId={report.id} status={report.status} />
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
