"use client";

import { useState, useTransition } from "react";
import { Flag } from "lucide-react";
import { useTranslations } from "next-intl";
import { submitListingReport } from "@/lib/actions";
import { cn } from "@/lib/utils";

const CONVERSATION_REASON_KEYS = [
  "suspiciousComm",
  "suspiciousPayment",
  "offensive",
  "misleading",
  "other",
] as const;

type ConversationReasonKey = (typeof CONVERSATION_REASON_KEYS)[number];

type Props = {
  listingId: string;
  listingTitle: string;
  leadId?: string;
  className?: string;
};

export function ConversationReportButton({
  listingId,
  listingTitle,
  leadId,
  className,
}: Props) {
  const t = useTranslations("Legal.reports");
  const tCommon = useTranslations("Common");
  const [open, setOpen] = useState(false);
  const [reasonKey, setReasonKey] = useState<ConversationReasonKey>(
    CONVERSATION_REASON_KEYS[0]
  );
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();

  function resetAndClose() {
    setOpen(false);
    setSent(false);
    setError(null);
    setDescription("");
    setReasonKey(CONVERSATION_REASON_KEYS[0]);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const fd = new FormData();
    fd.set("listing_id", listingId);
    fd.set("listing_title", listingTitle);
    fd.set("reason", t(`conversationReasons.${reasonKey}`));
    const notes = [
      leadId ? `lead_id=${leadId}` : null,
      "type=conversation_report",
      description.trim() || null,
    ]
      .filter(Boolean)
      .join("\n");
    if (notes) fd.set("description", notes);

    startTransition(async () => {
      const result = await submitListingReport(fd);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setSent(true);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex items-center gap-1.5 text-xs font-medium text-muted transition-colors hover:text-charcoal",
          className
        )}
      >
        <Flag className="h-3.5 w-3.5" aria-hidden />
        {t("reportConversation")}
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[110] flex items-end justify-center sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="conversation-report-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-charcoal/45"
            aria-label={t("close")}
            onClick={resetAndClose}
          />
          <div className="relative w-full max-w-md rounded-t-2xl bg-white p-6 shadow-2xl sm:rounded-2xl">
            <h2
              id="conversation-report-title"
              className="font-display text-lg font-semibold text-charcoal"
            >
              {sent ? t("reportFiled") : t("reportConversation")}
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              {t("reportPrivateNote")}
            </p>

            {sent ? (
              <div className="mt-4">
                <p className="text-sm leading-relaxed text-charcoal/75">
                  {tCommon("reportSuccessText")}
                </p>
                <button
                  type="button"
                  onClick={resetAndClose}
                  className="mt-5 w-full rounded-xl bg-charcoal py-3 text-sm font-semibold text-white"
                >
                  {t("close")}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                <fieldset>
                  <legend className="text-xs font-medium tracking-wide text-muted uppercase">
                    {t("reason")}
                  </legend>
                  <div className="mt-2 space-y-2">
                    {CONVERSATION_REASON_KEYS.map((key) => (
                      <label key={key} className="flex cursor-pointer items-center gap-2 text-sm">
                        <input
                          type="radio"
                          name="conversation_reason"
                          value={key}
                          checked={reasonKey === key}
                          onChange={() => setReasonKey(key)}
                          className="accent-gold"
                        />
                        {t(`conversationReasons.${key}`)}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <label className="block">
                  <span className="text-xs font-medium text-muted">
                    {t("detailsOptional")}
                  </span>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm"
                  />
                </label>
                {error ? <p className="text-sm text-red-500">{error}</p> : null}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={resetAndClose}
                    className="min-h-11 flex-1 rounded-xl border border-border text-sm font-medium"
                  >
                    {t("cancel")}
                  </button>
                  <button
                    type="submit"
                    disabled={pending}
                    className="min-h-11 flex-1 rounded-xl bg-charcoal text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {pending ? t("submitting") : t("submit")}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
