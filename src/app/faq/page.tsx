import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { getFaqCategoryGroups } from "@/lib/assistant/faq-index";

export const metadata: Metadata = {
  title: "Συχνές ερωτήσεις",
  description: "Συχνές ερωτήσεις για αναζήτηση, αγγελίες, ιδιοκτήτες και χρήση του Midora.",
};

export default function FaqPage() {
  const groups = getFaqCategoryGroups({ audience: "all" });

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-16">
        <div className="mx-auto max-w-3xl px-6">
          <h1 className="font-display text-4xl font-bold text-charcoal">Συχνές ερωτήσεις</h1>
          <p className="mt-3 text-muted">
            Απαντήσεις αποκλειστικά για το Midora — αναζήτηση, αγγελίες, αιτήματα, ιδιοκτήτες και
            ασφάλεια.
          </p>

          <div className="mt-10 space-y-10">
            {groups.map((group) => (
              <section key={group.id}>
                <h2 className="font-display text-xl font-semibold text-charcoal">{group.title}</h2>
                <div className="mt-4 space-y-4">
                  {group.items.map((item) => (
                    <details
                      key={item.id}
                      className="group rounded-2xl border border-border bg-sand/40 p-5"
                    >
                      <summary className="cursor-pointer font-medium text-charcoal marker:content-none">
                        {item.question}
                      </summary>
                      <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-charcoal/70">
                        {item.answer}
                      </p>
                    </details>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <p className="mt-10 text-center text-sm text-muted">
            Δεν βρήκες απάντηση;{" "}
            <Link href="/contact" className="text-gold hover:underline">
              Επικοινώνησε μαζί μας
            </Link>
            {" · "}
            <Link href="/help" className="text-gold hover:underline">
              Κέντρο βοήθειας
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
