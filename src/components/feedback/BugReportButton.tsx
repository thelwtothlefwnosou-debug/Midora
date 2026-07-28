"use client";

import { useMemo, useState, useTransition } from "react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { submitBugReport } from "@/lib/admin/actions";

const CATEGORY_VALUES = [
  "search",
  "listing",
  "dashboard",
  "calendar",
  "photos",
  "contact",
  "verification",
  "account",
  "other",
] as const;

function collectBrowserInfo() {
  if (typeof window === "undefined") return {};
  return {
    userAgent: navigator.userAgent,
    viewport: { width: window.innerWidth, height: window.innerHeight },
    language: navigator.language,
  };
}

const INITIAL = {
  category: "other" as (typeof CATEGORY_VALUES)[number],
  message: "",
  error: null as string | null,
  success: false,
};

export function BugReportModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const t = useTranslations("Feedback");
  const categories = useMemo(
    () =>
      CATEGORY_VALUES.map((value) => ({
        value,
        label: t(`categories.${value}`),
      })),
    [t]
  );
  const [category, setCategory] = useState(INITIAL.category);
  const [message, setMessage] = useState(INITIAL.message);
  const [error, setError] = useState<string | null>(INITIAL.error);
  const [success, setSuccess] = useState(INITIAL.success);
  const [pending, startTransition] = useTransition();

  if (!open) return null;

  function close() {
    setCategory(INITIAL.category);
    setMessage(INITIAL.message);
    setError(INITIAL.error);
    setSuccess(INITIAL.success);
    onClose();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const fd = new FormData();
    fd.set("category", category);
    fd.set("message", message);
    fd.set("page_url", window.location.href);
    fd.set("browser_info", JSON.stringify(collectBrowserInfo()));

    startTransition(async () => {
      const result = await submitBugReport(fd);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSuccess(true);
    });
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-charcoal/40"
        onClick={close}
        aria-label={t("close")}
      />
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-white p-6 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-charcoal">{t("modalTitle")}</h2>
          <button type="button" onClick={close} className="rounded-lg p-1 hover:bg-sand">
            <X className="h-5 w-5" />
          </button>
        </div>

        {success ? (
          <p className="text-sm text-teal">{t("successMessage")}</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block text-sm">
              <span className="font-medium text-charcoal">{t("category")}</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as typeof category)}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
              >
                {categories.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm">
              <span className="font-medium text-charcoal">{t("descriptionLabel")}</span>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                required
                minLength={10}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
                placeholder={t("descriptionPlaceholder")}
              />
            </label>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-lg bg-charcoal py-2.5 text-sm font-medium text-white disabled:opacity-50"
            >
              {pending ? t("submitting") : t("submit")}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export function BugReportButton({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  const t = useTranslations("Feedback");
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {children ?? t("reportIssue")}
      </button>
      <BugReportModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
