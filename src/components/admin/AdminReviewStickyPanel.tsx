"use client";

import { Check, X } from "lucide-react";
import { AdminListingActionModals } from "@/components/admin/AdminListingActionModals";
import type { ListingApprovalChecklist } from "@/lib/admin/listing-approval-checklist";
import { cn } from "@/lib/utils";

type Props = {
  listingId: string;
  ownerUserId?: string | null;
  isHidden?: boolean;
  canApprove?: boolean;
  checklist?: ListingApprovalChecklist;
  onError?: (message: string) => void;
  onSuccess?: () => void;
};

export function AdminReviewStickyPanel({
  listingId,
  ownerUserId,
  isHidden = false,
  canApprove = true,
  checklist,
  onError,
  onSuccess,
}: Props) {
  return (
    <aside className="lg:sticky lg:top-6 lg:self-start">
      <div className="rounded-xl border border-border bg-white p-5 shadow-soft">
        <h2 className="font-display text-lg font-semibold text-charcoal">Έλεγχος αγγελίας</h2>

        {checklist && (
          <div
            className={cn(
              "mt-4 rounded-lg border p-4",
              checklist.canApprove
                ? "border-teal/30 bg-teal/5"
                : "border-amber-300/60 bg-amber-50/60"
            )}
          >
            <p className="text-sm font-medium text-charcoal">
              {checklist.canApprove
                ? "Έτοιμη για έγκριση"
                : "Δεν μπορεί να εγκριθεί ακόμα"}
            </p>
            <ul className="mt-3 space-y-1.5 text-sm">
              {checklist.items.map((item) => (
                <li key={item.id} className="flex items-start gap-2">
                  {item.ok ? (
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
                  ) : (
                    <X className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                  )}
                  <span className={item.ok ? "text-charcoal" : "text-red-700"}>{item.label}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-5 border-t border-border pt-5">
          <AdminListingActionModals
            listingId={listingId}
            ownerUserId={ownerUserId}
            isHidden={isHidden}
            canApprove={canApprove}
            onError={onError}
            onSuccess={onSuccess}
          />
        </div>
      </div>
    </aside>
  );
}
