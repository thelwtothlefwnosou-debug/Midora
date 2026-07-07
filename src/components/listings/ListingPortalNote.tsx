import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

export const LISTING_PORTAL_NOTE =
  "Το Midora διευκολύνει την αρχική επικοινωνία με τον αγγελιοδότη. Η τελική συμφωνία πραγματοποιείται απευθείας μεταξύ των μερών.";

export function ListingPortalNote({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        "flex items-start gap-2 text-xs leading-relaxed text-muted",
        className
      )}
    >
      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted/80" aria-hidden />
      <span>{LISTING_PORTAL_NOTE}</span>
    </p>
  );
}
