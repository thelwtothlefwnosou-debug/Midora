import { createClient } from "@/lib/supabase/server";
import { getEffectiveListingStatus } from "@/lib/listing-status";
import type { ListingWithImages } from "@/lib/types";

export async function HomeTrustMetric() {
  const supabase = await createClient();
  let count = 0;

  if (supabase) {
    const { count: published } = await supabase
      .from("listings")
      .select("id", { count: "exact", head: true })
      .eq("status", "approved")
      .eq("is_hidden", false);

    if (published != null && published > 0) {
      count = published;
    } else {
      const { data } = await supabase
        .from("listings")
        .select("id, status, approval_status, expires_at, is_hidden");
      count = (data ?? []).filter(
        (l) => getEffectiveListingStatus(l as ListingWithImages) === "approved" && !l.is_hidden
      ).length;
    }
  }

  if (count < 1) return null;

  const label =
    count === 1 ? "1 δημοσιευμένη αγγελία" : `${count.toLocaleString("el-GR")} δημοσιευμένες αγγελίες`;

  return (
    <section className="border-b border-border bg-white py-3" aria-label="Στατιστικά πλατφόρμας">
      <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
        <p className="text-sm text-charcoal/75">
          <span className="font-semibold text-charcoal">{label}</span>
          <span className="mx-2 text-muted">·</span>
          <span>Έλεγχος αγγελιών πριν τη δημοσίευση</span>
        </p>
      </div>
    </section>
  );
}
