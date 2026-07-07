import Link from "next/link";
import {
  ClipboardCheck,
  AlertTriangle,
  FileKey,
  Flag,
  Users,
  Zap,
} from "lucide-react";
import { requireAdminContext } from "@/lib/admin/auth";
import { AdminActionCard } from "@/components/admin/AdminActionCard";
import { AdminPriorityCard } from "@/components/admin/AdminPriorityCard";
import {
  getAdminActionCenterStats,
  getAdminPriorityQueue,
  getAdminRecentAuditLogs,
} from "@/lib/admin/queries";

const AUDIT_LABELS: Record<string, string> = {
  listing_opened_for_review: "Άνοιγμα αγγελίας για έλεγχο",
  listing_approved: "Έγκριση αγγελίας",
  listing_rejected: "Απόρριψη αγγελίας",
  listing_needs_changes: "Αίτημα αλλαγών",
  listing_changes_requested: "Αίτημα αλλαγών",
  listing_hidden: "Απόκρυψη αγγελίας",
  listing_restored: "Επαναφορά αγγελίας",
  registry_reviewed: "Έλεγχος αριθμού καταχώρισης",
  listing_location_approved: "Έγκριση τοποθεσίας",
  listing_location_updated: "Ενημέρωση pin τοποθεσίας",
  user_suspended: "Αναστολή χρήστη",
  user_unsuspended: "Επαναφορά χρήστη",
  avatar_hidden: "Απόκρυψη avatar",
  avatar_removed: "Αφαίρεση avatar",
  report_resolved: "Επίλυση αναφοράς",
};

export default async function AdminOverviewPage() {
  const { profile } = await requireAdminContext("/admin");
  const firstName = (profile.full_name ?? "Admin").split(" ")[0];

  const [stats, priorityQueue, auditLogs] = await Promise.all([
    getAdminActionCenterStats(),
    getAdminPriorityQueue(8),
    getAdminRecentAuditLogs(6),
  ]);

  const actionCards = [
    {
      title: "Αγγελίες για έλεγχο",
      count: stats.pendingReview,
      description: "Νέες υποβολές που περιμένουν έγκριση ή απόρριψη.",
      href: "/admin/listings?status=pending",
      cta: "Έλεγχος αγγελιών",
      icon: ClipboardCheck,
      tone: "amber" as const,
    },
    {
      title: "Αγγελίες με ελλείψεις",
      count: stats.incompleteListings,
      description: "Λείπουν φωτογραφίες, τιμή, τοποθεσία ή δηλώσεις.",
      href: "/admin/listings?filter=incomplete",
      cta: "Δες τι λείπει",
      icon: AlertTriangle,
      tone: "gold" as const,
    },
    {
      title: "Αριθμοί καταχώρισης για έλεγχο",
      count: stats.registryPendingReview,
      description: "Βραχυχρόνια αγγελίες χωρίς ή με ελλιπή ΑΜΑ/ΕΣΛ/ΜΑΓ.",
      href: "/admin/registry",
      cta: "Έλεγχος ΑΜΑ / ΕΣΛ / ΜΑΓ",
      icon: FileKey,
      tone: "neutral" as const,
    },
    {
      title: "Νέες αναφορές",
      count: stats.newReports,
      description: "Αναφορές αγγελιών και προβλημάτων που δεν έχουν επιλυθεί.",
      href: "/admin/reports/listings",
      cta: "Δες αναφορές",
      icon: Flag,
      tone: "red" as const,
    },
    {
      title: "Χρήστες με εκκρεμότητες",
      count: stats.usersWithIssues,
      description: "Μη επαληθευμένο τηλέφωνο, ελλιπές προφίλ ή αναστολή.",
      href: "/admin/users",
      cta: "Δες χρήστες",
      icon: Users,
      tone: "neutral" as const,
    },
    {
      title: "Αγγελίες υψηλής προτεραιότητας",
      count: stats.highPriority,
      description: "Αναφορές, τοποθεσία, καθυστέρηση ή κρίσιμα κενά.",
      href: "/admin/attention",
      cta: "Άνοιγμα queue",
      icon: Zap,
      tone: "red" as const,
    },
  ];

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-2xl font-semibold text-charcoal sm:text-3xl">
          Καλημέρα, {firstName}
        </h1>
        <p className="mt-1 text-sm text-muted">
          Δες τι χρειάζεται την προσοχή σου σήμερα.
        </p>
      </div>

      <section>
        <h2 className="mb-4 font-display text-lg font-semibold text-charcoal">Action Center</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {actionCards.map((card) => (
            <AdminActionCard key={card.title} {...card} />
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold text-charcoal">
            Προτεραιότητες σήμερα
          </h2>
          <Link href="/admin/attention" className="text-sm font-medium text-gold hover:underline">
            Όλες →
          </Link>
        </div>
        {priorityQueue.length === 0 ? (
          <div className="rounded-2xl border border-border bg-white p-8 text-center text-sm text-muted">
            Δεν υπάρχουν εκκρεμείς αγγελίες με υψηλή προτεραιότητα αυτή τη στιγμή.
          </div>
        ) : (
          <div className="grid gap-4">
            {priorityQueue.map((meta) => (
              <AdminPriorityCard key={meta.listing.id} meta={meta} />
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-charcoal">
            Πρόσφατες admin ενέργειες
          </h2>
          <Link href="/admin/audit" className="text-sm font-medium text-gold hover:underline">
            Πλήρες audit log →
          </Link>
        </div>
        <div className="overflow-hidden rounded-2xl border border-border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-sand/40 text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3">Ενέργεια</th>
                <th className="px-4 py-3">Διαχειριστής</th>
                <th className="px-4 py-3">Ημερομηνία</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-muted">
                    Δεν υπάρχουν καταγεγραμμένες ενέργειες ακόμα.
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium text-charcoal">
                      {AUDIT_LABELS[log.action] ?? log.action}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {(log.profiles as { full_name?: string } | null)?.full_name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {new Date(log.created_at).toLocaleString("el-GR")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
