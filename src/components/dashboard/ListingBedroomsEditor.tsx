"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import { Bed, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { GlassCard } from "@/components/ui/GlassCard";
import { BED_TYPES } from "@/lib/amenities-catalog";
import {
  saveOwnerSleepingArrangements,
  type BedroomInput,
} from "@/lib/listing-sleeping-arrangements";
import type { ListingSleepingArrangement, ListingWithImages } from "@/lib/types";
import { cn } from "@/lib/utils";

const inputClass =
  "mt-1 w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm text-charcoal outline-none focus:border-gold/50";

type DraftRow = BedroomInput & { key: string };

function toDraft(row: ListingSleepingArrangement): DraftRow {
  return {
    key: row.id,
    room_name: row.room_name,
    bed_type: row.bed_type,
    quantity: row.quantity,
    bed_size_note: row.bed_size_note ?? "",
    listing_image_id: row.listing_image_id ?? null,
  };
}

function emptyDraft(index: number, suggestions: string[], fallback: string): DraftRow {
  return {
    key: `new-${Date.now()}-${index}`,
    room_name: suggestions[index] ?? fallback,
    bed_type: BED_TYPES[0],
    quantity: 1,
    bed_size_note: "",
    listing_image_id: null,
  };
}

type Props = {
  listing: ListingWithImages;
  initialArrangements: ListingSleepingArrangement[];
};

export function ListingBedroomsEditor({ listing, initialArrangements }: Props) {
  const router = useRouter();
  const t = useTranslations("Workspace.bedroomsEditor");
  const roomSuggestions = useMemo(
    () => [
      t("suggestionMaster"),
      t("suggestionSecond"),
      t("suggestionThird"),
      t("suggestionLiving"),
    ],
    [t]
  );
  const [rows, setRows] = useState<DraftRow[]>(() =>
    initialArrangements.length > 0
      ? initialArrangements.map(toDraft)
      : []
  );
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const photos = useMemo(
    () => (listing.listing_images ?? []).filter((img) => img.media_type !== "video"),
    [listing.listing_images]
  );

  function updateRow(key: string, patch: Partial<DraftRow>) {
    setRows((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }

  function addRow() {
    if (rows.length >= 8) return;
    setRows((prev) => [
      ...prev,
      emptyDraft(prev.length, roomSuggestions, t("roomFallback", { index: prev.length + 1 })),
    ]);
  }

  function removeRow(key: string) {
    setRows((prev) => prev.filter((row) => row.key !== key));
  }

  function handleSave() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const payload: BedroomInput[] = rows.map(({ key: _key, ...row }) => ({
        room_name: row.room_name,
        bed_type: row.bed_type,
        quantity: row.quantity,
        bed_size_note: row.bed_size_note || null,
        listing_image_id: row.listing_image_id,
      }));

      const result = await saveOwnerSleepingArrangements(listing.id, payload);
      if (result && "error" in result && result.error) {
        setError(result.error);
        return;
      }
      if (result && "arrangements" in result && result.arrangements) {
        setRows(result.arrangements.map(toDraft));
      } else {
        setRows([]);
      }
      setMessage(payload.length > 0 ? t("savedRooms") : t("removedRooms"));
      router.refresh();
    });
  }

  return (
    <GlassCard id="listing-bedrooms" className="mb-6 p-6">
      <div className="flex items-start gap-3">
        <Bed className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-lg font-semibold text-charcoal">
            {t("title")}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            {t("subtitle")}
          </p>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="mt-5 rounded-xl border border-dashed border-border bg-sand/20 px-4 py-6 text-center text-sm text-muted">
          {t("empty")}
        </p>
      ) : (
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {rows.map((row) => (
            <div
              key={row.key}
              className="rounded-2xl border border-border bg-sand/20 p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted">
                  {t("room")}
                </p>
                <button
                  type="button"
                  onClick={() => removeRow(row.key)}
                  className="rounded-lg p-1.5 text-muted hover:bg-white hover:text-red-600"
                  aria-label={t("removeRoom")}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <label className="mt-3 block">
                <span className="text-xs text-muted">{t("roomName")}</span>
                <input
                  list={`room-names-${row.key}`}
                  value={row.room_name}
                  onChange={(e) => updateRow(row.key, { room_name: e.target.value })}
                  placeholder={t("roomNamePlaceholder")}
                  className={inputClass}
                />
                <datalist id={`room-names-${row.key}`}>
                  {roomSuggestions.map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
              </label>

              <label className="mt-3 block">
                <span className="text-xs text-muted">{t("bedType")}</span>
                <select
                  value={row.bed_type}
                  onChange={(e) => updateRow(row.key, { bed_type: e.target.value })}
                  className={inputClass}
                >
                  {BED_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>

              <label className="mt-3 block">
                <span className="text-xs text-muted">{t("dimensions")}</span>
                <input
                  value={row.bed_size_note ?? ""}
                  onChange={(e) => updateRow(row.key, { bed_size_note: e.target.value })}
                  placeholder={t("dimensionsPlaceholder")}
                  className={inputClass}
                />
              </label>

              {photos.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-muted">{t("roomPhoto")}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => updateRow(row.key, { listing_image_id: null })}
                      className={cn(
                        "rounded-lg border px-2.5 py-1.5 text-xs font-medium",
                        !row.listing_image_id
                          ? "border-gold bg-gold/10 text-charcoal"
                          : "border-border bg-white text-muted"
                      )}
                    >
                      {t("noPhoto")}
                    </button>
                    {photos.map((photo) => (
                      <button
                        key={photo.id}
                        type="button"
                        onClick={() =>
                          updateRow(row.key, { listing_image_id: photo.id })
                        }
                        className={cn(
                          "relative h-14 w-20 overflow-hidden rounded-lg border-2",
                          row.listing_image_id === photo.id
                            ? "border-gold"
                            : "border-transparent"
                        )}
                      >
                        <Image
                          src={photo.url}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={addRow}
          disabled={rows.length >= 8 || pending}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-medium text-charcoal hover:border-gold/30 disabled:opacity-40"
        >
          <Plus className="h-4 w-4" />
          {t("addRoom")}
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={pending}
          className="min-h-11 rounded-xl bg-gold px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
        >
          {pending ? t("saving") : t("save")}
        </button>
      </div>

      {photos.length === 0 && rows.length > 0 && (
        <p className="mt-3 text-xs text-muted">
          {t("uploadHint")}
        </p>
      )}

      {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
      {message && <p className="mt-3 text-sm text-teal">{message}</p>}
    </GlassCard>
  );
}
