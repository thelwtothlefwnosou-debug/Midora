"use client";

import type { WizardPhaseId } from "@/lib/listing-wizard-steps";

export type PhaseIntroContent = {
  id: WizardPhaseId;
  title: string;
  subtitle: string;
  body: string;
};

/** Calm Midora phase interstitials — not Airbnb copy. */
export const WIZARD_PHASE_INTROS: Record<WizardPhaseId, PhaseIntroContent> = {
  about: {
    id: "about",
    title: "Το ακίνητό σου",
    subtitle: "Ξεκινάμε με τα βασικά",
    body: "Τύπος μίσθωσης, είδος ακινήτου, τοποθεσία και χωρητικότητα — ώστε η αγγελία να στηρίζεται σε σωστά στοιχεία από την αρχή.",
  },
  stand_out: {
    id: "stand_out",
    title: "Να ξεχωρίζει",
    subtitle: "Κάνε την αγγελία σου ελκυστική",
    body: "Τίτλος, περιγραφή, παροχές και φωτογραφίες — ό,τι βοηθά τους ενδιαφερόμενους να καταλάβουν γρήγορα αν ταιριάζει το ακίνητο.",
  },
  finish: {
    id: "finish",
    title: "Ολοκλήρωση",
    subtitle: "Τιμή, επικοινωνία και έλεγχος",
    body: "Όρισε τιμές και διαθεσιμότητα, τρόπους επικοινωνίας και δηλώσεις — μετά έλεγξε τα πάντα πριν την υποβολή για έλεγχο.",
  },
};

export function WizardPhaseIntro({ intro }: { intro: PhaseIntroContent }) {
  return (
    <div className="flex min-h-[42vh] flex-col justify-center py-6 sm:min-h-[48vh] sm:py-10">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-gold">
        {intro.subtitle}
      </p>
      <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-charcoal sm:text-4xl">
        {intro.title}
      </h2>
      <p className="mt-5 max-w-lg text-base leading-relaxed text-muted sm:text-lg">
        {intro.body}
      </p>
      <p className="mt-10 text-sm text-muted">
        Πάτα <span className="font-medium text-charcoal">Επόμενο</span> για να συνεχίσεις — ή
        πίσω αν θέλεις να επιστρέψεις.
      </p>
    </div>
  );
}

/** Map live wizard step (1-based) → phase id for intros. */
export function phaseIdForWizardStep(step: number): WizardPhaseId {
  if (step <= 4) return "about";
  if (step === 5 || step === 6 || step === 8) return "stand_out";
  return "finish";
}
