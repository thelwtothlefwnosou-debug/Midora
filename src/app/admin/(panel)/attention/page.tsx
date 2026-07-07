import Link from "next/link";
import {
  ClipboardCheck,
  RefreshCw,
  MapPin,
  ImageOff,
  PhoneOff,
  Flag,
  AlertTriangle,
  Inbox,
  BadgeCheck,
} from "lucide-react";
import { AdminActionCard } from "@/components/admin/AdminActionCard";
import { AdminPriorityCard } from "@/components/admin/AdminPriorityCard";
import {
  getAdminActionCenterStats,
  getAdminPriorityQueue,
} from "@/lib/admin/queries";

export default async function AdminAttentionPage() {
  const [stats, queue] = await Promise.all([
    getAdminActionCenterStats(),
    getAdminPriorityQueue(10),
  ]);

  const actionCards = [
    {
      title: "Σε έλεγχο",
      count: stats.pendingReview,
      description: "Αγγελίες που περιμένουν έλεγχο από την ομάδα Midora.",
      href: "/admin/listings?quick=needs_review",
      cta: "Άνοιγμα ουράς",
      icon: ClipboardCheck,
      tone: "amber" as const,
    },
    {
      title: "Χρειάζονται αλλαγές",
      count: stats.needsChanges,
      description: "Αγγελίες που επέστρεψαν στον αγγελιοδότη για διορθώσεις.",
      href: "/admin/listings?status=needs_changes",
      cta: "Προβολή λίστας",
      icon: RefreshCw,
      tone: "gold" as const,
    },
    {
      title: "Θέματα τοποθεσίας",
      count: stats.locationIssues,
      description: "Ακίνητα με ατελή ή μη επιβεβαιωμένη τοποθεσία στον χάρτη.",
      href: "/admin/listings?filter=location",
      cta: "Έλεγχος χάρτη",
      icon: MapPin,
      tone: "amber" as const,
    },
    {
      title: "Ελλιπείς αγγελίες",
      count: stats.incompleteListings,
      description: "Καταχωρίσεις που δεν πληρούν τα κριτήρια πληρότητας.",
      href: "/admin/listings?filter=incomplete",
      cta: "Προβολή ελλιπών",
      icon: AlertTriangle,
      tone: "neutral" as const,
    },
    {
      title: "Χωρίς φωτογραφίες",
      count: stats.noPhotos,
      description: "Αγγελίες με λιγότερες φωτογραφίες από το ελάχιστο όριο.",
      href: "/admin/listings?quick=no_photos",
      cta: "Προβολή λίστας",
      icon: ImageOff,
      tone: "neutral" as const,
    },
    {
      title: "Μη επαληθευμένο τηλέφωνο",
      count: stats.unverifiedPhone,
      description: "Αγγελιοδότες χωρίς επαληθευμένο κύριο τηλέφωνο.",
      href: "/admin/listings?quick=unverified_phone",
      cta: "Προβολή λίστας",
      icon: PhoneOff,
      tone: "neutral" as const,
    },
    {
      title: "Με αναφορές",
      count: stats.withReports,
      description: "Αγγελίες που έχουν λάβει αναφορές από χρήστες.",
      href: "/admin/listings?quick=with_reports",
      cta: "Προβολή αναφορών",
      icon: Flag,
      tone: "red" as const,
    },
    {
      title: "Υψηλή προτεραιότητα",
      count: stats.highPriority,
      description: "Κρίσιμες ή υψηλής προτεραιότητας εργασίες ελέγχου.",
      href: "/admin/listings?quick=high_priority",
      cta: "Άμεση προτεραιότητα",
      icon: AlertTriangle,
      tone: "red" as const,
    },
    {
      title: "Νέες αναφορές",
      count: stats.newListingReports,
      description: "Μη διαβασμένες αναφορές αγγελιών από την κοινότητα.",
      href: "/admin/reports/listings",
      cta: "Άνοιγμα αναφορών",
      icon: Inbox,
      tone: "red" as const,
    },
    {
      title: "Εκκρεμείς επαληθεύσεις",
      count: stats.pendingVerifications,
      description: "Επαληθεύσεις αγγελιοδότη ή ακινήτου σε εξέλιξη.",
      href: "/admin/verifications?filter=pending",
      cta: "Έλεγχος επαληθεύσεων",
      icon: BadgeCheck,
      tone: "teal" as const,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-charcoal sm:text-3xl">
          Ενέργειες που απαιτούν προσοχή
        </h1>
        <p className="mt-1 text-sm text-muted">
          Κέντρο ελέγχου για ουρές έγκρισης, αναφορές και εκκρεμότητες
        </p>
      </div>

      <section>
        <h2 className="mb-4 font-display text-lg font-semibold text-charcoal">
          Γρήγορη επισκόπηση
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {actionCards.map((card) => (
            <AdminActionCard key={card.href} {...card} />
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold text-charcoal">
              Ουρά προτεραιότητας
            </h2>
            <p className="mt-0.5 text-sm text-muted">
              Τα πιο επείγοντα στοιχεία για έλεγχο, ταξινομημένα κατά προτεραιότητα
            </p>
          </div>
          <Link
            href="/admin/listings?quick=high_priority"
            className="shrink-0 text-sm font-medium text-gold hover:underline"
          >
            Όλες →
          </Link>
        </div>

        {queue.length === 0 ? (
          <div className="rounded-2xl border border-border bg-white p-12 text-center text-muted shadow-soft">
            Δεν υπάρχουν εκκρεμείς εργασίες στην ουρά προτεραιότητας.
          </div>
        ) : (
          <div className="space-y-3">
            {queue.map((meta) => (
              <AdminPriorityCard key={meta.listing.id} meta={meta} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
