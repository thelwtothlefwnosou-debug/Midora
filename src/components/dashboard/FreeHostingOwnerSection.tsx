"use client";

import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { FreeHostingMark } from "@/components/brand/FreeHostingMark";
import { Loader2, Plus, Trash2 } from "lucide-react";
import {
  deleteListingFreeHostingOffer,
  listListingFreeHostingOffers,
  setListingFreeHostingOfferStatus,
  upsertListingFreeHostingOffer,
  type FreeHostingOfferRow,
  type FreeHostingOfferStatus,
} from "@/lib/free-hosting-actions";
import { cn } from "@/lib/utils";

type Props = {
  listingId: string;
  maxGuestsFallback?: number | null;
};

const emptyForm = {
  startDate: "",
  endExclusive: "",
  maxNights: 3,
  maxGuests: 2,
  ownerMessage: "",
  status: "active" as FreeHostingOfferStatus,
};

export function FreeHostingOwnerSection({ listingId, maxGuestsFallback }: Props) {
  const t = useTranslations("Workspace.freeHosting");
  const [pending, startTransition] = useTransition();
  const [offers, setOffers] = useState<FreeHostingOfferRow[]>([]);
  const [migrationRequired, setMigrationRequired] = useState(false);
  const [openForm, setOpenForm] = useState(false);
  const [form, setForm] = useState({
    ...emptyForm,
    maxGuests: Math.max(1, maxGuestsFallback ?? 2),
  });
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  function reload() {
    startTransition(async () => {
      const result = await listListingFreeHostingOffers(listingId);
      if ("error" in result && result.error) {
        setError(t(`errors.${result.error}`));
        return;
      }
      if ("migrationRequired" in result && result.migrationRequired) {
        setMigrationRequired(true);
      }
      if ("offers" in result && result.offers) setOffers(result.offers);
    });
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once per listing
  }, [listingId]);

  function onSave() {
    setError(null);
    setFeedback(null);
    startTransition(async () => {
      const result = await upsertListingFreeHostingOffer({
        listingId,
        startDate: form.startDate,
        endExclusive: form.endExclusive,
        maxNights: form.maxNights,
        maxGuests: form.maxGuests,
        ownerMessage: form.ownerMessage,
        status: form.status,
      });
      if ("error" in result && result.error) {
        setError(t(`errors.${result.error}`));
        return;
      }
      setFeedback(t("feedback.saved"));
      setOpenForm(false);
      setForm({
        ...emptyForm,
        maxGuests: Math.max(1, maxGuestsFallback ?? 2),
      });
      reload();
    });
  }

  function onStatus(offerId: string, status: FreeHostingOfferStatus) {
    startTransition(async () => {
      const result = await setListingFreeHostingOfferStatus({
        listingId,
        offerId,
        status,
      });
      if ("error" in result && result.error) {
        setError(t(`errors.${result.error}`));
        return;
      }
      reload();
    });
  }

  function onDelete(offerId: string) {
    if (!window.confirm(t("deleteConfirm"))) return;
    startTransition(async () => {
      const result = await deleteListingFreeHostingOffer({ listingId, offerId });
      if ("error" in result && result.error) {
        setError(t(`errors.${result.error}`));
        return;
      }
      setFeedback(t("feedback.deleted"));
      reload();
    });
  }

  const fieldClass =
    "mt-1 w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm text-charcoal outline-none focus:border-gold/50 focus:ring-2 focus:ring-gold/15";

  return (
    <section
      id="free-hosting"
      className="rounded-[1.5rem] border border-charcoal/8 bg-white p-5 shadow-soft sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <FreeHostingMark className="h-4 w-4" />
            <h2 className="font-display text-lg font-semibold text-charcoal">{t("title")}</h2>
          </div>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted">{t("subtitle")}</p>
        </div>
        <button
          type="button"
          onClick={() => setOpenForm((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-full border border-charcoal/12 bg-sand/60 px-3.5 py-2 text-sm font-medium text-charcoal hover:bg-sand"
        >
          <Plus className="h-4 w-4" aria-hidden />
          {t("addCta")}
        </button>
      </div>

      {migrationRequired ? (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm text-amber-950">
          {t("migrationPending")}
        </p>
      ) : null}

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      {feedback ? <p className="mt-3 text-sm text-teal-800">{feedback}</p> : null}

      {openForm ? (
        <div className="mt-5 grid gap-3 rounded-2xl border border-border bg-sand/40 p-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="font-medium text-charcoal">{t("fields.start")}</span>
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
              className={fieldClass}
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-charcoal">{t("fields.endExclusive")}</span>
            <input
              type="date"
              value={form.endExclusive}
              onChange={(e) => setForm((f) => ({ ...f, endExclusive: e.target.value }))}
              className={fieldClass}
            />
            <span className="mt-1 block text-xs text-muted">{t("fields.endExclusiveHint")}</span>
          </label>
          <label className="block text-sm">
            <span className="font-medium text-charcoal">{t("fields.maxNights")}</span>
            <input
              type="number"
              min={1}
              max={90}
              value={form.maxNights}
              onChange={(e) =>
                setForm((f) => ({ ...f, maxNights: Number(e.target.value) || 1 }))
              }
              className={fieldClass}
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-charcoal">{t("fields.maxGuests")}</span>
            <input
              type="number"
              min={1}
              max={50}
              value={form.maxGuests}
              onChange={(e) =>
                setForm((f) => ({ ...f, maxGuests: Number(e.target.value) || 1 }))
              }
              className={fieldClass}
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="font-medium text-charcoal">{t("fields.message")}</span>
            <textarea
              rows={3}
              value={form.ownerMessage}
              onChange={(e) => setForm((f) => ({ ...f, ownerMessage: e.target.value }))}
              placeholder={t("fields.messagePlaceholder")}
              className={fieldClass}
            />
          </label>
          <div className="flex flex-wrap gap-2 sm:col-span-2">
            <button
              type="button"
              disabled={pending}
              onClick={onSave}
              className="home-btn-primary disabled:opacity-60"
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {t("publishCta")}
            </button>
            <button
              type="button"
              onClick={() => setOpenForm(false)}
              className="rounded-full border border-border px-4 py-2 text-sm text-charcoal"
            >
              {t("cancel")}
            </button>
          </div>
        </div>
      ) : null}

      <ul className="mt-5 space-y-3">
        {offers.length === 0 && !migrationRequired ? (
          <li className="rounded-xl border border-dashed border-charcoal/12 px-4 py-6 text-sm text-muted">
            {t("empty")}
          </li>
        ) : null}
        {offers.map((offer) => (
          <li
            key={offer.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-sand/30 px-4 py-3"
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold text-charcoal">
                {offer.start_date} → {offer.end_exclusive}
                <span className="ml-2 text-xs font-normal text-muted">
                  ({t("exclusiveLabel")})
                </span>
              </p>
              <p className="mt-1 text-xs text-muted">
                {t("offerMeta", {
                  nights: offer.max_nights,
                  guests: offer.max_guests,
                })}
              </p>
              <span
                className={cn(
                  "mt-2 inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium",
                  offer.status === "active"
                    ? "bg-teal/15 text-teal-900"
                    : "bg-charcoal/8 text-charcoal/70"
                )}
              >
                {t(`status.${offer.status}`)}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {offer.status !== "active" ? (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => onStatus(offer.id, "active")}
                  className="rounded-full border border-border bg-white px-3 py-1.5 text-xs font-medium"
                >
                  {t("activate")}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => onStatus(offer.id, "paused")}
                  className="rounded-full border border-border bg-white px-3 py-1.5 text-xs font-medium"
                >
                  {t("pause")}
                </button>
              )}
              <button
                type="button"
                disabled={pending}
                onClick={() => onDelete(offer.id)}
                className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-700"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden />
                {t("delete")}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
