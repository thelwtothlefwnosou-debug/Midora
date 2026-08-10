"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  CalendarDays,
  Camera,
  ChevronDown,
  ChevronRight,
  Clock3,
  Euro,
  FileText,
  Heart,
  Home,
  MapPin,
  MessageCircle,
  Search,
  Shield,
  Users,
} from "lucide-react";
import { AuthPanel } from "@/components/auth/AuthPanel";
import { cn } from "@/lib/utils";

type Mode = "login" | "register";

/** Warm dark-gray body copy — stronger than default muted, not pure black. */
const body = "text-charcoal/65";
const bodySoft = "text-charcoal/58";

const primaryCtaClass =
  "inline-flex min-h-12 items-center justify-center rounded-full bg-gold px-7 text-sm font-medium text-white shadow-[0_3px_14px_-4px_rgba(193,154,107,0.28)] transition-colors hover:bg-gold-dark";

const secondaryCtaClass =
  "inline-flex min-h-12 items-center justify-center rounded-full border border-border bg-white px-7 text-sm font-medium text-charcoal transition-colors hover:border-gold/35 hover:bg-sand/50";

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border/80 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex min-h-14 w-full items-center justify-between gap-4 py-4 text-left transition-colors hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
      >
        <span className="text-[0.9375rem] font-medium leading-snug text-charcoal sm:text-base">
          {q}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-charcoal/45 transition-transform motion-reduce:transition-none",
            open && "rotate-180"
          )}
        />
      </button>
      {open ? (
        <p className={cn("pb-5 pr-8 text-[0.9375rem] leading-relaxed", body)} role="region">
          {a}
        </p>
      ) : null}
    </div>
  );
}

