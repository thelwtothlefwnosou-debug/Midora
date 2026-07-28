"use client";



import { useEffect, useId, useState, type ReactNode } from "react";

import { createPortal } from "react-dom";

import { ChevronDown, ExternalLink, X } from "lucide-react";

import { useTranslations } from "next-intl";

import {

  AADE_GUIDE_DISCLAIMER,

  AADE_GUIDE_OFFICIAL_URL,

  type AadeGuideTab,

} from "@/lib/aade-owner-guide";

import { cn } from "@/lib/utils";



type Props = {

  open: boolean;

  onClose: () => void;

  defaultTab?: AadeGuideTab;

};



function StepList({ steps }: { steps: readonly string[] }) {

  return (

    <ol className="space-y-2.5">

      {steps.map((step, index) => (

        <li

          key={step}

          className="flex gap-3 rounded-xl border border-border/80 bg-sand/20 px-3.5 py-3"

        >

          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold/15 text-xs font-semibold text-gold-dark">

            {index + 1}

          </span>

          <span className="pt-0.5 text-sm leading-relaxed text-charcoal/85">{step}</span>

        </li>

      ))}

    </ol>

  );

}



function SectionCard({

  title,

  children,

}: {

  title: string;

  children: ReactNode;

}) {

  return (

    <section className="space-y-3">

      <h4 className="font-display text-sm font-semibold text-charcoal">{title}</h4>

      {children}

    </section>

  );

}



