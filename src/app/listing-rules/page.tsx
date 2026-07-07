import type { Metadata } from "next";
import Link from "next/link";
import {
  PublicPageLayout,
  StaticHero,
  LegalSection,
} from "@/components/layout/PublicPageLayout";

export const metadata: Metadata = {
  title: "Κανόνες δημοσίευσης αγγελιών",
  description: "Κανόνες για ακριβείς και ασφαλείς αγγελίες στο Midora.",
};

export default function ListingRulesPage() {
  return (
    <PublicPageLayout narrow>
      <StaticHero
        eyebrow="Για αγγελιοδότες"
        title="Κανόνες δημοσίευσης αγγελιών"
        subtitle="Οι κανόνες αυτοί ισχύουν για κάθε αγγελία που υποβάλλεται στο Midora. Σκοπός τους είναι ακριβείς πληροφορίες, ασφάλεια χρηστών και δίκαιη προβολή."
      />

      <LegalSection title="Ακρίβεια και περιεχόμενο">
        <ul className="list-disc space-y-2 pl-5">
          <li>Η αγγελία πρέπει να αφορά πραγματικό ακίνητο που μπορείς να διαθέσεις.</li>
          <li>Οι φωτογραφίες πρέπει να αντιστοιχούν στο ακίνητο — όχι ψεύτικες ή άσχετες εικόνες.</li>
          <li>Η τιμή, η διαθεσιμότητα και οι όροι διαμονής πρέπει να είναι ξεκάθαροι και μη παραπλανητικοί.</li>
          <li>Δεν επιτρέπονται εξωτερικοί σύνδεσμοι προς αμφίβολες ή εξαπατητικές σελίδες.</li>
          <li>Μην δημοσιεύεις προσωπικά στοιχεία επικοινωνίας στον τίτλο ή την περιγραφή.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Βραχυχρόνια μίσθωση και αριθμός καταχώρισης">
        <p>
          Όπου απαιτείται από τη νομοθεσία, πρέπει να δηλώνεται έγκυρος αριθμός καταχώρισης
          (ΑΜΑ, ΕΣΛ ή ΜΑΓ) που αντιστοιχεί στο ακίνητο. Το Midora μπορεί να ζητήσει
          διευκρινίσεις ή διορθώσεις πριν από τη δημοσίευση.
        </p>
        <p>
          Το Midora δεν επαληθεύει αυτόματα στοιχεία με την ΑΑΔΕ και δεν αποτελεί μέρος
          φορολογικών ή διοικητικών διαδικασιών.
        </p>
        <p>
          Δες επίσης τον{" "}
          <Link href="/short-term-rental-guide" className="text-gold hover:underline">
            οδηγό βραχυχρόνιας μίσθωσης
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="Έλεγχος και αλλαγές από το Midora">
        <p>
          Το Midora μπορεί να ελέγξει αγγελίες, να ζητήσει αλλαγές, να τις κρύψει ή να τις
          αφαιρέσει αν δεν πληρούν τους κανόνες ή αν υπάρχουν έγκυρες αναφορές.
        </p>
        <p>
          Μπορεί να ζητηθούν πρόσθετα στοιχεία ή αποδεικτικά για την ορθότητα της αγγελίας.
        </p>
      </LegalSection>

      <LegalSection title="Σχετικά έγγραφα">
        <p>
          <Link href="/terms" className="text-gold hover:underline">
            Όροι χρήσης
          </Link>
          {" · "}
          <Link href="/privacy" className="text-gold hover:underline">
            Πολιτική απορρήτου
          </Link>
        </p>
      </LegalSection>
    </PublicPageLayout>
  );
}