function HowSteps({
  title,
  steps,
  label,
  body: bodyFn,
}: {
  title: string;
  steps: readonly (readonly [string, string])[];
  label: (key: string) => string;
  body: (key: string) => string;
}) {
  return (
    <div>
      <h3 className="font-display text-lg font-semibold tracking-tight text-charcoal sm:text-xl">
        {title}
      </h3>
      <ol className="mt-5 space-y-5 sm:mt-6">
        {steps.map(([titleKey, bodyKey], i) => (
          <li key={titleKey} className="flex gap-4">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sand text-xs font-semibold tracking-wide text-charcoal">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className="min-w-0 pt-0.5">
              <p className="text-[0.9375rem] font-semibold text-charcoal sm:text-base">
                {label(titleKey)}
              </p>
              <p className={cn("mt-1 text-sm leading-relaxed sm:text-[0.9375rem]", body)}>
                {bodyFn(bodyKey)}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function FeatureRow({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  label: string;
}) {
  return (
    <li className="flex items-center gap-3 text-[0.9375rem] text-charcoal/85">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sand/80 text-gold-dark">
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <span>{label}</span>
    </li>
  );
}

export function AuthMarketingPage({
  initialMode,
  redirectTo,
  errorCode,
  referralCode,
}: {
  initialMode: Mode;
  redirectTo: string;
  errorCode?: string | null;
  referralCode?: string | null;
}) {
  const t = useTranslations("Auth.explainer");
  const tFooter = useTranslations("Footer");
  const [mode, setMode] = useState<Mode>(initialMode);

  function focusForm(nextMode?: Mode) {
    if (nextMode) setMode(nextMode);
    const el = document.getElementById("auth-form");
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => {
      const input = document.getElementById("auth-email") as HTMLInputElement | null;
      input?.focus();
    }, 350);
  }

  const seekSteps = [
    ["howSeek1Title", "howSeek1Body"],
    ["howSeek2Title", "howSeek2Body"],
    ["howSeek3Title", "howSeek3Body"],
    ["howSeek4Title", "howSeek4Body"],
  ] as const;
  const ownSteps = [
    ["howOwn1Title", "howOwn1Body"],
    ["howOwn2Title", "howOwn2Body"],
    ["howOwn3Title", "howOwn3Body"],
    ["howOwn4Title", "howOwn4Body"],
  ] as const;

  const journey = [
    { icon: Search, label: t("journeySearch") },
    { icon: Heart, label: t("journeyFavorites") },
    { icon: MessageCircle, label: t("journeyMessages") },
    { icon: Home, label: t("journeyListings") },
  ] as const;

  const shortFeatures = [
    { icon: MapPin, label: t("shortPoint1") },
    { icon: CalendarDays, label: t("shortPoint2") },
    { icon: Users, label: t("shortPoint3") },
    { icon: Euro, label: t("shortPoint4") },
    { icon: MessageCircle, label: t("shortPoint5") },
  ] as const;

  const monthlyFeatures = [
    { icon: MapPin, label: t("monthlyPoint1") },
    { icon: CalendarDays, label: t("monthlyPoint2") },
    { icon: Clock3, label: t("monthlyPoint3") },
    { icon: Users, label: t("monthlyPoint4") },
    { icon: Euro, label: t("monthlyPoint5") },
    { icon: MessageCircle, label: t("monthlyPoint6") },
  ] as const;

  return (
    <div className="pb-[max(2.75rem,env(safe-area-inset-bottom))]">
      {/* Hero + form share one desktop row so the card sits high in the first viewport */}
      <div className="mx-auto w-full max-w-6xl px-4 pt-6 sm:px-6 sm:pt-8 lg:pt-9">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(360px,420px)] lg:items-start lg:gap-10 xl:gap-12">
          <div className="order-1 max-w-3xl lg:col-start-1 lg:row-start-1">
            <p className="text-[11px] font-semibold tracking-[0.16em] text-gold uppercase sm:text-xs">
              {t("eyebrow")}
            </p>
            <h1 className="mt-3.5 font-display text-[2rem] font-semibold leading-[1.12] tracking-tight text-charcoal sm:mt-4 sm:text-[2.5rem] lg:text-[2.75rem]">
              {mode === "login" ? t("loginCompactTitle") : t("title")}
            </h1>
            <p
              className={cn(
                "mt-3.5 max-w-2xl text-[0.9375rem] leading-relaxed sm:mt-4 sm:text-base lg:text-lg lg:leading-relaxed",
                body
              )}
            >
              {mode === "login" ? t("loginCompactBody") : t("subtitle")}
            </p>

            <ul className="mt-6 flex flex-col gap-2.5 sm:mt-7 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-5 sm:gap-y-2">
              {[
                t("valueFreeListing"),
                t("valueNoCommission"),
                t("valueDirect"),
              ].map((label, i) => (
                <li
                  key={label}
                  className="flex items-center gap-3 text-sm font-medium text-charcoal sm:text-[0.9375rem]"
                >
                  {i > 0 ? (
                    <span
                      className="hidden h-1 w-1 rounded-full bg-charcoal/25 sm:inline-block"
                      aria-hidden
                    />
                  ) : null}
                  <span className="inline-flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-gold sm:hidden" aria-hidden />
                    {label}
                  </span>
                </li>
              ))}
            </ul>

            <p className={cn("mt-4 text-sm leading-relaxed sm:mt-5", bodySoft)}>
              {t("roleStatement")}
            </p>
          </div>

          <div className="order-2 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:sticky lg:top-[4.75rem] lg:self-start">
            <AuthPanel
              layout="card"
              initialMode={mode}
              redirectTo={redirectTo}
              errorCode={errorCode}
              referralCode={referralCode}
              onModeChange={setMode}
            />
          </div>

          <div className="order-3 lg:col-start-1 lg:row-start-2 lg:pt-2">
            <h2 className="font-display text-2xl font-semibold tracking-tight text-charcoal sm:text-[1.75rem]">
              {t("howTitle")}
            </h2>
            <div className="mt-7 grid gap-9 sm:grid-cols-2 lg:grid-cols-1 xl:mt-8 xl:grid-cols-2 xl:gap-10">
              <HowSteps
                title={t("howSeekersTitle")}
                steps={seekSteps}
                label={(k) => t(k as "howSeek1Title")}
                body={(k) => t(k as "howSeek1Body")}
              />
              <HowSteps
                title={t("howOwnersTitle")}
                steps={ownSteps}
                label={(k) => t(k as "howOwn1Title")}
                body={(k) => t(k as "howOwn1Body")}
              />
            </div>
          </div>
        </div>

        <p
          className={cn(
            "mt-10 text-center text-xs leading-relaxed tracking-wide sm:mt-12 sm:text-[0.8125rem]",
            bodySoft
          )}
        >
          {t("trustStrip")}
        </p>
      </div>

      {/* ——— Short vs Monthly ——— */}
      <section className="mt-12 bg-sand/45 sm:mt-14 lg:mt-16">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-14 lg:py-16">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-2xl font-semibold tracking-tight text-charcoal sm:text-3xl">
              {t("modesTitle")}
            </h2>
          </div>
          <div className="mt-9 grid gap-5 lg:mt-10 lg:grid-cols-2 lg:gap-6">
            <article className="rounded-[1.35rem] border border-border/80 bg-white p-7 shadow-[0_12px_40px_-24px_rgba(31,26,23,0.28)] sm:p-8 lg:p-9">
              <h3 className="font-display text-xl font-semibold tracking-tight text-charcoal sm:text-2xl">
                {t("shortTitle")}
              </h3>
              <p className={cn("mt-3 text-[0.9375rem] leading-relaxed sm:text-base", body)}>
                {t("shortBody")}
              </p>
              <ul className="mt-7 space-y-3.5">
                {shortFeatures.map((f) => (
                  <FeatureRow key={f.label} icon={f.icon} label={f.label} />
                ))}
              </ul>
              <p className="mt-7 text-sm font-medium text-gold-dark">{t("shortFooter")}</p>
            </article>
            <article className="rounded-[1.35rem] border border-border/80 bg-white p-7 shadow-[0_12px_40px_-24px_rgba(31,26,23,0.28)] sm:p-8 lg:p-9">
              <h3 className="font-display text-xl font-semibold tracking-tight text-charcoal sm:text-2xl">
                {t("monthlyTitle")}
              </h3>
              <p className={cn("mt-3 text-[0.9375rem] leading-relaxed sm:text-base", body)}>
                {t("monthlyBody")}
              </p>
              <ul className="mt-7 space-y-3.5">
                {monthlyFeatures.map((f) => (
                  <FeatureRow key={f.label} icon={f.icon} label={f.label} />
                ))}
              </ul>
              <p className="mt-7 text-sm font-medium text-gold-dark">{t("monthlyFooter")}</p>
            </article>
          </div>
        </div>
      </section>

      {/* ——— Audience ——— */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-14 lg:py-16">
        <h2 className="font-display text-2xl font-semibold tracking-tight text-charcoal sm:text-3xl">
          {t("audienceTitle")}
        </h2>
        <div className="mt-8 grid gap-5 lg:mt-9 lg:grid-cols-2 lg:gap-7">
          <div className="rounded-[1.35rem] bg-sand/50 px-6 py-7 sm:px-8 sm:py-8">
            <h3 className="font-display text-xl font-semibold text-charcoal">
              {t("audienceSeekPanelTitle")}
            </h3>
            <ul className={cn("mt-5 space-y-3 text-[0.9375rem] leading-relaxed sm:text-base", body)}>
              <li>{t("audienceSeekBenefit1")}</li>
              <li>{t("audienceSeekBenefit2")}</li>
              <li>{t("audienceSeekBenefit3")}</li>
              <li>{t("audienceSeekBenefit4")}</li>
            </ul>
          </div>
          <div className="rounded-[1.35rem] bg-sand/50 px-6 py-7 sm:px-8 sm:py-8">
            <h3 className="font-display text-xl font-semibold text-charcoal">
              {t("audienceOwnPanelTitle")}
            </h3>
            <ul className={cn("mt-5 space-y-3 text-[0.9375rem] leading-relaxed sm:text-base", body)}>
              <li>{t("audienceOwnBenefit1")}</li>
              <li>{t("audienceOwnBenefit2")}</li>
              <li>{t("audienceOwnBenefit3")}</li>
              <li>{t("audienceOwnBenefit4")}</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ——— Free / No commission ——— */}
      <section className="bg-charcoal text-white">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16 lg:py-20">
          <h2 className="mx-auto max-w-3xl text-center font-display text-2xl font-semibold tracking-tight sm:text-3xl lg:text-[2.15rem]">
            {t("valueComboTitle")}
          </h2>
          <div className="mt-10 grid gap-10 sm:mt-12 sm:grid-cols-2 sm:gap-8 lg:gap-16">
            <div className="text-center sm:text-left">
              <p className="font-display text-5xl font-semibold tracking-tight text-gold sm:text-6xl">
                {t("valueFreeAmount")}
              </p>
              <p className="mt-3 text-sm font-medium tracking-wide text-white/75 uppercase sm:text-[0.8125rem]">
                {t("valueFreeAmountLabel")}
              </p>
              <p className="mt-4 text-[0.9375rem] leading-relaxed text-white/85 sm:text-base">
                {t("valueFreeColBody")}
              </p>
            </div>
            <div className="text-center sm:text-left">
              <p className="font-display text-5xl font-semibold tracking-tight text-gold sm:text-6xl">
                {t("valueCommissionAmount")}
              </p>
              <p className="mt-3 text-sm font-medium tracking-wide text-white/75 uppercase sm:text-[0.8125rem]">
                {t("valueCommissionAmountLabel")}
              </p>
              <p className="mt-4 text-[0.9375rem] leading-relaxed text-white/85 sm:text-base">
                {t("valueCommissionColBody")}
              </p>
            </div>
          </div>
          <p className="mx-auto mt-10 max-w-2xl text-center text-[0.9375rem] leading-relaxed text-white/80 sm:mt-12 sm:text-base">
            {t("valueComboSupport")}
          </p>
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={() => focusForm("register")}
              className={cn(primaryCtaClass, "w-full sm:w-auto")}
            >
              {t("freeCta")}
            </button>
          </div>
        </div>
      </section>

      {/* ——— One account journey ——— */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-14 lg:py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-charcoal sm:text-3xl">
            {t("oneAccountTitle")}
          </h2>
          <p className={cn("mt-4 text-[0.9375rem] leading-relaxed sm:text-base", body)}>
            {t("oneAccountBody")}
          </p>
        </div>
        <ol className="mx-auto mt-9 flex max-w-3xl flex-col items-stretch gap-2.5 sm:mt-10 lg:max-w-none lg:flex-row lg:items-center lg:justify-center lg:gap-1.5">
          {journey.map((step, i) => (
            <li key={step.label} className="flex flex-col items-stretch gap-2.5 lg:contents">
              <div className="flex flex-1 items-center gap-3 rounded-2xl bg-sand/50 px-4 py-3.5 lg:flex-none lg:min-w-[8.75rem] lg:flex-col lg:gap-2 lg:px-4 lg:py-4 lg:text-center">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-gold-dark shadow-soft">
                  <step.icon className="h-4 w-4" aria-hidden />
                </span>
                <span className="text-sm font-medium text-charcoal">{step.label}</span>
              </div>
              {i < journey.length - 1 ? (
                <>
                  <div className="flex justify-center lg:hidden" aria-hidden>
                    <ChevronRight className="h-4 w-4 rotate-90 text-gold-dark/55" />
                  </div>
                  <ChevronRight
                    className="mx-0.5 hidden h-5 w-5 shrink-0 text-gold-dark/50 lg:block"
                    aria-hidden
                  />
                </>
              ) : null}
            </li>
          ))}
        </ol>
      </section>

      {/* ——— Direct communication ——— */}
      <section className="bg-sand/45">
        <div className="mx-auto max-w-3xl px-4 py-12 text-center sm:px-6 sm:py-14 lg:py-16">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-gold-dark shadow-soft">
            <MessageCircle className="h-5 w-5" aria-hidden />
          </span>
          <h2 className="mt-5 font-display text-2xl font-semibold tracking-tight text-charcoal sm:mt-6 sm:text-3xl">
            {t("directTitle")}
          </h2>
          <p className={cn("mt-4 text-[0.9375rem] leading-relaxed sm:text-base", body)}>
            {t("directP1")}
          </p>
          <p className={cn("mt-3 text-[0.9375rem] leading-relaxed sm:text-base", body)}>
            {t("directP2")}
          </p>
        </div>
      </section>

      {/* ——— Privacy / control ——— */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-14 lg:py-16">
        <div className="rounded-[1.5rem] border border-border/80 bg-sand/70 px-6 py-9 sm:px-10 sm:py-11 lg:px-14 lg:py-12">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-12">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-gold-dark shadow-soft">
              <Shield className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0 max-w-3xl">
              <h2 className="font-display text-2xl font-semibold tracking-tight text-charcoal sm:text-3xl">
                {t("privacyTitle")}
              </h2>
              <p className={cn("mt-4 text-[0.9375rem] leading-relaxed sm:text-base", body)}>
                {t("privacyP1")}
              </p>
              <p className={cn("mt-3 text-[0.9375rem] leading-relaxed sm:text-base", body)}>
                {t("privacyP2")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ——— Clear role / trust ——— */}
      <section className="mx-auto max-w-6xl px-4 pb-5 sm:px-6 sm:pb-7">
        <h2 className="font-display text-2xl font-semibold tracking-tight text-charcoal sm:text-3xl">
          {t("notTitle")}
        </h2>
        <ul className="mt-7 grid gap-x-8 gap-y-3.5 sm:mt-8 sm:grid-cols-2 sm:gap-y-4">
          {[t("not1"), t("not2"), t("not3"), t("not4"), t("not5")].map((item) => (
            <li
              key={item}
              className="flex items-start gap-3 text-[0.9375rem] leading-snug text-charcoal/90 sm:text-base"
            >
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" aria-hidden />
              {item}
            </li>
          ))}
        </ul>
        <p className={cn("mt-7 max-w-3xl text-sm leading-relaxed sm:mt-8 sm:text-[0.9375rem]", body)}>
          {t("notSupport")}
        </p>
      </section>

      {/* ——— Owner education (compact) ——— */}
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:py-14">
        <div className="mx-auto max-w-2xl text-center lg:mx-0 lg:max-w-3xl lg:text-left">
          <p className="text-xs font-medium tracking-[0.14em] text-gold-dark uppercase">
            {t("ownerTipsEyebrow")}
          </p>
          <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-charcoal sm:text-3xl">
            {t("ownerTipsTitle")}
          </h2>
          <p className={cn("mt-4 text-[0.9375rem] leading-relaxed sm:text-base", body)}>
            {t("ownerTipsBody")}
          </p>
        </div>
        <ul className="mt-8 grid gap-x-10 gap-y-7 sm:mt-9 sm:grid-cols-2 sm:gap-y-8">
          {(
            [
              [Camera, "ownerTip1Title", "ownerTip1Body"],
              [FileText, "ownerTip2Title", "ownerTip2Body"],
              [CalendarDays, "ownerTip3Title", "ownerTip3Body"],
              [MessageCircle, "ownerTip4Title", "ownerTip4Body"],
            ] as const
          ).map(([Icon, titleKey, bodyKey]) => (
            <li key={titleKey} className="flex gap-3.5 sm:gap-4">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sand text-gold-dark">
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-[0.9375rem] font-semibold text-charcoal sm:text-base">
                  {t(titleKey)}
                </p>
                <p className={cn("mt-1.5 text-sm leading-relaxed sm:text-[0.9375rem]", body)}>
                  {t(bodyKey)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* ——— FAQ ——— */}
      <section id="auth-faq" className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <h2 className="font-display text-2xl font-semibold tracking-tight text-charcoal sm:text-3xl">
          {t("faqTitle")}
        </h2>
        <div className="mt-5 sm:mt-6">
          {(
            [
              ["faq1q", "faq1a"],
              ["faq2q", "faq2a"],
              ["faq3q", "faq3a"],
              ["faq4q", "faq4a"],
              ["faq5q", "faq5a"],
              ["faq6q", "faq6a"],
              ["faq7q", "faq7a"],
              ["faq8q", "faq8a"],
            ] as const
          ).map(([q, a]) => (
            <FaqItem key={q} q={t(q)} a={t(a)} />
          ))}
        </div>
      </section>

      {/* ——— Compact help (after FAQ) ——— */}
      <div className="mx-auto max-w-3xl px-4 pb-2 text-center sm:px-6">
        <p className="text-[0.9375rem] font-medium text-charcoal sm:text-base">
          {t("helpPrompt")}
        </p>
        <p className={cn("mt-1.5 text-sm leading-relaxed", bodySoft)}>{t("helpSupport")}</p>
        <Link
          href="/help"
          className="mt-3 inline-flex text-sm font-medium text-gold transition-colors hover:text-gold-dark hover:underline"
        >
          {t("helpCta")}
        </Link>
      </div>

      {/* ——— Final CTA ——— */}
      <section className="mx-auto max-w-6xl px-4 pb-6 sm:px-6">
        <div className="rounded-[1.5rem] bg-sand/55 px-6 py-11 text-center sm:px-10 sm:py-12 lg:py-14">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-charcoal sm:text-3xl">
            {t("finalTitle")}
          </h2>
          <p className={cn("mx-auto mt-4 max-w-xl text-[0.9375rem] leading-relaxed sm:text-base", body)}>
            {t("finalBody")}
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:mt-8 sm:flex-row sm:gap-4">
            <button
              type="button"
              onClick={() => focusForm("register")}
              className={cn(primaryCtaClass, "w-full sm:w-auto")}
            >
              {t("finalPrimary")}
            </button>
            <button
              type="button"
              onClick={() => focusForm("login")}
              className={cn(secondaryCtaClass, "w-full sm:w-auto")}
            >
              {t("finalSecondary")}
            </button>
          </div>
        </div>
      </section>

      {/* ——— Legal ——— */}
      <p
        className={cn(
          "mx-auto mt-7 max-w-6xl px-4 pb-6 text-center text-xs sm:mt-9 sm:px-6 sm:pb-8",
          bodySoft
        )}
      >
        <Link href="/terms" className="text-gold hover:underline">
          {tFooter("terms")}
        </Link>
        <span className="mx-2 text-border">·</span>
        <Link href="/privacy" className="text-gold hover:underline">
          {tFooter("privacy")}
        </Link>
        <span className="mx-2 text-border">·</span>
        <Link href="/privacy#cookies" className="text-gold hover:underline">
          {tFooter("cookies")}
        </Link>
      </p>
    </div>
  );
}
