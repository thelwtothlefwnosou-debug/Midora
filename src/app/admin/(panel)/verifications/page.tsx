import Link from "next/link";
import { getVerificationListings } from "@/lib/admin/queries";
import { rentalTypeLabel, VERIFICATION_STATUS_LABELS } from "@/lib/rental-types";
import { AdminVerificationActions } from "@/components/admin/AdminVerificationActions";

const FILTERS = [
  { value: "", label: "Όλες" },
  { value: "pending", label: "Εκκρεμείς" },
  { value: "verified", label: "Επαληθευμένες" },
  { value: "failed", label: "Απέτυχαν" },
];

export default async function AdminVerificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;
  const listings = await getVerificationListings(filter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-charcoal">Επαληθεύσεις</h1>
        <p className="mt-1 text-sm text-muted">
          Έλεγχος αγγελιοδότη, ακινήτου και βασικών στοιχείων αγγελίας
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((tab) => (
          <Link
            key={tab.value}
            href={tab.value ? `/admin/verifications?filter=${tab.value}` : "/admin/verifications"}
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
              <th className="px-3 py-3">Τύπος</th>
              <th className="px-3 py-3">Επαλ. αγγελιοδότη</th>
              <th className="px-3 py-3">Επαλ. ακινήτου</th>
              <th className="px-3 py-3">Ταυτότητα</th>
              <th className="px-3 py-3">Ενέργειες</th>
            </tr>
          </thead>
          <tbody>
            {listings.map((listing) => {
              const owner = listing.profiles as { full_name?: string } | null;
              return (
                <tr key={listing.id} className="border-b border-border align-top">
                  <td className="px-3 py-3">
                    <Link href={`/admin/listings/${listing.id}`} className="font-medium text-gold hover:underline">
                      {listing.title}
                    </Link>
                    {listing.admin_verification_notes && (
                      <p className="mt-1 text-xs text-muted">{listing.admin_verification_notes}</p>
                    )}
                  </td>
                  <td className="px-3 py-3 text-muted">{owner?.full_name ?? "—"}</td>
                  <td className="px-3 py-3">{rentalTypeLabel(listing.rental_type)}</td>
                  <td className="px-3 py-3 text-xs">
                    {VERIFICATION_STATUS_LABELS[listing.advertiser_verification_status ?? "not_started"]}
                  </td>
                  <td className="px-3 py-3 text-xs">
                    {VERIFICATION_STATUS_LABELS[listing.property_verification_status ?? "not_started"]}
                  </td>
                  <td className="px-3 py-3 text-xs text-muted">Μη διαθέσιμο ακόμα</td>
                  <td className="px-3 py-3">
                    <AdminVerificationActions listingId={listing.id} />
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
