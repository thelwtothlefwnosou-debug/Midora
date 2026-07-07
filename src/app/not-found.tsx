import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main className="flex min-h-screen flex-col items-center justify-center px-6 pt-24 pb-16 text-center">
        <p className="font-display text-8xl font-bold text-charcoal/10">404</p>
        <h1 className="mt-4 font-display text-3xl font-bold text-charcoal">Δεν βρέθηκε</h1>
        <p className="mt-3 max-w-md text-muted">
          Η σελίδα που ψάχνεις δεν υπάρχει ή η αγγελία δεν είναι πλέον διαθέσιμη.
        </p>
        <div className="mt-8 flex gap-3">
          <Button href="/listings">Αναζήτηση ακινήτων</Button>
          <Link href="/" className="rounded-full border border-border px-6 py-3 text-sm text-charcoal/70 hover:border-gold/30">
            Αρχική
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
