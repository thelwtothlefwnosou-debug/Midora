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

type Mode = "login" | "register";

type AuthPanelProps = {
  initialMode?: Mode;
  redirectTo?: string;
  errorCode?: string | null;
  referralCode?: string | null;
};

export function AuthPanel({
  initialMode = "login",
  redirectTo = "/dashboard/profile",
  errorCode,
  referralCode,
}: AuthPanelProps) {
  const t = useTranslations("Auth");
  const tErrors = useTranslations("Auth.errors");
  const [mode, setMode] = useState<Mode>(initialMode);
  const [step, setStep] = useState<"email" | "form">("email");
  const [email, setEmail] = useState("");

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
    async (_prev: { error?: string; needsConfirmation?: boolean; email?: string } | null, formData: FormData) => {
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

  return (
    <div className="relative grid w-full max-w-4xl overflow-hidden rounded-2xl border border-border bg-white shadow-2xl lg:grid-cols-[1fr_1.1fr]">
      {/* Left — benefits (Spitogatos style) */}
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

      {/* Right — form */}
      <GlassCard className="rounded-none border-0 bg-transparent p-8 sm:p-10">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="font-display text-xl font-bold text-charcoal">
            Midora
          </Link>
          <LanguageSwitcher />
        </div>

        <h1 className="mt-6 font-display text-2xl font-bold text-charcoal">
          {mode === "login" ? t("title") : t("signUpLink")}
        </h1>
        <p className="mt-2 text-sm text-muted">
          {mode === "login" ? (
            <>
              {t("noAccount")}{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("register");
                  setStep("email");
                }}
                className="text-gold hover:underline"
              >
                {t("signUpLink")}
              </button>
            </>
          ) : (
            <>
              {t("hasAccount")}{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setStep("email");
                }}
                className="text-gold hover:underline"
              >
                {t("signInLink")}
              </button>
            </>
          )}
        </p>

        {!configured && process.env.NODE_ENV === "development" && (
          <div className="mt-6 rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-800">
            {t.rich("devConfigHint", {
              code: () => <code className="text-yellow-900">.env.local</code>,
            })}
          </div>
        )}

        {panelError && <p className="mt-4 text-sm text-red-400">{panelError}</p>}

        <div className="mt-8">
          <SocialAuthButtons redirectTo={redirectTo} disabled={!configured} />

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-sand" />
            <span className="text-xs text-muted/80">{t("or")}</span>
            <div className="h-px flex-1 bg-sand" />
          </div>

          {step === "email" ? (
            <form onSubmit={handleEmailContinue} className="space-y-4">
              <div>
                <label className="text-xs text-muted uppercase">{t("email")}</label>
                <div className="relative mt-1">
                  <Mail className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted/80" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("emailPlaceholder")}
                    className="w-full rounded-xl border border-border bg-sand/50 py-3 pr-4 pl-10 text-charcoal outline-none focus:border-gold/50"
                  />
                </div>
              </div>
              <Button type="submit" size="lg" className="w-full">
                {t("continue")}
              </Button>
            </form>
          ) : mode === "login" ? (
            <form action={loginAction} className="space-y-4">
              <input type="hidden" name="email" value={email} />
              <div>
                <label className="text-xs text-muted uppercase">{t("email")}</label>
                <input
                  type="email"
                  value={email}
                  readOnly
                  className="mt-1 w-full rounded-xl border border-border bg-sand/30 px-4 py-3 text-charcoal/70 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setStep("email")}
                  className="mt-1 text-xs text-gold hover:underline"
                >
                  {t("changeEmail")}
                </button>
              </div>
              <div>
                <label className="text-xs text-muted uppercase">{t("password")}</label>
                <input
                  name="password"
                  type="password"
                  required
                  minLength={6}
                  autoFocus
                  className="mt-1 w-full rounded-xl border border-border bg-sand/50 px-4 py-3 text-charcoal outline-none focus:border-gold/50"
                />
                <Link
                  href="/auth/forgot-password"
                  className="mt-1 inline-block text-xs text-gold hover:underline"
                >
                  {t("forgotPassword")}
                </Link>
              </div>
              {state?.error && (
                <p className="text-sm text-red-400">
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
                onClick={() => {
                  setMode("login");
                  setStep("email");
                }}
                className="text-sm text-gold hover:underline"
              >
                {t("backToSignIn")}
              </button>
            </div>
          ) : (
            <form action={registerAction} className="space-y-4">
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
                <label className="text-xs text-muted uppercase">{t("email")}</label>
                <input
                  type="email"
                  value={email}
                  readOnly
                  className="mt-1 w-full rounded-xl border border-border bg-sand/30 px-4 py-3 text-charcoal/70 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setStep("email")}
                  className="mt-1 text-xs text-gold hover:underline"
                >
                  {t("changeEmail")}
                </button>
              </div>
              <div>
                <label className="text-xs text-muted uppercase">{t("fullName")}</label>
                <input
                  name="full_name"
                  required
                  autoFocus
                  className="mt-1 w-full rounded-xl border border-border bg-sand/50 px-4 py-3 text-charcoal outline-none focus:border-gold/50"
                />
              </div>
              <div>
                <label className="text-xs text-muted uppercase">{t("phone")}</label>
                <input
                  name="phone"
                  type="tel"
                  required
                  placeholder={t("phonePlaceholder")}
                  className="mt-1 w-full rounded-xl border border-border bg-sand/50 px-4 py-3 text-charcoal outline-none focus:border-gold/50"
                />
              </div>
              <div>
                <label className="text-xs text-muted uppercase">{t("password")}</label>
                <input
                  name="password"
                  type="password"
                  required
                  minLength={6}
                  placeholder={t("passwordPlaceholder")}
                  className="mt-1 w-full rounded-xl border border-border bg-sand/50 px-4 py-3 text-charcoal outline-none focus:border-gold/50"
                />
              </div>
              <p className="text-xs text-muted/80">
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
                })}
              </p>
              {state?.error && (
                <p className="text-sm text-red-400">
                  {resolveAuthError(tErrors, state.error)}
                </p>
              )}
              <Button type="submit" size="lg" className="w-full">
                {pending ? t("creating") : t("createAccount")}
              </Button>
            </form>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
