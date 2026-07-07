"use client";

import { useState } from "react";
import {
  CheckCircle2,
  ExternalLink,
  FileText,
  Hash,
  ChevronRight,
} from "lucide-react";
import { LEGAL_REGISTRY_OPTIONS } from "@/lib/rental-types";
import {
  AADE_DISCLAIMER_NOTE,
  AADE_GUIDE_STEPS,
  AADE_SHORT_TERM_REGISTRY_URL,
  getRegistryHelperText,
  normalizeRegistryNumber,
  REGISTRY_FILLED_STATUS_LABEL,
} from "@/lib/registry-compliance";
import { isValidRegistryNumber } from "@/lib/listing-wizard-validation";
import type { LegalRegistryType } from "@/lib/types";

type Props = {
  legalRegistryType: string;
  amaNumber: string;
  onTypeChange: (type: string) => void;
  onNumberChange: (value: string) => void;
  inputClassName: string;
};

export function ShortTermRegistryComplianceCard({
  legalRegistryType,
  amaNumber,
  onTypeChange,
  onNumberChange,
  inputClassName,
}: Props) {
  const [showInput, setShowInput] = useState(() =>
    Boolean(normalizeRegistryNumber(amaNumber))
  );

  const type = (legalRegistryType || "ama") as LegalRegistryType;
  const normalized = normalizeRegistryNumber(amaNumber);
  const isValid = isValidRegistryNumber(type, normalized);

  function openAadeService() {
    window.open(AADE_SHORT_TERM_REGISTRY_URL, "_blank", "noopener,noreferrer");
    setShowInput(true);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gold/25 bg-white shadow-sm">
      <div className="border-b border-gold/15 bg-gradient-to-br from-gold/8 via-white to-ivory/80 px-5 py-5 sm:px-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold-dark">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display text-base font-semibold text-charcoal sm:text-lg">
              Αριθμός καταχώρισης βραχυχρόνιας μίσθωσης
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              Για βραχυχρόνια διαμονή, συμπλήρωσε τον αριθμό καταχώρισης που αντιστοιχεί
              στο ακίνητό σου.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-5 sm:p-6">
        <div className="rounded-xl border border-border bg-sand/30 p-4">
          <p className="text-sm font-semibold text-charcoal">Οδηγίες βήμα-βήμα</p>
          <ol className="mt-3 space-y-2.5">
            {AADE_GUIDE_STEPS.map((step, index) => (
              <li key={step} className="flex gap-3 text-sm leading-relaxed text-muted">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold/20 text-xs font-bold text-gold-dark">
                  {index + 1}
                </span>
                <span className="pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-[11px] leading-relaxed text-muted">{AADE_DISCLAIMER_NOTE}</p>
          <a
            href={AADE_SHORT_TERM_REGISTRY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-gold-dark hover:underline"
          >
            Επίσημη σελίδα ΑΑΔΕ
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>

        {!showInput && !isValid && (
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setShowInput(true)}
              className="group flex flex-col rounded-2xl border border-border bg-sand/20 p-5 text-left transition-colors hover:border-gold/40 hover:bg-gold/5"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold/15 text-gold-dark">
                <Hash className="h-4 w-4" />
              </div>
              <span className="mt-3 font-semibold text-charcoal">
                Έχω ήδη αριθμό καταχώρισης
              </span>
              <span className="mt-2 text-xs leading-relaxed text-muted">
                Συμπλήρωσε ΑΜΑ, ΕΣΛ ή ΜΑΓ για το ακίνητο.
              </span>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-gold-dark">
                Προσθήκη αριθμού
                <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </button>

            <button
              type="button"
              onClick={openAadeService}
              className="group flex flex-col rounded-2xl border border-border bg-sand/20 p-5 text-left transition-colors hover:border-gold/40 hover:bg-gold/5"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold/15 text-gold-dark">
                <ExternalLink className="h-4 w-4" />
              </div>
              <span className="mt-3 font-semibold text-charcoal">
                Χρειάζομαι αριθμό καταχώρισης
              </span>
              <span className="mt-2 text-xs leading-relaxed text-muted">
                Άνοιξε την επίσημη υπηρεσία της ΑΑΔΕ, ολοκλήρωσε τη διαδικασία και
                επέστρεψε εδώ για να συμπληρώσεις τον αριθμό σου.
              </span>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-gold-dark">
                Άνοιξε την υπηρεσία της ΑΑΔΕ
                <ExternalLink className="h-3 w-3" />
              </span>
            </button>
          </div>
        )}

        {showInput && (
          <div className="space-y-4 rounded-xl border border-border bg-ivory/50 p-4">
            <label className="block">
              <span className="text-xs font-medium uppercase tracking-wide text-muted">
                Τύπος αριθμού καταχώρισης *
              </span>
              <select
                value={legalRegistryType}
                onChange={(e) => onTypeChange(e.target.value)}
                className={inputClassName}
              >
                {LEGAL_REGISTRY_OPTIONS.filter((o) => o.value !== "none").map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-xs font-medium uppercase tracking-wide text-muted">
                Αριθμός καταχώρισης *
              </span>
              <input
                value={amaNumber}
                onChange={(e) => onNumberChange(e.target.value)}
                className={inputClassName}
                inputMode={type === "ama" ? "numeric" : "text"}
                autoComplete="off"
              />
              <span className="mt-1.5 block text-[11px] leading-relaxed text-muted">
                {getRegistryHelperText(type)}
              </span>
            </label>

            {!isValid && normalized.length > 0 && (
              <p className="text-xs text-amber-700">
                {type === "ama"
                  ? "Ο ΑΜΑ πρέπει να είναι ακριβώς 11 ψηφία."
                  : "Συμπλήρωσε έγκυρο αριθμό καταχώρισης."}
              </p>
            )}

            {!isValid && (
              <button
                type="button"
                onClick={() => setShowInput(false)}
                className="text-xs font-medium text-muted hover:text-charcoal"
              >
                ← Επιστροφή στις επιλογές
              </button>
            )}
          </div>
        )}

        {isValid && (
          <div className="rounded-xl border border-teal/25 bg-teal/5 p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-teal" />
              <div>
                <p className="text-sm font-semibold text-charcoal">
                  Αριθμός καταχώρισης προστέθηκε
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted">
                  Ο αριθμός θα ελεγχθεί ως προς τα βασικά στοιχεία της αγγελίας πριν από
                  τη δημοσίευση.
                </p>
                <p className="mt-2 text-[11px] font-medium text-teal">
                  Κατάσταση: {REGISTRY_FILLED_STATUS_LABEL}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
