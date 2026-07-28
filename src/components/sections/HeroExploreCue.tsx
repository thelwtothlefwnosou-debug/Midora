"use client";

import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";

export function HeroExploreCue() {
  const t = useTranslations("Home");

  return (
    <a
      href="#explore"
      className="home-hero-explore"
      aria-label={t("exploreAria")}
    >
      <span className="home-hero-explore__label">{t("exploreLabel")}</span>
      <span className="home-hero-explore__icon" aria-hidden>
        <ChevronDown className="h-5 w-5" strokeWidth={1.75} />
      </span>
    </a>
  );
}
