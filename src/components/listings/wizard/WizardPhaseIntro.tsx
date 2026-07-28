"use client";

import { useTranslations } from "next-intl";
import type { WizardPhaseId } from "@/lib/listing-wizard-steps";

export type PhaseIntroContent = {
  id: WizardPhaseId;
};

/** Calm Midora phase interstitials — copy lives in Wizard.phaseIntro messages. */
export const WIZARD_PHASE_INTROS: Record<WizardPhaseId, PhaseIntroContent> = {
  about: { id: "about" },
  stand_out: { id: "stand_out" },
  finish: { id: "finish" },
};

function phaseIntroKeyPrefix(id: WizardPhaseId): "about" | "standOut" | "finish" {
  if (id === "stand_out") return "standOut";
  return id;
}

export function WizardPhaseIntro({ intro }: { intro: PhaseIntroContent }) {
  const t = useTranslations("Wizard.phaseIntro");
  const prefix = phaseIntroKeyPrefix(intro.id);

  return (
    <div className="flex min-h-[42vh] flex-col justify-center py-6 sm:min-h-[48vh] sm:py-10">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-gold">
        {t(`${prefix}Subtitle`)}
      </p>
      <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-charcoal sm:text-4xl">
        {t(`${prefix}Title`)}
      </h2>
      <p className="mt-5 max-w-lg text-base leading-relaxed text-muted sm:text-lg">
        {t(`${prefix}Body`)}
      </p>
      <p className="mt-10 text-sm text-muted">
        {t.rich("ctaHint", {
          next: (chunks) => (
            <span className="font-medium text-charcoal">{chunks}</span>
          ),
        })}
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
