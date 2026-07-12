import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

/** Configurable portal disclaimer — replace text via env or CMS when legal copy is approved. */
export const LISTING_INQUIRY_DISCLAIMER =
  process.env.NEXT_PUBLIC_LISTING_INQUIRY_DISCLAIMER ??
  "Η διαθεσιμότητα και η τελική συμφωνία επιβεβαιώνονται από τον ιδιοκτήτη.";

export function ListingPortalDisclaimer({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        "flex items-start gap-2 text-xs leading-relaxed text-muted",
        className
      )}
    >
      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted/80" aria-hidden />
      <span>{LISTING_INQUIRY_DISCLAIMER}</span>
    </p>
  );
}
