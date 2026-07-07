"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LocationConfirmMap } from "@/components/listings/wizard/LocationConfirmMap";
import { adminUpdateListingLocation } from "@/lib/admin/actions";

type Props = {
  listingId: string;
  initialLat: number;
  initialLng: number;
};

export function AdminLocationPinEditor({ listingId, initialLat, initialLng }: Props) {
  const router = useRouter();
  const [lat, setLat] = useState(initialLat);
  const [lng, setLng] = useState(initialLng);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const hasChanges =
    Math.abs(lat - initialLat) > 0.000001 || Math.abs(lng - initialLng) > 0.000001;

  function handleSave() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await adminUpdateListingLocation(listingId, lat, lng);
      if (result.error) {
        setError(result.error);
        return;
      }
      setMessage("Η τοποθεσία αποθηκεύτηκε.");
      router.refresh();
    });
  }

  return (
    <div className="mt-3 space-y-3">
      <p className="text-xs text-muted">
        Σύρε το pin ή κάνε κλικ στον χάρτη για να διορθώσεις την ακριβή θέση. Η αλλαγή
        εφαρμόζεται αμέσως στην αγγελία.
      </p>
      <div className="overflow-hidden rounded-xl border border-border">
        <LocationConfirmMap
          lat={lat}
          lng={lng}
          zoom={17}
          height="280px"
          onPositionChange={(nextLat, nextLng) => {
            setLat(nextLat);
            setLng(nextLng);
            setMessage(null);
            setError(null);
          }}
        />
      </div>
      <p className="font-mono text-[11px] text-muted">
        {lat.toFixed(7)}, {lng.toFixed(7)}
        {hasChanges && <span className="ml-2 text-amber-700">(τροποποιημένο)</span>}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={pending || !hasChanges}
          onClick={handleSave}
          className="rounded-lg bg-charcoal px-3 py-1.5 text-xs font-medium text-white hover:bg-charcoal/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Αποθήκευση..." : "Αποθήκευση νέας θέσης pin"}
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
            className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted hover:text-charcoal disabled:opacity-50"
          >
            Επαναφορά
          </button>
        )}
      </div>
      {message && <p className="text-xs text-teal">{message}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
