import { getPendingListings } from "@/lib/listings";
import { AdminListingRow } from "@/components/admin/AdminListingRow";

export default async function AdminListingsReviewPage() {
  const pending = await getPendingListings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-charcoal">Έλεγχος αγγελιών</h1>
        <p className="mt-1 text-sm text-muted">
          {pending.length} αγγελίες σε αναμονή έλεγχου
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-white">
        {pending.length === 0 ? (
          <p className="p-12 text-center text-muted">Όλες οι αγγελίες ελέγχθηκαν.</p>
        ) : (
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-border bg-sand/40 text-xs font-medium tracking-wide text-muted uppercase">
              <tr>
                <th className="px-3 py-3">Αγγελία</th>
                <th className="px-3 py-3">Αγγελιοδότης</th>
                <th className="px-3 py-3">Τύπος</th>
                <th className="px-3 py-3">
                  <span className="block">Αριθμός καταχώρισης</span>
                  <span className="mt-0.5 block text-[10px] normal-case tracking-normal text-muted/80">
                    ΑΜΑ / ΕΣΛ / ΜΑΓ
                  </span>
                </th>
                <th className="px-3 py-3">Επαλ. αγγελιοδότη</th>
                <th className="px-3 py-3">Επαλ. ακινήτου</th>
                <th className="px-3 py-3">Κατάσταση</th>
                <th className="px-3 py-3">Ενέργειες</th>
              </tr>
            </thead>
            <tbody>
              {pending.map((listing) => (
                <AdminListingRow key={listing.id} listing={listing} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
