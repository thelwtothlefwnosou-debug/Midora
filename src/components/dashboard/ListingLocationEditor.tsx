"use client";

import { useState, useTransition } from "react";
import { MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { LocationConfirmMap } from "@/components/listings/wizard/LocationConfirmMap";
import { GlassCard } from "@/components/ui/GlassCard";
import { updateListingLocation } from "@/lib/actions";
import { getListingMapCenter } from "@/lib/listing-map";
import type { ListingWithImages } from "@/lib/types";

type Props = {
  listing: ListingWithImages;
};

export function ListingLocationEditor({ listing }: Props) {
  const router = useRouter();
  const center = getListingMapCenter(
    listing.id,
    listing.latitude ?? 37.9838,
    listing.longitude ?? 23.7275,
    listing.location_confirmed_by_owner
  );
  const initialLat = center.lat;
  const initialLng = center.lng;

  const [lat, setLat] = useState(initialLat);
  const [lng, setLng] = useState(initialLng);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const hasCoords = listing.latitude != null && listing.longitude != null;
  const hasChanges =
    Math.abs(lat - initialLat) > 0.000001 || Math.abs(lng - initialLng) > 0.000001;

  function handleSave() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await updateListingLocation(listing.id, lat, lng);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setMessage("Η θέση του ακινήτου αποθηκεύτηκε.");
      router.refresh();
    });
  }

  return (
    <GlassCard id="listing-location" className="mb-6 p-6">
      <div className="flex items-start gap-3">
        <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
        <div>
          <h2 className="font-display text-lg font-semibold text-charcoal">
            Τοποθεσία στον χάρτη
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            {hasCoords
              ? "Σύρε το pin ή κάνε κλικ στον χάρτη αν η θέση δεν είναι σωστή."
              : "Τοποθέτησε το pin στο σωστό σημείο — εμφανίζεται στην αγγελία και στις αναζητήσεις."}
          </p>
          <p className="mt-1 text-xs text-muted">
            {listing.area}, {listing.city}
            {listing.address ? ` · ${listing.address}` : ""}
          </p>
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-border">
        <LocationConfirmMap
          lat={lat}
          lng={lng}
          zoom={hasCoords ? 16 : 13}
          height="320px"
          onPositionChange={(nextLat, nextLng) => {
            setLat(nextLat);
            setLng(nextLng);
            setMessage(null);
            setError(null);
          }}
        />
      </div>

      <p className="mt-2 font-mono text-[11px] text-muted">
        {lat.toFixed(6)}, {lng.toFixed(6)}
        {hasChanges && <span className="ml-2 text-amber-700">(τροποποιημένο)</span>}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={pending || !hasChanges}
          onClick={handleSave}
          className="rounded-xl bg-charcoal px-4 py-2.5 text-sm font-semibold text-white hover:bg-charcoal/90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {pending ? "Αποθήκευση…" : "Αποθήκευση θέσης"}
        </button>
        {hasChanges && (
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              setLat(initialLat);
              setLng(initialLng);
              setMessage(null);
              setError(null);
            }}
            className="rounded-xl border border-border px-4 py-2.5 text-sm text-muted hover:text-charcoal disabled:opacity-40"
          >
            Επαναφορά
          </button>
        )}
      </div>

      {message && <p className="mt-3 text-sm text-teal">{message}</p>}
      {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
    </GlassCard>
  );
}
