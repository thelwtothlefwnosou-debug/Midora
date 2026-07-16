import type { Metadata } from "next";
import Link from "next/link";
import {
  PublicPageLayout,
  StaticHero,
  FaqAccordion,
} from "@/components/layout/PublicPageLayout";
import { getHelpPageFaqGroups } from "@/lib/assistant/faq-index";

export const metadata: Metadata = {
  title: "Βοήθεια",
  description:
    "Βοήθεια για αναζήτηση, αγγελίες, αιτήματα, ιδιοκτήτες, φωτογραφίες, διαθεσιμότητα και λογαριασμό στο Midora.",
};

export default function HelpPage() {
  const helpCategories = getHelpPageFaqGroups();

  return (
    <PublicPageLayout narrow>
      <StaticHero
        eyebrow="Βοήθεια"
        title="Πώς μπορούμε να σε βοηθήσουμε;"
        subtitle="Σύντομες απαντήσεις για αναζήτηση, αγγελίες, αιτήματα, ιδιοκτήτες, ασφάλεια και τεχνικά θέματα στο Midora."
      />

      <div className="space-y-10 pb-4">
        {helpCategories.map((category) => (
          <section key={category.title}>
            <h2 className="font-display text-lg font-semibold text-charcoal">
              {category.title}
            </h2>
            <FaqAccordion items={category.faqs} />
          </section>
        ))}
      </div>

      <p className="border-t border-border pt-8 text-center text-sm text-muted">
        Δεν βρήκες απάντηση;{" "}
        <Link href="/contact" className="text-gold hover:underline">
          Επικοινώνησε μαζί μας
        </Link>
        {" · "}
        <Link href="/faq" className="text-gold hover:underline">
          Συχνές ερωτήσεις
        </Link>
      </p>
    </PublicPageLayout>
  );
}
