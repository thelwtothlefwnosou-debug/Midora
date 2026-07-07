import Link from "next/link";
import { getRegistryListings } from "@/lib/admin/queries";
import { rentalTypeLabel } from "@/lib/rental-types";
import { AdminRegistryActions } from "@/components/admin/AdminRegistryActions";

const REGISTRY_LABELS: Record<string, string> = {
  ama: "ΑΜΑ",
  esl: "ΕΣΛ",
  mag: "ΜΑΓ",
  none: "—",
};

export default async function AdminRegistryPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;
  let listings = await getRegistryListings();

  if (filter === "ama") listings = listings.filter((l) => l.legal_registry_type === "ama");
  else if (filter === "esl") listings = listings.filter((l) => l.legal_registry_type === "esl");
  else if (filter === "mag") listings = listings.filter((l) => l.legal_registry_type === "mag");
  else if (filter === "missing")
    listings = listings.filter((l) => !l.ama_number?.trim());
  else if (filter === "review")
    listings = listings.filter(
      (l) => l.property_verification_status === "pending" || l.property_verification_status === "needs_review"
    );
  else if (filter === "reviewed")
    listings = listings.filter((l) => l.property_verification_status === "verified");

  const tabs = [
    { value: "", label: "Όλα" },
    { value: "ama", label: "ΑΜΑ" },
    { value: "esl", label: "ΕΣΛ" },
    { value: "mag", label: "ΜΑΓ" },
    { value: "missing", label: "Λείπει αριθμός" },
    { value: "review", label: "Χρειάζεται έλεγχο" },
    { value: "reviewed", label: "Ελεγμένο" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-charcoal">ΑΜΑ / ΕΣΛ / ΜΑΓ</h1>
        <p className="mt-1 text-sm text-muted">
          Έλεγχος καταχωρημένων αριθμών για βραχυχρόνιες αγγελίες
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <Link
            key={tab.value}
            href={tab.value ? `/admin/registry?filter=${tab.value}` : "/admin/registry"}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              (filter ?? "") === tab.value
                ? "bg-gold text-white"
                : "bg-white border border-border text-muted"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-white">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-border bg-sand/40 text-xs uppercase text-muted">
            <tr>
              <th className="px-3 py-3">Αγγελία</th>
              <th className="px-3 py-3">Αγγελιοδότης</th>
              <th className="px-3 py-3">Τύπος μίσθωσης</th>
              <th className="px-3 py-3">Μητρώο</th>
              <th className="px-3 py-3">Αριθμός</th>
              <th className="px-3 py-3">Κατάσταση</th>
              <th className="px-3 py-3">Ημερομηνία</th>
              <th className="px-3 py-3">Ενέργειες</th>
            </tr>
          </thead>
          <tbody>
            {listings.map((listing) => {
              const owner = listing.profiles as { full_name?: string } | null;
              const hasRegistry = listing.ama_number?.trim();
              const statusLabel = hasRegistry
                ? "Με καταχωρημένο ΑΜΑ/ΕΣΛ/ΜΑΓ"
                : "Λείπει αριθμός";
              return (
                <tr key={listing.id} className="border-b border-border align-top">
                  <td className="px-3 py-3">
                    <Link href={`/admin/listings/${listing.id}`} className="text-gold hover:underline">
                      {listing.title}
                    </Link>
                  </td>
                  <td className="px-3 py-3 text-muted">{owner?.full_name ?? "—"}</td>
                  <td className="px-3 py-3">{rentalTypeLabel(listing.rental_type)}</td>
                  <td className="px-3 py-3">
                    {REGISTRY_LABELS[listing.legal_registry_type ?? "none"] ?? listing.legal_registry_type}
                  </td>
                  <td className="px-3 py-3 font-mono text-xs">{listing.ama_number || "—"}</td>
                  <td className="px-3 py-3 text-xs">{statusLabel}</td>
                  <td className="px-3 py-3 text-xs text-muted">
                    {new Date(listing.created_at).toLocaleDateString("el-GR")}
                  </td>
                  <td className="px-3 py-3">
                    <AdminRegistryActions listingId={listing.id} />
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
