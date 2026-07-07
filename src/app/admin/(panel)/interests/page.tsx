import Link from "next/link";
import { getAdminLeads } from "@/lib/admin/queries";
import { AdminLeadActions } from "@/components/admin/AdminQuickActions";

const STATUS_LABELS: Record<string, string> = {
  new: "Νέο",
  read: "Αναγνωσμένο",
  replied: "Απαντήθηκε",
  archived: "Αρχειοθετημένο",
};

export default async function AdminInterestsPage() {
  const leads = await getAdminLeads();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-charcoal">Ενδιαφέροντα</h1>
        <p className="mt-1 text-sm text-muted">Μηνύματα ενδιαφέροντος από επισκέπτες</p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-white">
        <table className="w-full min-w-[1100px] text-left text-sm">
          <thead className="border-b border-border bg-sand/40 text-xs uppercase text-muted">
            <tr>
              <th className="px-3 py-3">Ημερομηνία</th>
              <th className="px-3 py-3">Αγγελία</th>
              <th className="px-3 py-3">Αγγελιοδότης</th>
              <th className="px-3 py-3">Ενδιαφερόμενος</th>
              <th className="px-3 py-3">Email</th>
              <th className="px-3 py-3">Τηλέφωνο</th>
              <th className="px-3 py-3">Περίοδος</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Ενέργειες</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => {
              const listing = lead.listings as { id?: string; title?: string; slug?: string } | null;
              const owner = lead.owner as { full_name?: string } | null;
              const period =
                lead.interest_start_date && lead.interest_end_date
                  ? `${lead.interest_start_date} – ${lead.interest_end_date}`
                  : lead.interest_start_month
                    ? `Από ${lead.interest_start_month}`
                    : lead.duration ?? "—";

              return (
                <tr key={lead.id} className="border-b border-border align-top">
                  <td className="px-3 py-3 text-xs text-muted">
                    {new Date(lead.created_at).toLocaleString("el-GR")}
                  </td>
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
                  <td className="px-3 py-3">{lead.name}</td>
                  <td className="px-3 py-3 text-muted">{lead.email ?? "—"}</td>
                  <td className="px-3 py-3 text-muted">{lead.phone ?? "—"}</td>
                  <td className="px-3 py-3 text-xs">{period}</td>
                  <td className="px-3 py-3">{STATUS_LABELS[lead.status] ?? lead.status}</td>
                  <td className="px-3 py-3">
                    <AdminLeadActions leadId={lead.id} status={lead.status} />
                    {lead.message && (
                      <p className="mt-2 max-w-xs text-xs text-muted line-clamp-2">{lead.message}</p>
                    )}
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
