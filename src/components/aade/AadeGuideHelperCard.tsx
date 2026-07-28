"use client";



import { useState } from "react";

import { BookOpen, ChevronRight, Info } from "lucide-react";

import { useTranslations } from "next-intl";

import { AadeOwnerGuideModal } from "@/components/aade/AadeOwnerGuideModal";

import {

  defaultTabForRentalMode,

  type AadeGuideTab,

  type AadeHelperVariant,

} from "@/lib/aade-owner-guide";

import { cn } from "@/lib/utils";



type Props = {

  variant: AadeHelperVariant;

  /** Default modal tab — usually matches rental mode. */

  defaultTab?: AadeGuideTab;

  className?: string;

};



const ICONS = {

  short_term: Info,

  monthly: BookOpen,

  review: BookOpen,

  dashboard: BookOpen,

} as const;



export function AadeGuideHelperCard({

  variant,

  defaultTab,

  className,

}: Props) {

  const t = useTranslations("Aade.guide.helper");

  const [open, setOpen] = useState(false);

  const Icon = ICONS[variant];

  const tab =

    defaultTab ??

    defaultTabForRentalMode(

      variant === "monthly" ? "monthly" : "short_term"

    );

  const note = variant === "short_term" ? t(`${variant}.note`) : null;



  return (

    <>

      <div

        className={cn(

          "rounded-2xl border border-border/80 bg-sand/30 px-4 py-3.5",

          className

        )}

      >

        <div className="flex items-start gap-3">

          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gold/12 text-gold-dark">

            <Icon className="h-4 w-4" />

          </div>

          <div className="min-w-0 flex-1">

            <p className="text-sm font-semibold text-charcoal">{t(`${variant}.title`)}</p>

            <p className="mt-1 text-xs leading-relaxed text-muted sm:text-[13px]">

              {t(`${variant}.body`)}

            </p>

            <button

              type="button"

              onClick={() => setOpen(true)}

              className="mt-2.5 inline-flex items-center gap-1 text-xs font-semibold text-gold-dark transition-colors hover:text-charcoal"

            >

              {t(`${variant}.cta`)}

              <ChevronRight className="h-3.5 w-3.5" />

            </button>

            {note ? (

              <p className="mt-2 text-[11px] leading-relaxed text-muted/85">

                {note}

              </p>

            ) : null}

          </div>

        </div>

      </div>



      <AadeOwnerGuideModal

        open={open}

        onClose={() => setOpen(false)}

        defaultTab={tab}

      />

    </>

  );

}

