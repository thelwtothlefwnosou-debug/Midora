import type { Metadata } from "next";
import Link from "next/link";
import {
  PublicPageLayout,
  StaticHero,
  StaticSection,
  StepList,
} from "@/components/layout/PublicPageLayout";
import { OwnerListingLink } from "@/components/owners/OwnerListingLink";
import { HOME_OWNER_RENTAL_CARDS } from "@/lib/homepage-content";

export const metadata: Metadata = {
  title: "Για αγγελιοδότες",
  description:
    "Ανέβασε αγγελία για βραχυχρόνια ή μηνιαία/μεσοπρόθεσμη διαμονή στο Midora — δέξου ενδιαφέροντα από επισκέπτες.",
};

const processSteps = [
  {
    title: "Δημιούργησε λογαριασμό",
    description:
      "Εγγράψου ή συνδέσου και ξεκίνα νέα αγγελία. Αν δεν είσαι συνδεδεμένος, θα σε οδηγήσουμε στο login με redirect.",
  },
  {
    title: "Συμπλήρωσε την αγγελία",
    description:
      "Πρόσθεσε φωτογραφίες, τιμή, τύπο μίσθωσης, περιοχή, επιπλώσεις, διάρκεια και ό,τι χρειάζεται ο ενδιαφερόμενος.",
  },
  {
    title: "Δέξου ενδιαφέροντα",
    description:
      "Λαμβάνεις μηνύματα ενδιαφέροντος. Απαντάς και συνεννοείσαι απευθείας, εκτός Midora.",
  },
  {
    title: "Διαχειρίσου από το dashboard",
    description:
      "Ενημέρωσε στοιχεία, φωτογραφίες, διαθεσιμότητα και μη διαθέσιμες περιόδους όποτε χρειάζεται.",
  },
];

export default function OwnersPage() {
  return (
    <PublicPageLayout>
      <StaticHero
        eyebrow="Για αγγελιοδότες"
        title="Ανέβασε την αγγελία σου στο Midora"
        subtitle="Δημοσίευσε ακίνητο για βραχυχρόνια ή μηνιαία/μεσοπρόθεσμη διαμονή και δέξου ενδιαφέροντα από επισκέπτες."
      >
        <OwnerListingLink size="lg">Ανέβασε αγγελία</OwnerListingLink>
      </StaticHero>

      <StaticSection title="Τύποι αγγελιών">
        <div className="grid gap-4 sm:grid-cols-3">
          {HOME_OWNER_RENTAL_CARDS.map((card) => (
            <div
              key={card.rentalType}
              className="rounded-xl border border-border bg-white p-5 shadow-soft"
            >
              <h3 className="font-display text-base font-semibold text-charcoal">
                {card.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{card.text}</p>
            </div>
          ))}
        </div>
      </StaticSection>

      <StaticSection title="Γιατί να ανεβάσεις αγγελία στο Midora">
        <p>
          Το Midora είναι portal αγγελιών — όχι πλατφόρμα πληρωμών. Οι
          επισκέπτες βλέπουν καθαρές πληροφορίες και στέλνουν ενδιαφέρον· η τελική
          συνεννόηση γίνεται απευθείας μαζί σου.
        </p>
        <p>
          Μπορείς να παρουσιάσεις το ακίνητό σου με φωτογραφίες και δομημένα στοιχεία,
          και να διαχειρίζεσαι ενδιαφέροντα από ένα dashboard.
        </p>
      </StaticSection>

      <StaticSection title="Τι είδους ακίνητα ταιριάζουν">
        <p>
          Επιπλωμένα διαμερίσματα, στούντιο, μονοκατοικίες και άλλοι τύποι — για
          βραχυχρόνια διαμονή ή μηνιαία/μεσοπρόθεσμη ανάγκη.
        </p>
        <p>
          Το σημαντικό είναι να δηλώνονται καθαρά τύπος μίσθωσης, τιμή, minimum
          διάρκεια, επιπλώσεις και διαθεσιμότητα στην αγγελία.
        </p>
      </StaticSection>

      <StaticSection title="Πώς λειτουργεί η διαδικασία">
        <StepList steps={processSteps} />
      </StaticSection>

      <StaticSection title="Τι χρειάζεται για μια καλή αγγελία">
        <ul className="list-disc space-y-2 pl-5">
          <li>Καθαρές φωτογραφίες του ακινήτου</li>
          <li>Σαφής τιμή (ανά βράδυ ή ανά μήνα) και minimum διάρκεια</li>
          <li>Τύπος μίσθωσης και περιοχή</li>
          <li>Βασικά χαρακτηριστικά (υ/δ, μπάνια, τ.μ.)</li>
          <li>Πληροφορίες για επιπλώσεις, λογαριασμούς και διαθεσιμότητα</li>
          <li>ΑΜΑ/ΕΣΛ/ΜΑΓ για βραχυχρόνια αγγελία όπου απαιτείται</li>
        </ul>
        <p className="mt-4">
          Δες περισσότερα στη σελίδα{" "}
          <Link href="/how-it-works" className="text-gold hover:underline">
            Πώς λειτουργεί
          </Link>
          .
        </p>
      </StaticSection>

      <div className="border-t border-border py-10">
        <OwnerListingLink size="lg">Ανέβασε αγγελία</OwnerListingLink>
      </div>
    </PublicPageLayout>
  );
}
