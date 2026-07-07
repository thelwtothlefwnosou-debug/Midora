"use client";



import { useState } from "react";

import { ChevronDown } from "lucide-react";

import { HOME_FAQ } from "@/lib/copy";

import { HomeSectionHeader } from "@/components/sections/HomeSectionHeader";

import { cn } from "@/lib/utils";



export function HomeFAQ() {

  const [openIndex, setOpenIndex] = useState<number | null>(null);



  return (

    <section id="faq" className="home-section home-bg-white border-t border-border">

      <div className="mx-auto max-w-[840px] px-4 sm:px-6">

        <HomeSectionHeader

          title="Συχνές ερωτήσεις"

          subtitle="Σύντομες απαντήσεις πριν ξεκινήσεις την αναζήτησή σου."

          centered

        />



        <div className="space-y-2.5">

          {HOME_FAQ.map((item, index) => {

            const isOpen = openIndex === index;

            return (

              <div

                key={item.question}

                className={cn("home-faq-item", isOpen && "is-open")}

              >

                <button

                  type="button"

                  aria-expanded={isOpen}

                  onClick={() => setOpenIndex(isOpen ? null : index)}

                  className="flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3.5 text-left text-sm font-medium text-charcoal/90 sm:px-5 sm:py-4"

                >

                  {item.question}

                  <ChevronDown

                    className={cn(

                      "h-4 w-4 shrink-0 text-muted transition-transform duration-300",

                      isOpen && "rotate-180"

                    )}

                  />

                </button>

                <div className="home-faq-answer" aria-hidden={!isOpen}>

                  <div className="home-faq-answer-inner">

                    <p className="border-t border-border px-4 pb-4 pt-2 text-sm leading-relaxed text-muted sm:px-5 sm:pb-5">

                      {item.answer}

                    </p>

                  </div>

                </div>

              </div>

            );

          })}

        </div>

      </div>

    </section>

  );

}

