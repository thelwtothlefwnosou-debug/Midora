"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Check, Mail } from "lucide-react";
import { signIn, signUp } from "@/lib/actions";
import { SocialAuthButtons } from "@/components/auth/SocialAuthButtons";
import { resolveAuthError } from "@/components/auth/auth-errors";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const cardInputClass =
  "mt-1.5 min-h-12 w-full rounded-xl border border-border bg-sand/40 px-4 py-3 text-[0.9375rem] text-charcoal outline-none transition-colors focus:border-gold/50 focus:bg-white";

type Mode = "login" | "register";

type AuthPanelProps = {
  initialMode?: Mode;
  redirectTo?: string;
  errorCode?: string | null;
  referralCode?: string | null;
  /** card = form only for marketing page; classic = old two-column card */
  layout?: "classic" | "card";
  onModeChange?: (mode: Mode) => void;
};

export function AuthPanel({
  initialMode = "login",
  redirectTo = "/dashboard/profile",
  errorCode,
  referralCode,
  layout = "classic",
  onModeChange,
}: AuthPanelProps) {
  const t = useTranslations("Auth");
  const tErrors = useTranslations("Auth.errors");
  /** When parent controls mode (marketing page), prefer prop over local state. */
  const [uncontrolledMode, setUncontrolledMode] = useState<Mode>(initialMode);
  const mode = onModeChange ? initialMode : uncontrolledMode;
  const [step, setStep] = useState<"email" | "form">("email");
  const [email, setEmail] = useState("");

  function switchMode(next: Mode) {
    if (!onModeChange) setUncontrolledMode(next);
    setStep("email");
    onModeChange?.(next);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (next === "register") url.searchParams.set("mode", "register");
      else url.searchParams.delete("mode");
      window.history.replaceState({}, "", `${url.pathname}${url.search}`);
    }
  }

  const benefits = [
    t("benefitSearch"),
    t("benefitList"),
    t("benefitManage"),
    t("benefitContact"),
  ];

  const [loginState, loginAction, loginPending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      formData.set("redirect", redirectTo);
      return (await signIn(formData)) ?? null;
    },
    null
  );

  const [registerState, registerAction, registerPending] = useActionState(
    async (
      _prev: { error?: string; needsConfirmation?: boolean; email?: string } | null,
      formData: FormData
    ) => {
      formData.set("redirect", redirectTo);
      return (await signUp(formData)) ?? null;
    },
    null
  );

  const state = mode === "login" ? loginState : registerState;
  const pending = mode === "login" ? loginPending : registerPending;
  const configured = isSupabaseConfigured();
  const panelError = errorCode ? resolveAuthError(tErrors, errorCode) : null;

  function handleEmailContinue(e: React.FormEvent) {
    e.preventDefault();
    if (email.trim()) setStep("form");
  }

  const formBody = (
    <>
      <div className="flex items-start justify-between gap-3">
        {layout === "classic" ? (
          <Link href="/" className="font-display text-xl font-bold text-charcoal">
            Midora
          </Link>
        ) : (
          <h2 className="font-display text-[1.35rem] font-semibold leading-tight tracking-tight text-charcoal sm:text-xl">
            {mode === "login" ? t("cardLoginTitle") : t("cardRegisterTitle")}
          </h2>
        )}
        <LanguageSwitcher className="shrink-0" />
      </div>

      {layout === "classic" ? (
        <h1 className="mt-6 font-display text-2xl font-bold text-charcoal">
          {mode === "login" ? t("title") : t("signUpLink")}
        </h1>
      ) : null}

      <p
        className={cn(
          "text-sm leading-relaxed",
          layout === "card" ? "mt-3 text-charcoal/65" : "mt-2 text-muted"
        )}
      >
        {mode === "login" ? (
          <>
            {t("noAccount")}{" "}
            <button
              type="button"
              onClick={() => switchMode("register")}
              className="font-medium text-gold hover:underline"
            >
              {t("signUpLink")}
            </button>
          </>
        ) : (
          <>
            {t("hasAccount")}{" "}
            <button
              type="button"
              onClick={() => switchMode("login")}
              className="font-medium text-gold hover:underline"
            >
              {t("signInLink")}
            </button>
          </>
        )}
      </p>

      {mode === "register" ? (
        <>
          <p
            className={cn(
              "mt-3 text-sm leading-relaxed",
              layout === "card" ? "text-charcoal/65" : "text-muted"
            )}
          >
            {t("oneAccountNote")}
          </p>
          <p
            className={cn(
              "mt-2 text-sm font-medium",
              layout === "card" ? "text-charcoal/80" : "text-charcoal/80"
            )}
          >
            {t("cardFreeNote")}
          </p>
        </>
      ) : null}

      {!configured && process.env.NODE_ENV === "development" && (
        <div className="mt-6 rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-800">
          {t.rich("devConfigHint", {
            code: () => <code className="text-yellow-900">.env.local</code>,
          })}
        </div>
      )}

      {panelError && <p className="mt-4 text-sm text-red-400">{panelError}</p>}

      <div className={cn(layout === "card" ? "mt-7" : "mt-8")}>
        <SocialAuthButtons redirectTo={redirectTo} disabled={!configured} />

        <div className={cn("flex items-center gap-3", layout === "card" ? "my-7" : "my-6")}>
          <div className="h-px flex-1 bg-border/80" />
          <span className="text-xs tracking-wide text-muted/80">{t("or")}</span>
          <div className="h-px flex-1 bg-border/80" />
        </div>

        {step === "email" ? (
          <form onSubmit={handleEmailContinue} className="space-y-5">
            <div>
              <label htmlFor="auth-email" className="text-xs font-medium tracking-wide text-muted uppercase">
                {t("email")}
              </label>
              <div className="relative">
                <Mail className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted/80" />
                <input
                  id="auth-email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("emailPlaceholder")}
                  className={cn(cardInputClass, "pl-10")}
                />
              </div>
            </div>
            <Button type="submit" size="lg" className="w-full">
              {t("continue")}
            </Button>
          </form>
        ) : mode === "login" ? (
          <form action={loginAction} className="space-y-5">
            <input type="hidden" name="email" value={email} />
            <div>
              <label className="text-xs font-medium tracking-wide text-muted uppercase">{t("email")}</label>
              <input
                type="email"
                value={email}
                readOnly
                autoComplete="email"
                className={cn(cardInputClass, "bg-sand/25 text-charcoal/70")}
              />
              <button
                type="button"
                onClick={() => setStep("email")}
                className="mt-1.5 text-xs font-medium text-gold hover:underline"
              >
                {t("changeEmail")}
              </button>
            </div>
            <div>
              <label htmlFor="auth-password-login" className="text-xs font-medium tracking-wide text-muted uppercase">
                {t("password")}
              </label>
              <input
                id="auth-password-login"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                minLength={6}
                autoFocus
                className={cardInputClass}
              />
              <Link
                href="/auth/forgot-password"
                className="mt-1.5 inline-block text-xs font-medium text-gold hover:underline"
              >
                {t("forgotPasswordLink")}
              </Link>
            </div>
            {state?.error && (
              <p className="text-sm text-red-400" role="alert">
                {resolveAuthError(tErrors, state.error)}
              </p>
            )}
            <Button type="submit" size="lg" className="w-full">
              {pending ? t("signingIn") : t("signIn")}
            </Button>
          </form>
        ) : registerState?.needsConfirmation ? (
          <div className="space-y-4 text-center">
            <Mail className="mx-auto h-10 w-10 text-gold" />
            <h2 className="font-display text-xl font-bold text-charcoal">
              {t("checkEmailTitle")}
            </h2>
            <p className="text-sm text-muted">
              {t.rich("checkEmailBody", {
                email: () => (
                  <span className="text-charcoal">{registerState.email ?? email}</span>
                ),
              })}
            </p>
            <p className="text-xs text-muted/80">{t("checkEmailSpam")}</p>
            <button
              type="button"
              onClick={() => switchMode("login")}
              className="text-sm text-gold hover:underline"
            >
              {t("backToSignIn")}
            </button>
          </div>
        ) : (
          <form action={registerAction} className="space-y-5">
            <input type="hidden" name="email" value={email} />
            {referralCode && (
              <input type="hidden" name="referral_code" value={referralCode} />
            )}
            {referralCode && (
              <p className="rounded-xl border border-teal/30 bg-teal/10 px-4 py-2 text-xs text-teal">
                {t("referralNotice")}
              </p>
            )}
            <div>
              <label className="text-xs font-medium tracking-wide text-muted uppercase">{t("email")}</label>
              <input
                type="email"
                value={email}
                readOnly
                autoComplete="email"
                className={cn(cardInputClass, "bg-sand/25 text-charcoal/70")}
              />
              <button
                type="button"
                onClick={() => setStep("email")}
                className="mt-1.5 text-xs font-medium text-gold hover:underline"
              >
                {t("changeEmail")}
              </button>
            </div>
            <div>
              <label htmlFor="auth-full-name" className="text-xs font-medium tracking-wide text-muted uppercase">
                {t("fullName")}
              </label>
              <input
                id="auth-full-name"
                name="full_name"
                autoComplete="name"
                required
                autoFocus
                className={cardInputClass}
              />
            </div>
            <div>
              <label htmlFor="auth-phone" className="text-xs font-medium tracking-wide text-muted uppercase">
                {t("phone")}
              </label>
              <input
                id="auth-phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                required
                placeholder={t("phonePlaceholder")}
                className={cardInputClass}
              />
            </div>
            <div>
              <label htmlFor="auth-password-register" className="text-xs font-medium tracking-wide text-muted uppercase">
                {t("password")}
              </label>
              <input
                id="auth-password-register"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                placeholder={t("passwordPlaceholder")}
                className={cardInputClass}
              />
            </div>
            <p className="text-xs leading-relaxed text-muted/80">
              {t.rich("acceptTerms", {
                terms: (chunks) => (
                  <Link href="/terms" className="text-gold hover:underline">
                    {chunks}
                  </Link>
                ),
                privacy: (chunks) => (
                  <Link href="/privacy" className="text-gold hover:underline">
                    {chunks}
                  </Link>
                ),
              })}{" "}
              <Link href="/privacy#cookies" className="text-gold hover:underline">
                {t("cookiesLink")}
              </Link>
            </p>
            {state?.error && (
              <p className="text-sm text-red-400" role="alert">
                {resolveAuthError(tErrors, state.error)}
              </p>
            )}
            <Button type="submit" size="lg" className="w-full">
              {pending ? t("creating") : t("createAccount")}
            </Button>
          </form>
        )}
      </div>
    </>
  );

  if (layout === "card") {
    return (
      <div
        id="auth-form"
        className="scroll-mt-28 rounded-[1.35rem] border border-border/90 bg-white p-7 shadow-[0_18px_50px_-28px_rgba(31,26,23,0.35)] sm:p-9"
      >
        {formBody}
      </div>
    );
  }

  return (
    <div className="relative grid w-full max-w-4xl overflow-hidden rounded-2xl border border-border bg-white shadow-2xl lg:grid-cols-[1fr_1.1fr]">
      <div className="hidden flex-col justify-between bg-gradient-to-br from-teal/10 via-sand to-gold/5 p-10 lg:flex">
        <div>
          <p className="text-sm font-medium text-teal">Midora</p>
          <h2 className="mt-4 font-display text-2xl font-bold text-charcoal">
            {t("viaAccount")}
          </h2>
          <ul className="mt-8 space-y-4">
            {benefits.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-charcoal/70">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal/20 text-teal">
                  <Check className="h-3 w-3" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-muted/80">{t("tagline")}</p>
      </div>

      <GlassCard className="rounded-none border-0 bg-transparent p-8 sm:p-10">
        {formBody}
      </GlassCard>
    </div>
  );
}
