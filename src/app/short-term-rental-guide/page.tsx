import type { Metadata } from "next";
import Link from "next/link";
import {
  PublicPageLayout,
  StaticHero,
  LegalSection,
} from "@/components/layout/PublicPageLayout";

export const metadata: Metadata = {
  title: "Οδηγός βραχυχρόνιας μίσθωσης",
  description: "Πληροφορίες για αγγελιοδότες βραχυχρόνιας διαμονής στο Midora.",
};

const AADE_URL = "https://www.aade.gr/brahyhronia-misthosi-akiniton";

export default function ShortTermRentalGuidePage() {
  return (
    <PublicPageLayout narrow>
      <StaticHero
        eyebrow="Για αγγελιοδότες"
        title="Οδηγός βραχυχρόνιας μίσθωσης"
        subtitle="Σύντομες πληροφορίες για τη δημοσίευση βραχυχρόνιας αγγελίας στο Midora — χωρίς κράτηση ή πληρωμή μέσω της πλατφόρμας."
      />

      <LegalSection title="Τι είναι το Midora">
        <p>
          Το Midora είναι πλατφόρμα προβολής αγγελιών και αρχικής επικοινωνίας. Δεν
          συμμετέχει στη σύναψη συμφωνίας, στην πληρωμή ή στη διαχείριση διαμονής.
        </p>
      </LegalSection>

      <LegalSection title="Αριθμός καταχώρισης">
        <p>
          Για βραχυχρόνια διαμονή, όπου προβλέπεται, χρειάζεται αριθμός καταχώρισης (ΑΜΑ,
          ΕΣΛ ή ΜΑΓ) που αντιστοιχεί στο ακίνητο. Η έκδοση ή εύρεση γίνεται μέσω της
          επίσημης διαδικασίας της ΑΑΔΕ — εκτός Midora.
        </p>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed">
          <li>Άνοιξε την επίσημη σελίδα της ΑΑΔΕ για βραχυχρόνια μίσθωση.</li>
          <li>Συνδέσου με τους προσωπικούς σου κωδικούς myAADE.</li>
          <li>Ολοκλήρωσε τη διαδικασία έκδοσης ή εντοπισμού του αριθμού.</li>
          <li>Επέστρεψε στο Midora και συμπλήρωσε τον αριθμό στην αγγελία σου.</li>
        </ol>
        <p className="mt-3 text-sm text-muted">
          Το Midora δεν συνδέεται με την ΑΑΔΕ και δεν ζητά ή αποθηκεύει κωδικούς myAADE.
        </p>
        <a
          href={AADE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block text-sm font-medium text-gold hover:underline"
        >
          Επίσημη σελίδα ΑΑΔΕ →
        </a>
      </LegalSection>

      <LegalSection title="Μετά την υποβολή">
        <p>
          Η αγγελία περνάει βασικό έλεγχο από το Midora πριν τη δημοσίευση. Μπορεί να
          ζητηθούν διορθώσεις ή πρόσθετες πληροφορίες. Η έγκριση δεν σημαίνει επίσημη
          επαλήθευση από κρατική αρχή.
        </p>
      </LegalSection>

      <LegalSection title="Σχετικά">
        <p>
          <Link href="/listing-rules" className="text-gold hover:underline">
            Κανόνες δημοσίευσης
          </Link>
          {" · "}
          <Link href="/terms" className="text-gold hover:underline">
            Όροι χρήσης
          </Link>
        </p>
      </LegalSection>
    </PublicPageLayout>
  );
}