export function AadeOwnerGuideModal({

  open,

  onClose,

  defaultTab = "short_term",

}: Props) {

  const t = useTranslations("Aade.guide");

  const titleId = useId();

  const [mounted, setMounted] = useState(false);

  const [tab, setTab] = useState<AadeGuideTab>(defaultTab);

  const [faqOpen, setFaqOpen] = useState(false);



  const shortTermBeforeSteps = [

    t("shortTerm.before1"),

    t("shortTerm.before2"),

    t("shortTerm.before3"),

    t("shortTerm.before4"),

    t("shortTerm.before5"),

  ] as const;



  const shortTermAfterSteps = [

    t("shortTerm.after1"),

    t("shortTerm.after2"),

    t("shortTerm.after3"),

    t("shortTerm.after4"),

    t("shortTerm.after5"),

    t("shortTerm.after6"),

  ] as const;



  const monthlySteps = [

    t("monthly.step1"),

    t("monthly.step2"),

    t("monthly.step3"),

    t("monthly.step4"),

    t("monthly.step5"),

  ] as const;



  useEffect(() => {

    setMounted(true);

  }, []);



  useEffect(() => {

    if (!open) return;

    setTab(defaultTab);

    setFaqOpen(false);

  }, [open, defaultTab]);



  useEffect(() => {

    if (!open) return;

    const prev = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    function onKey(e: KeyboardEvent) {

      if (e.key === "Escape") onClose();

    }

    window.addEventListener("keydown", onKey);

    return () => {

      document.body.style.overflow = prev;

      window.removeEventListener("keydown", onKey);

    };

  }, [open, onClose]);



  if (!open || !mounted) return null;



  return createPortal(

    <div

      className="fixed inset-0 z-[200] flex items-end justify-center sm:items-center sm:p-4"

      role="presentation"

    >

      <button

        type="button"

        aria-label={t("close")}

        className="absolute inset-0 bg-charcoal/45"

        onClick={onClose}

      />

      <div

        role="dialog"

        aria-modal="true"

        aria-labelledby={titleId}

        className={cn(

          "relative z-[1] flex w-full flex-col overflow-hidden bg-white shadow-xl",

          "max-h-[min(94dvh,820px)] rounded-t-3xl sm:max-w-[720px] sm:rounded-3xl"

        )}

      >

        <div className="shrink-0 border-b border-border/80 bg-gradient-to-br from-ivory via-white to-sand/40 px-5 pb-4 pt-4 sm:px-6 sm:pt-5">

          <div className="flex items-start justify-between gap-3">

            <div className="min-w-0">

              <h3

                id={titleId}

                className="font-display text-lg font-semibold text-charcoal sm:text-xl"

              >

                {t("modalTitle")}

              </h3>

              <p className="mt-1.5 text-sm leading-relaxed text-muted">

                {t("modalSubtitle")}

              </p>

            </div>

            <button

              type="button"

              onClick={onClose}

              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-charcoal/55 transition-colors hover:bg-sand hover:text-charcoal"

              aria-label={t("close")}

            >

              <X className="h-4 w-4" />

            </button>

          </div>



          <div

            className="mt-4 flex rounded-xl border border-border bg-white/80 p-1"

            role="tablist"

            aria-label={t("rentalTypeAria")}

          >

            {(

              [

                { id: "short_term" as const, label: t("shortTerm.label") },

                { id: "monthly" as const, label: t("monthly.label") },

              ] as const

            ).map((item) => (

              <button

                key={item.id}

                type="button"

                role="tab"

                aria-selected={tab === item.id}

                onClick={() => setTab(item.id)}

                className={cn(

                  "min-h-10 flex-1 rounded-lg px-3 text-sm font-medium transition-colors",

                  tab === item.id

                    ? "bg-charcoal text-white shadow-sm"

                    : "text-muted hover:bg-sand/60 hover:text-charcoal"

                )}

              >

                {item.label}

              </button>

            ))}

          </div>

        </div>



        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">

          {tab === "short_term" ? (

            <div className="space-y-6">

              <div>

                <h4 className="font-display text-base font-semibold text-charcoal">

                  {t("shortTerm.title")}

                </h4>

                <p className="mt-2 text-sm leading-relaxed text-muted">

                  {t("shortTerm.intro")}

                </p>

              </div>

              <SectionCard title={t("shortTerm.beforeTitle")}>

                <StepList steps={shortTermBeforeSteps} />

              </SectionCard>

              <SectionCard title={t("shortTerm.afterTitle")}>

                <StepList steps={shortTermAfterSteps} />

              </SectionCard>

              <p className="rounded-xl border border-border/70 bg-sand/25 px-3.5 py-3 text-xs leading-relaxed text-muted">

                {t("shortTerm.note")}

              </p>

              <a

                href={AADE_GUIDE_OFFICIAL_URL}

                target="_blank"

                rel="noopener noreferrer"

                className="inline-flex items-center gap-1.5 text-xs font-semibold text-gold-dark hover:underline"

              >

                {t("officialPage")}

                <ExternalLink className="h-3.5 w-3.5" />

              </a>

            </div>

          ) : (

            <div className="space-y-6">

              <div>

                <h4 className="font-display text-base font-semibold text-charcoal">

                  {t("monthly.title")}

                </h4>

                <p className="mt-2 text-sm leading-relaxed text-muted">

                  {t("monthly.intro")}

                </p>

              </div>

              <StepList steps={monthlySteps} />

              <p className="rounded-xl border border-border/70 bg-sand/25 px-3.5 py-3 text-xs leading-relaxed text-muted">

                {t("monthly.note")}

              </p>

            </div>

          )}



          <div className="mt-8 border-t border-border/70 pt-5">

            <button

              type="button"

              onClick={() => setFaqOpen((v) => !v)}

              aria-expanded={faqOpen}

              className="flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-sand/15 px-4 py-3 text-left transition-colors hover:bg-sand/30"

            >

              <span className="text-sm font-medium text-charcoal">

                {t("faq.question")}

              </span>

              <ChevronDown

                className={cn(

                  "h-4 w-4 shrink-0 text-muted transition-transform",

                  faqOpen && "rotate-180"

                )}

              />

            </button>

            {faqOpen && (

              <p className="mt-3 px-1 text-sm leading-relaxed text-muted">

                {t("faq.answer")}

              </p>

            )}

          </div>



          <p className="mt-6 border-t border-border/70 pt-4 text-[11px] leading-relaxed text-muted/90">

            {AADE_GUIDE_DISCLAIMER}

          </p>

        </div>



        <div className="shrink-0 border-t border-border bg-white px-5 py-3.5 sm:px-6">

          <div className="flex flex-wrap justify-end gap-2">

            <button

              type="button"

              onClick={onClose}

              className="inline-flex min-h-10 items-center justify-center rounded-xl border border-border px-4 text-sm font-medium text-charcoal transition-colors hover:bg-sand"

            >

              {t("close")}

            </button>

            <button

              type="button"

              onClick={onClose}

              className="inline-flex min-h-10 items-center justify-center rounded-xl bg-charcoal px-4 text-sm font-semibold text-white transition-colors hover:bg-charcoal/90"

            >

              {t("gotIt")}

            </button>

          </div>

        </div>

      </div>

    </div>,

    document.body

  );

}

