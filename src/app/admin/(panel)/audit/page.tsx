import Link from "next/link";
import { getAdminAuditLogs } from "@/lib/admin/queries";
import type { AdminAuditAction } from "@/lib/admin/audit";

const ACTION_LABELS: Record<string, string> = {
  listing_opened_for_review: "Άνοιγμα αγγελίας για έλεγχο",
  listing_approved: "Έγκριση αγγελίας",
  listing_rejected: "Απόρριψη αγγελίας",
  listing_needs_changes: "Απαίτηση αλλαγών",
  listing_changes_requested: "Αίτημα αλλαγών",
  listing_hidden: "Απόκρυψη αγγελίας",
  listing_restored: "Επαναφορά αγγελίας",
  registry_reviewed: "Έλεγχος ΑΜΑ/ΕΣΛ/ΜΑΓ",
  listing_location_approved: "Έγκριση τοποθεσίας",
  user_role_changed: "Αλλαγή ρόλου χρήστη",
  report_resolved: "Επίλυση αναφοράς",
  report_dismissed: "Απόρριψη αναφοράς",
  report_reviewing: "Έλεγχος αναφοράς",
  bug_report_fixed: "Διόρθωση αναφοράς προβλήματος",
  verification_approved: "Έγκριση επαλήθευσης",
  verification_rejected: "Απόρριψη επαλήθευσης",
  unavailable_period_deleted: "Διαγραφή μη διαθέσιμης περιόδου",
  subscription_updated: "Ενημέρωση συνδρομής",
  admin_setting_updated: "Ενημέρωση ρύθμισης",
  lead_archived: "Αρχειοθέτηση ενδιαφέροντος",
  lead_marked_read: "Ανάγνωση ενδιαφέροντος",
};

const ENTITY_TYPE_LABELS: Record<string, string> = {
  listing: "Αγγελία",
  user: "Χρήστης",
  report: "Αναφορά",
  bug_report: "Αναφορά προβλήματος",
  lead: "Ενδιαφέρον",
  setting: "Ρύθμιση",
};

const ACTION_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Όλες οι ενέργειες" },
  ...Object.entries(ACTION_LABELS).map(([value, label]) => ({ value, label })),
];

const ENTITY_OPTIONS = [
  { value: "", label: "Όλοι οι τύποι" },
  ...Object.entries(ENTITY_TYPE_LABELS).map(([value, label]) => ({ value, label })),
];

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; entityType?: string; search?: string }>;
}) {
  const params = await searchParams;
  const logs = await getAdminAuditLogs(100, {
    action: params.action,
    entityType: params.entityType,
    search: params.search,
  });

  function buildHref(overrides: Record<string, string | undefined>) {
    const q = new URLSearchParams();
    const merged = { ...params, ...overrides };
    for (const [k, v] of Object.entries(merged)) {
      if (v) q.set(k, v);
    }
    const s = q.toString();
    return s ? `/admin/audit?${s}` : "/admin/audit";
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-charcoal">Audit log</h1>
        <p className="mt-1 text-sm text-muted">
          Πλήρες ιστορικό ενεργειών διαχειριστών · {logs.length} εγγραφές
        </p>
      </div>

      <form className="flex flex-wrap gap-3 rounded-2xl border border-border bg-white p-4 shadow-soft">
        <input
          name="search"
          defaultValue={params.search}
          placeholder="Αναζήτηση ενέργειας, διαχειριστή, entity…"
          className="min-w-[200px] flex-1 rounded-lg border border-border px-3 py-2 text-sm"
        />
        <select
          name="action"
          defaultValue={params.action ?? ""}
          className="rounded-lg border border-border px-3 py-2 text-sm"
        >
          {ACTION_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          name="entityType"
          defaultValue={params.entityType ?? ""}
          className="rounded-lg border border-border px-3 py-2 text-sm"
        >
          {ENTITY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-lg bg-charcoal px-4 py-2 text-sm text-white">
          Φίλτρο
        </button>
        {(params.action || params.entityType || params.search) && (
          <Link
            href="/admin/audit"
            className="inline-flex items-center rounded-lg border border-border px-4 py-2 text-sm text-muted hover:text-charcoal"
          >
            Καθαρισμός
          </Link>
        )}
      </form>

      <div className="overflow-x-auto rounded-2xl border border-border bg-white shadow-soft">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-border bg-sand/40 text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3">Ενέργεια</th>
              <th className="px-4 py-3">Διαχειριστής</th>
              <th className="px-4 py-3">Οντότητα</th>
              <th className="px-4 py-3">Λεπτομέρειες</th>
              <th className="px-4 py-3">Ημερομηνία</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-muted">
                  Δεν βρέθηκαν εγγραφές audit log.
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const admin = log.profiles as { full_name?: string; email?: string } | null;
                const actionKey = log.action as AdminAuditAction;
                const metadata =
                  log.metadata && typeof log.metadata === "object"
                    ? (log.metadata as Record<string, unknown>)
                    : null;

                return (
                  <tr key={log.id} className="border-b border-border align-top">
                    <td className="px-4 py-3 font-medium text-charcoal">
                      {ACTION_LABELS[actionKey] ?? log.action}
                    </td>
                    <td className="px-4 py-3">
                      <p>{admin?.full_name ?? "—"}</p>
                      {admin?.email && (
                        <p className="text-xs text-muted">{admin.email}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {log.entity_type ? (
                        <>
                          <span className="block text-xs font-medium text-charcoal">
                            {ENTITY_TYPE_LABELS[log.entity_type] ?? log.entity_type}
                          </span>
                          {log.entity_id && (
                            <span className="font-mono text-[10px]">
                              {log.entity_id.slice(0, 8)}…
                            </span>
                          )}
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="max-w-[240px] px-4 py-3 text-xs text-muted">
                      {metadata ? (
                        <pre className="whitespace-pre-wrap break-words font-sans">
                          {JSON.stringify(metadata, null, 0).slice(0, 120)}
                          {JSON.stringify(metadata).length > 120 ? "…" : ""}
                        </pre>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString("el-GR")}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-2 text-xs text-muted">
        <span>Γρήγορα φίλτρα:</span>
        <Link href={buildHref({ action: "listing_approved", entityType: undefined })} className="text-gold hover:underline">
          Εγκρίσεις
        </Link>
        <Link href={buildHref({ action: "listing_rejected", entityType: undefined })} className="text-gold hover:underline">
          Απορρίψεις
        </Link>
        <Link href={buildHref({ action: undefined, entityType: "listing" })} className="text-gold hover:underline">
          Αγγελίες
        </Link>
        <Link href={buildHref({ action: undefined, entityType: "user" })} className="text-gold hover:underline">
          Χρήστες
        </Link>
      </div>
    </div>
  );
}
