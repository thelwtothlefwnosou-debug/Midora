import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HOME_FAQ } from "@/lib/copy";

const extraFaqs = [
  {
    question: "Πόσο κοστίζει για τον αγγελιοδότη;",
    answer:
      "Στην περίοδο launch η δημοσίευση είναι δωρεάν. Σύντομα θα ισχύει χρέωση 1€/μήνα ανά αγγελία.",
  },
  {
    question: "Πώς ανεβάζω αγγελία;",
    answer:
      "Φτιάξε λογαριασμό → Dashboard → Νέα αγγελία → φωτογραφίες → υποβολή για έλεγχο.",
  },
  {
    question: "Σε ποιες περιοχές λειτουργεί;",
    answer: "Σε όλη την Ελλάδα — μεγάλες πόλεις, μικρότερες πόλεις και νησιά.",
  },
];

export default function FaqPage() {
  const faqs = [...HOME_FAQ, ...extraFaqs];

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-16">
        <div className="mx-auto max-w-3xl px-6">
          <h1 className="font-display text-4xl font-bold text-charcoal">Συχνές ερωτήσεις</h1>
          <p className="mt-3 text-muted">Ό,τι χρειάζεσαι για να ξεκινήσεις με το Midora</p>

          <div className="mt-10 space-y-4">
            {faqs.map((item) => (
              <details
                key={item.question}
                className="group rounded-2xl border border-border bg-sand/40 p-5"
              >
                <summary className="cursor-pointer font-medium text-charcoal marker:content-none">
                  {item.question}
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-charcoal/70">{item.answer}</p>
              </details>
            ))}
          </div>

          <p className="mt-10 text-center text-sm text-muted">
            Δεν βρήκες απάντηση;{" "}
            <Link href="/contact" className="text-gold hover:underline">
              Επικοινώνησε μαζί μας
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
