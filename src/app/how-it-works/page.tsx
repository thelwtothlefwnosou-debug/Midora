import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import {
  PublicPageLayout,
  StaticHero,
  StaticSection,
  StepList,
} from "@/components/layout/PublicPageLayout";
import { OwnerListingLink } from "@/components/owners/OwnerListingLink";

export const metadata: Metadata = {
  title: "Πώς λειτουργεί",
  description:
    "Μάθε πώς λειτουργεί το Midora για ενοικιαστές και ιδιοκτήτες — αναζήτηση, ενδιαφέρον, αγγελίες.",
};

const renterSteps = [
  {
    title: "Διάλεξε τύπο μίσθωσης",
    description:
      "Επίλεξε αν ψάχνεις βραχυχρόνια ή μηνιαία/μεσοπρόθεσμη διαμονή και φίλτραρε ανά περιοχή, ημερομηνίες ή μήνα έναρξης.",
  },
  {
    title: "Βρες ακίνητα",
    description:
      "Δες φωτογραφίες, τιμή, τύπο μίσθωσης, επιπλώσεις και διαθεσιμότητα. Αποθήκευσε αγαπημένα για γρήγορη πρόσβαση.",
  },
  {
    title: "Δες διαθεσιμότητα",
    description:
      "Στις αγγελίες μπορείς να δεις ενημερωτικά τη διαθεσιμότητα ή τις μη διαθέσιμες περιόδους.",
  },
  {
    title: "Στείλε ενδιαφέρον",
    description:
      "Κάλεσε στο κινητό, στείλε email ή μήνυμα — διάλεξε τον τρόπο επικοινωνίας που σε βολεύει.",
  },
];

const ownerSteps = [
  {
    title: "Ανέβασε αγγελία",
    description:
      "Δημιούργησε λογαριασμό και ξεκίνα νέα αγγελία από το dashboard. Πρόσθεσε βασικά στοιχεία και φωτογραφίες.",
  },
  {
    title: "Συμπλήρωσε στοιχεία ακινήτου",
    description:
      "Δήλωσε τιμή, διάρκεια, επιπλώσεις, περιοχή και ό,τι χρειάζεται ο ενδιαφερόμενος να ξέρει από την αρχή.",
  },
  {
    title: "Δέξου ενδιαφέροντα",
    description:
      "Λαμβάνεις ενδιαφέροντα και μηνύματα. Απαντάς και συνεννοείσαι απευθείας με τον ενδιαφερόμενο.",
  },
  {
    title: "Διαχειρίσου την αγγελία από το dashboard",
    description:
      "Ενημέρωσε διαθεσιμότητα, φωτογραφίες και στοιχεία. Όλη η διαχείριση γίνεται από το λογαριασμό σου.",
  },
];

export default function HowItWorksPage() {
  return (
    <PublicPageLayout>
      <StaticHero
        eyebrow="Πώς λειτουργεί"
        title="Απλή διαδικασία για ενοικιαστές και ιδιοκτήτες"
        subtitle="Το Midora είναι portal αγγελιών για βραχυχρόνια και μηνιαία/μεσοπρόθεσμη διαμονή — με καθαρές πληροφορίες σε κάθε βήμα."
      >
        <Button href="/listings" size="lg">
          Ξεκίνα αναζήτηση
        </Button>
        <OwnerListingLink variant="outline" size="lg">
          Ανέβασε αγγελία
        </OwnerListingLink>
      </StaticHero>

      <StaticSection title="Για ενοικιαστές">
        <p>
          Αν ψάχνεις σπίτι για βραχυχρόνια ή μηνιαία/μεσοπρόθεσμη διαμονή, η διαδικασία
          είναι απλή:
        </p>
        <StepList steps={renterSteps} />
      </StaticSection>

      <StaticSection title="Για ιδιοκτήτες">
        <p>
          Αν έχεις ακίνητο για βραχυχρόνια ή μηνιαία/μεσοπρόθεσμη διαμονή, μπορείς να
          δημοσιεύσεις αγγελία και να τη διαχειριστείς από το dashboard:
        </p>
        <StepList steps={ownerSteps} />
      </StaticSection>
    </PublicPageLayout>
  );
}
