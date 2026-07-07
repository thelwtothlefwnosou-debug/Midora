"use client";

import Link from "next/link";

type DeclarationItem = {
  id: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description: React.ReactNode;
};

function DeclarationCheckbox({
  checked,
  onChange,
  label,
  description,
}: Omit<DeclarationItem, "id">) {
  return (
    <label className="flex gap-3 rounded-xl border border-border bg-sand/20 p-4 text-sm leading-relaxed">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 accent-gold"
      />
      <span>
        <span className="block font-semibold text-charcoal">{label}</span>
        <span className="mt-2 block text-muted">{description}</span>
      </span>
    </label>
  );
}

const legalLinkClass = "font-medium text-gold-dark hover:underline";

type Props = {
  needsRegistryDeclaration: boolean;
  ownerAccepted: boolean;
  registryAccepted: boolean;
  platformAccepted: boolean;
  termsAccepted: boolean;
  onOwnerChange: (v: boolean) => void;
  onRegistryChange: (v: boolean) => void;
  onPlatformChange: (v: boolean) => void;
  onTermsChange: (v: boolean) => void;
  allRequiredChecked: boolean;
};

export function ListingWizardDeclarationsStep({
  needsRegistryDeclaration,
  ownerAccepted,
  registryAccepted,
  platformAccepted,
  termsAccepted,
  onOwnerChange,
  onRegistryChange,
  onPlatformChange,
  onTermsChange,
  allRequiredChecked,
}: Props) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-xl font-semibold text-charcoal">
          Δηλώσεις και υποβολή
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Διάβασε και επίλεξε όλες τις απαιτούμενες δηλώσεις πριν υποβάλεις την αγγελία
          για έλεγχο.
        </p>
      </div>

      <div className="space-y-3">
        <DeclarationCheckbox
          checked={ownerAccepted}
          onChange={onOwnerChange}
          label="Βεβαιώνω ότι έχω δικαίωμα να δημοσιεύσω την αγγελία."
          description="Δηλώνω ότι τα στοιχεία του ακινήτου, οι φωτογραφίες, η περιοχή, η τιμή και οι όροι που υπέβαλα είναι πλήρη και ακριβή, και ότι έχω δικαίωμα να δημοσιεύσω την αγγελία."
        />

        {needsRegistryDeclaration && (
          <DeclarationCheckbox
            checked={registryAccepted}
            onChange={onRegistryChange}
            label="Βεβαιώνω ότι ο αριθμός καταχώρισης αντιστοιχεί στο ακίνητο."
            description="Δηλώνω ότι ο ΑΜΑ, ΕΣΛ ή ΜΑΓ που συμπλήρωσα αντιστοιχεί στο ακίνητο που δημοσιεύω και ότι αναλαμβάνω τις υποχρεώσεις που προβλέπονται για τη συγκεκριμένη μορφή μίσθωσης."
          />
        )}

        <DeclarationCheckbox
          checked={platformAccepted}
          onChange={onPlatformChange}
          label="Κατανοώ τον ρόλο του Midora."
          description="Κατανοώ ότι το Midora λειτουργεί ως πλατφόρμα προβολής αγγελιών και αρχικής επικοινωνίας. Η διαθεσιμότητα, η τελική συμφωνία, τυχόν πληρωμή και οι σχετικές φορολογικές ή νομικές υποχρεώσεις συμφωνούνται και πραγματοποιούνται απευθείας μεταξύ των μερών, εκτός Midora."
        />

        <DeclarationCheckbox
          checked={termsAccepted}
          onChange={onTermsChange}
          label="Αποδέχομαι τους Όρους Χρήσης και έχω λάβει γνώση της Πολιτικής Απορρήτου."
          description={
            <>
              Οι{" "}
              <Link
                href="/terms"
                target="_blank"
                rel="noopener noreferrer"
                className={legalLinkClass}
              >
                Όροι Χρήσης
              </Link>
              , οι{" "}
              <Link
                href="/listing-rules"
                target="_blank"
                rel="noopener noreferrer"
                className={legalLinkClass}
              >
                Κανόνες Δημοσίευσης Αγγελιών
              </Link>{" "}
              και η{" "}
              <Link
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className={legalLinkClass}
              >
                Πολιτική Απορρήτου
              </Link>{" "}
              εξηγούν τους κανόνες χρήσης του Midora και τον τρόπο διαχείρισης των
              δεδομένων.
            </>
          }
        />
      </div>

      <p className={allRequiredChecked ? "text-sm text-teal" : "text-sm text-muted"}>
        {allRequiredChecked
          ? "Η αγγελία είναι έτοιμη για υποβολή σε βασικό έλεγχο."
          : "Επίλεξε όλες τις απαιτούμενες δηλώσεις για να συνεχίσεις."}
      </p>
    </div>
  );
}

export function areWizardDeclarationsComplete(input: {
  needsRegistryDeclaration: boolean;
  ownerAccepted: boolean;
  registryAccepted: boolean;
  platformAccepted: boolean;
  termsAccepted: boolean;
}): boolean {
  return (
    input.ownerAccepted &&
    input.platformAccepted &&
    input.termsAccepted &&
    (!input.needsRegistryDeclaration || input.registryAccepted)
  );
}
