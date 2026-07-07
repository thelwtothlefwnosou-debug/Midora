import Link from "next/link";
import { getAdminListingReports } from "@/lib/admin/queries";
import { AdminListingReportActions } from "@/components/admin/AdminQuickActions";

const REASON_LABELS: Record<string, string> = {
  fake_listing: "Ψεύτικη αγγελία",
  wrong_details: "Λάθος στοιχεία",
  suspicious: "Ύποπτη συμπεριφορά",
  ama_issue: "Πρόβλημα με ΑΜΑ",
  other: "Άλλο",
};

export default async function AdminListingReportsPage() {
  const reports = await getAdminListingReports();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-charcoal">Αναφορές αγγελιών</h1>
        <p className="mt-1 text-sm text-muted">{reports.length} αναφορές</p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-white">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-border bg-sand/40 text-xs uppercase text-muted">
            <tr>
              <th className="px-3 py-3">Αγγελία</th>
              <th className="px-3 py-3">Αναφέρων</th>
              <th className="px-3 py-3">Λόγος</th>
              <th className="px-3 py-3">Μήνυμα</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Ημερομηνία</th>
              <th className="px-3 py-3">Ενέργειες</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => {
              const listing = report.listings as { id?: string; title?: string } | null;
              return (
                <tr key={report.id} className="border-b border-border align-top">
                  <td className="px-3 py-3">
                    {listing?.id ? (
                      <Link href={`/admin/listings/${listing.id}`} className="text-gold hover:underline">
                        {listing.title}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-3 py-3 text-muted">{report.reporter_email ?? "—"}</td>
                  <td className="px-3 py-3">
                    {REASON_LABELS[report.reason ?? ""] ?? report.reason ?? "—"}
                  </td>
                  <td className="px-3 py-3 max-w-xs text-xs text-muted">{report.description ?? "—"}</td>
                  <td className="px-3 py-3">{report.status}</td>
                  <td className="px-3 py-3 text-xs text-muted">
                    {new Date(report.created_at).toLocaleString("el-GR")}
                  </td>
                  <td className="px-3 py-3">
                    <AdminListingReportActions reportId={report.id} status={report.status} />
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
