import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function AdminForbiddenPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-4">
      <div className="max-w-md rounded-2xl border border-border bg-white p-8 text-center shadow-soft">
        <p className="text-sm font-medium tracking-wide text-gold uppercase">403</p>
        <h1 className="mt-2 font-display text-2xl font-semibold text-charcoal">
          Δεν έχεις πρόσβαση
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Η σελίδα αυτή είναι διαθέσιμη μόνο σε διαχειριστές.
        </p>
        <Button href="/dashboard" className="mt-6">
          Επιστροφή στο dashboard
        </Button>
        <p className="mt-4">
          <Link href="/" className="text-sm text-gold hover:underline">
            Αρχική σελίδα
          </Link>
        </p>
      </div>
    </div>
  );
}
