"use client";

import { useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Trash2, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { deleteListing } from "@/lib/actions";
import { showToast } from "@/lib/toast-store";
import {
  deleteListingErrorToast,
  deleteListingSuccessToast,
  resolveDeleteListingNavIntent,
} from "@/lib/delete-listing-nav";

type Props = {
  listingId: string;
  /** List pages: remove row locally and stay on the page. */
  onDeleted?: (listingId: string) => void;
  /**
   * Where to go after delete when `onDeleted` is not provided.
   * Defaults to `/dashboard/listings`. Pass `null` to stay without navigation.
   */
  redirectTo?: string | null;
};

type ConfirmStep = "closed" | "confirm" | "final";

export function DeleteListingButton({
  listingId,
  onDeleted,
  redirectTo,
}: Props) {
  const t = useTranslations("Owner.deleteListing");
  const locale = useLocale();
  const router = useRouter();
  const [step, setStep] = useState<ConfirmStep>("closed");
  const [mounted, setMounted] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (step === "closed") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [step]);

  function close() {
    if (pending) return;
    setStep("closed");
  }

  function handleDelete() {
    if (pending) return;
    startTransition(async () => {
      try {
        const result = await deleteListing(listingId);
        if (result && "error" in result && result.error) {
          showToast(result.error || deleteListingErrorToast(locale));
          return;
        }

        showToast(t.has("successToast") ? t("successToast") : deleteListingSuccessToast(locale));
        setStep("closed");

        const intent = resolveDeleteListingNavIntent({
          hasOnDeleted: typeof onDeleted === "function",
          redirectTo,
        });

        if (intent.kind === "local_remove") {
          onDeleted?.(listingId);
          return;
        }
        if (intent.kind === "navigate") {
          router.push(intent.href);
        }
      } catch {
        showToast(t.has("errorToast") ? t("errorToast") : deleteListingErrorToast(locale));
      }
    });
  }

  const open = step !== "closed";
  const isFinal = step === "final";

  const modal =
    open && mounted ? (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        <button
          type="button"
          aria-label={t("close")}
          className="absolute inset-0 bg-charcoal/45 backdrop-blur-sm"
          onClick={close}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-listing-title"
          className="relative w-full max-w-md rounded-2xl border border-border bg-white p-6 shadow-2xl"
        >
          <button
            type="button"
            onClick={close}
            className="absolute top-4 right-4 rounded-lg p-1 text-muted hover:bg-sand"
            aria-label={t("close")}
          >
            <X className="h-4 w-4" />
          </button>
          <h3
            id="delete-listing-title"
            className="pr-8 font-display text-lg font-semibold text-charcoal"
          >
            {isFinal ? t("finalTitle") : t("title")}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {isFinal ? t("finalBody") : t("body")}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={close}
              disabled={pending}
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-border bg-white px-6 text-sm font-semibold text-charcoal transition-colors hover:bg-sand disabled:opacity-50"
            >
              {t("cancel")}
            </button>
            {isFinal ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={pending}
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-red-500 px-6 text-sm font-semibold text-white transition-opacity hover:bg-red-600 disabled:opacity-50"
              >
                {pending ? t("deleting") : t("finalConfirm")}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setStep("final")}
                disabled={pending}
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-red-500 px-6 text-sm font-semibold text-white transition-opacity hover:bg-red-600 disabled:opacity-50"
              >
                {t("confirm")}
              </button>
            )}
          </div>
        </div>
      </div>
    ) : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setStep("confirm")}
        disabled={pending}
        className="flex items-center gap-1 text-xs text-red-500 hover:underline disabled:opacity-50"
      >
        <Trash2 className="h-3 w-3" />
        {t("trigger")}
      </button>

      {modal ? createPortal(modal, document.body) : null}
    </>
  );
}
