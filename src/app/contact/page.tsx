import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { GlassCard } from "@/components/ui/GlassCard";

export default function ContactPage() {
  const supportEmail =
    process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "support@midora.gr";

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-16">
        <div className="mx-auto max-w-2xl px-6">
          <h1 className="font-display text-4xl font-bold text-charcoal">Επικοινωνία</h1>
          <p className="mt-3 text-muted">
            Είμαστε εδώ για ιδιοκτήτες, ενοικιαστές και γενικές ερωτήσεις
          </p>

          <GlassCard className="mt-10 space-y-4 p-8">
            <a
              href={`mailto:${supportEmail}`}
              className="flex items-center gap-4 rounded-xl border border-border bg-sand/50 px-5 py-4 transition-colors hover:border-gold/30"
            >
              <Mail className="h-5 w-5 text-gold" />
              <div>
                <p className="text-sm text-muted">Email</p>
                <p className="font-medium text-charcoal">{supportEmail}</p>
              </div>
            </a>

            <div className="flex items-center gap-4 rounded-xl border border-border bg-sand/50 px-5 py-4">
              <Phone className="h-5 w-5 text-gold" />
              <div>
                <p className="text-sm text-muted">Για αγγελίες</p>
                <p className="font-medium text-charcoal">
                  Κάλεσε απευθείας τον ιδιοκτήτη από τη σελίδα του ακινήτου
                </p>
              </div>
            </div>
          </GlassCard>

          <p className="mt-8 text-center text-sm text-muted">
            Δες και τις{" "}
            <Link href="/faq" className="text-gold hover:underline">
              Συχνές ερωτήσεις
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
