"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRight, ChevronDown, Sparkles } from "lucide-react";
import { HelpAssistantTrigger } from "@/components/assistant/HelpAssistantContext";
import { cn } from "@/lib/utils";

const FAQ_GROUPS = [
  {
    id: "seekers",
    titleKey: "faqGroupSeekers",
    items: ["faqSeek1", "faqSeek2", "faqSeek3", "faqSeek4"] as const,
  },
  {
    id: "owners",
    titleKey: "faqGroupOwners",
    items: ["faqOwn1", "faqOwn2", "faqOwn3", "faqOwn4", "faqOwn5"] as const,
  },
] as const;

export function HomeFAQ() {
  const t = useTranslations("Home");
  const [openKey, setOpenKey] = useState<string | null>(FAQ_GROUPS[0].items[0]);

  return (
    <section
      id="faq"
      className="home-section home-section--editorial home-bg-white pb-24 sm:pb-28 lg:pb-32"
      aria-labelledby="home-faq-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:pr-8">
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,0.36fr)_minmax(0,0.64fr)] lg:gap-16 xl:gap-[4rem]">
          {/* Left */}
          <div className="min-w-0 lg:pt-0.5">
            <h2
              id="home-faq-heading"
              className="font-display text-[1.7rem] font-semibold leading-[1.14] tracking-tight text-charcoal sm:text-[2.05rem]"
            >
              {t("faqTitle")}
            </h2>
            <p className="mt-3.5 max-w-md text-[0.9375rem] leading-[1.65] text-muted sm:text-base sm:leading-relaxed">
              {t("faqSubtitle")}
            </p>

            <div className="mt-8 flex gap-4 rounded-2xl bg-[#f5efe6] px-5 py-5 sm:mt-9 sm:px-6 sm:py-6">
              <span
                className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-gold-dark shadow-[inset_0_0_0_1px_rgba(185,140,90,0.16)]"
                aria-hidden
              >
                <Sparkles className="h-[15px] w-[15px]" strokeWidth={1.6} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-display text-[1.02rem] font-semibold leading-snug tracking-tight text-charcoal sm:text-[1.08rem]">
                  {t("faqHelpPrompt")}
                </p>
                <p className="mt-1.5 text-[0.8125rem] leading-[1.6] text-charcoal/58">
                  {t("faqHelpHint")}
                </p>
                <HelpAssistantTrigger
                  label={t("faqHelpCta")}
                  className="mt-4 inline-flex min-h-[2.55rem] cursor-pointer items-center justify-center rounded-[0.8rem] bg-charcoal px-[1.05rem] text-[0.875rem] font-medium tracking-[0.01em] text-white transition-[background-color,transform] duration-200 hover:-translate-y-px hover:bg-charcoal/90"
                />
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="flex min-w-0 flex-col gap-9 sm:gap-10">
            {FAQ_GROUPS.map((group) => (
              <div key={group.id}>
                <p className="text-[11px] font-semibold tracking-[0.15em] text-gold-dark uppercase">
                  {t(group.titleKey)}
                </p>
                <div className="mt-3 border-t border-charcoal/[0.09]">
                  {group.items.map((key) => {
                    const isOpen = openKey === key;
                    return (
                      <div
                        key={key}
                        className={cn(
                          "border-b border-charcoal/[0.09] transition-[background-color,border-radius] duration-300",
                          isOpen
                            ? "rounded-xl bg-[#f6f0e7]/95"
                            : "hover:bg-[#f7f2ea]/45"
                        )}
                      >
                        <button
                          type="button"
                          aria-expanded={isOpen}
                          onClick={() => setOpenKey(isOpen ? null : key)}
                          className={cn(
                            "flex w-full cursor-pointer items-center justify-between gap-5 bg-transparent py-5 text-left sm:py-[1.35rem]",
                            isOpen ? "px-3 sm:px-3.5" : "px-0.5 sm:px-1"
                          )}
                        >
                          <span className="font-display text-[1.04rem] font-semibold leading-[1.35] tracking-tight text-charcoal sm:text-[1.125rem]">
                            {t(`${key}q`)}
                          </span>
                          <span
                            className={cn(
                              "inline-flex h-[1.9rem] w-[1.9rem] shrink-0 items-center justify-center rounded-full transition-[color,background-color,box-shadow] duration-300",
                              isOpen
                                ? "bg-white text-gold-dark shadow-[inset_0_0_0_1px_rgba(185,140,90,0.3)]"
                                : "bg-[#faf8f4] text-charcoal/40 shadow-[inset_0_0_0_1px_rgba(26,26,26,0.07)]"
                            )}
                            aria-hidden
                          >
                            <ChevronDown
                              className={cn(
                                "h-4 w-4 transition-transform duration-[320ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
                                isOpen && "rotate-180"
                              )}
                              strokeWidth={1.7}
                            />
                          </span>
                        </button>
                        <div
                          className={cn(
                            "grid transition-[grid-template-rows] duration-[320ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
                            isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                          )}
                        >
                          <div className="min-h-0 overflow-hidden">
                            <p
                              className={cn(
                                "max-w-[44rem] pb-5 text-[0.9375rem] leading-[1.75] text-muted sm:pb-6",
                                isOpen ? "px-3 pr-12 sm:px-3.5 sm:pr-14" : "pr-12"
                              )}
                            >
                              {t(`${key}a`)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            <Link
              href="/faq"
              className="group mt-1 inline-flex items-center gap-2 self-start text-[0.95rem] font-medium text-gold-dark underline-offset-[0.22em] transition-[color,gap] duration-200 hover:gap-2.5 hover:text-charcoal hover:underline"
            >
              {t("faqSeeAll")}
              <ArrowRight
                className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                strokeWidth={1.7}
              />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
