import type { Metadata } from "next";
import Link from "next/link";
import {
  PublicPageLayout,
  StaticHero,
  LegalSection,
} from "@/components/layout/PublicPageLayout";

const supportEmail =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "support@midora.gr";

export const metadata: Metadata = {
  title: "Πολιτική απορρήτου",
  description: "Πώς το Midora χειρίζεται προσωπικά δεδομένα και cookies.",
};

export default function PrivacyPage() {
  return (
    <PublicPageLayout narrow>
      <StaticHero
        eyebrow="Νομικά"
        title="Πολιτική απορρήτου"
        subtitle="Η παρούσα πολιτική περιγράφει γενικά ποια δεδομένα μπορεί να συλλέγονται και πώς χρησιμοποιούνται. Μπορεί να ενημερώνεται περιοδικά."
      />

      <LegalSection title="Ποια δεδομένα μπορεί να συλλέγονται">
        <p>
          Για τη λειτουργία της πλατφόρμας μπορεί να συλλέγονται στοιχεία όπως email,
          όνομα, τηλέφωνο (όπου δηλώνεται), στοιχεία αγγελιών, ιδιωτική διεύθυνση για
          εσωτερικό έλεγχο, μηνύματα και αιτήματα ενδιαφέροντος, καθώς και τεχνικά
          δεδομένα σύνδεσης (π.χ. logs, IP) όπου απαιτείται για ασφάλεια.
        </p>
      </LegalSection>

      <LegalSection title="Διεύθυνση και επικοινωνία">
        <p>
          Η πλήρης διεύθυνση ακινήτου δεν εμφανίζεται δημόσια από προεπιλογή —
          χρησιμοποιείται για έλεγχο και διαχείριση της αγγελίας.
        </p>
        <p>
          Τηλέφωνα και email εμφανίζονται στους ενδιαφερόμενους μόνο σύμφωνα με τις
          ρυθμίσεις επικοινωνίας της αγγελίας.
        </p>
      </LegalSection>

      <LegalSection title="Πώς χρησιμοποιούνται">
        <p>
          Τα δεδομένα χρησιμοποιούνται για δημιουργία και διαχείριση λογαριασμού,
          δημοσίευση και αναζήτηση αγγελιών, αποστολή αιτημάτων, επικοινωνία και
          βελτίωση της εμπειρίας χρήσης.
        </p>
        <p>
          Δεν πωλούμε προσωπικά δεδομένα σε τρίτους για marketing.
        </p>
      </LegalSection>

      <LegalSection title="Λογαριασμός και επικοινωνία">
        <p>
          Μπορείς να ζητήσεις πρόσβαση, διόρθωση ή διαγραφή δεδομένων λογαριασμού
          επικοινωνώντας μαζί μας, υπό την επιφύλαξη νομικών υποχρεώσεων
          τήρησης.
        </p>
      </LegalSection>

      <LegalSection title="Cookies / analytics">
        <p>
          Χρησιμοποιούμε cookies και παρόμοια τεχνολογία για authentication,
          προτιμήσεις συνεδρίας και βασική λειτουργία του ιστότοπου. Αν
          ενσωματωθούν εργαλεία analytics στο μέλλον, θα ενημερώνεται η παρούσα
          πολιτική.
        </p>
      </LegalSection>

      <LegalSection title="Ασφάλεια δεδομένων">
        <p>
          Εφαρμόζουμε reasonable τεχνικά και οργανωτικά μέτρα για την προστασία
          δεδομένων. Καμία μέθοδος μετάδοσης ή αποθήκευσης στο διαδίκτυο δεν
          είναι απόλυτα ασφαλής.
        </p>
      </LegalSection>

      <LegalSection title="Επικοινωνία">
        <p>
          Για ερωτήσεις σχετικά με την πολιτική απορρήτου, επικοινώνησε στο{" "}
          <a href={`mailto:${supportEmail}`} className="text-gold hover:underline">
            {supportEmail}
          </a>{" "}
          ή μέσω της{" "}
          <Link href="/contact" className="text-gold hover:underline">
            σελίδας επικοινωνίας
          </Link>
          .
        </p>
        <p className="text-xs text-muted">
          Τελευταία ενημέρωση: {new Date().getFullYear()}
        </p>
      </LegalSection>
    </PublicPageLayout>
  );
}
