import { Shield } from "lucide-react";
import { cn } from "@/lib/utils";

export const LISTING_TRUST_NOTE =
  process.env.NEXT_PUBLIC_LISTING_TRUST_NOTE ??
  "Για την ασφάλειά σου, επικοινώνησε με τον ιδιοκτήτη μέσα από το Midora και επιβεβαίωσε τη διαθεσιμότητα πριν από οποιαδήποτε συμφωνία.";

export const LISTING_TRUST_PAYMENT_NOTE =
  "Το Midora δεν διαχειρίζεται πληρωμές ή κρατήσεις.";

type Props = {
  className?: string;
  showPaymentNote?: boolean;
};

export function ListingTrustNote({ className, showPaymentNote = false }: Props) {
  return (
    <div
      className={cn(
        "flex items-start gap-2.5 rounded-xl bg-sand/35 px-3.5 py-3 text-sm leading-relaxed text-charcoal/75",
        className
      )}
    >
      <Shield className="mt-0.5 h-4 w-4 shrink-0 text-gold-dark" aria-hidden />
      <div className="space-y-1">
        <p>{LISTING_TRUST_NOTE}</p>
        {showPaymentNote ? (
          <p className="text-[13px] text-charcoal/60">{LISTING_TRUST_PAYMENT_NOTE}</p>
        ) : null}
      </div>
    </div>
  );
}
