"use client";

import { useState, useTransition } from "react";
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

export function DeleteListingButton({
  listingId,
  onDeleted,
  redirectTo,
}: Props) {
  const t = useTranslations("Owner.deleteListing");
  const locale = useLocale();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

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
        setOpen(false);

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

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={pending}
        className="flex items-center gap-1 text-xs text-red-500 hover:underline disabled:opacity-50"
      >
        <Trash2 className="h-3 w-3" />
        {t("trigger")}
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label={t("close")}
            className="absolute inset-0 bg-charcoal/40 backdrop-blur-sm"
            onClick={() => !pending && setOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-white p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => !pending && setOpen(false)}
              className="absolute top-4 right-4 rounded-lg p-1 text-muted hover:bg-sand"
              aria-label={t("close")}
            >
              <X className="h-4 w-4" />
            </button>
            <h3 className="font-display text-lg font-semibold text-charcoal">
              {t("title")}
            </h3>
            <p className="mt-2 text-sm text-muted">
              {t("body")}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={pending}
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-border bg-white px-6 text-sm font-semibold text-charcoal transition-colors hover:bg-sand disabled:opacity-50"
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={pending}
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-red-500 px-6 text-sm font-semibold text-white transition-opacity hover:bg-red-600 disabled:opacity-50"
              >
                {pending ? t("deleting") : t("confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
