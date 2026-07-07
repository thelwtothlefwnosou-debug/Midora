"use client";

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import { X, Undo2, Trash2, Check, Search } from "lucide-react";
import type { LatLng } from "@/lib/geo/polygon";
import { POLYGON_MIN_POINTS } from "@/lib/geo/polygon";

const MapAreaDrawMap = dynamic(
  () => import("./MapAreaDrawMap").then((m) => m.MapAreaDrawMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-sand/40 text-muted">
        Φόρτωση χάρτη...
      </div>
    ),
  }
);

type Props = {
  open: boolean;
  onClose: () => void;
  onSearch: (polygon: LatLng[]) => void;
  initialCenter?: LatLng;
  initialZoom?: number;
};

const DEFAULT_CENTER: LatLng = { lat: 37.9838, lng: 23.7275 };

export function MapAreaDrawModal({
  open,
  onClose,
  onSearch,
  initialCenter = DEFAULT_CENTER,
  initialZoom = 12,
}: Props) {
  const [points, setPoints] = useState<LatLng[]>([]);
  const [closed, setClosed] = useState(false);

  const reset = useCallback(() => {
    setPoints([]);
    setClosed(false);
  }, []);

  function handleClose() {
    reset();
    onClose();
  }

  function handleAddPoint(point: LatLng) {
    setClosed(false);
    setPoints((prev) => [...prev, point]);
  }

  function handleSetPoints(nextPoints: LatLng[]) {
    setPoints(nextPoints);
    setClosed(true);
  }

  function handleClosePolygon() {
    if (points.length >= POLYGON_MIN_POINTS) setClosed(true);
  }

  function handleUndo() {
    setClosed(false);
    setPoints((prev) => prev.slice(0, -1));
  }

  function handleSearch() {
    if (points.length < POLYGON_MIN_POINTS) return;
    onSearch(points);
    reset();
    onClose();
  }

  if (!open) return null;

  const hasEnoughPoints = points.length >= POLYGON_MIN_POINTS;
  const canFinish = hasEnoughPoints && !closed;
  const canSearch = hasEnoughPoints;

  function statusMessage() {
    if (points.length === 0) {
      return "Σύρε τον χάρτη ή κάνε κλικ για να ορίσεις την περιοχή";
    }
    if (!hasEnoughPoints) {
      return `${points.length}/${POLYGON_MIN_POINTS} σημεία — πρόσθεσε κι άλλα ή σύρε μια περιοχή`;
    }
    if (canFinish) {
      return "Πάτα «Ολοκλήρωση» ή το πρώτο σημείο — ή διπλό κλικ στον χάρτη";
    }
    return "Η περιοχή είναι έτοιμη";
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-6">
      <button
        type="button"
        aria-label="Κλείσιμο"
        className="absolute inset-0 bg-charcoal/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      <div className="relative flex h-[min(720px,92vh)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-float">
        <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-5 sm:py-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-charcoal sm:text-xl">
              Σχεδίασε την περιοχή
            </h2>
            <p className="mt-0.5 text-sm text-muted">{statusMessage()}</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-2 text-muted hover:bg-sand hover:text-charcoal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="relative min-h-0 flex-1">
          <MapAreaDrawMap
            center={initialCenter}
            zoom={initialZoom}
            points={points}
            closed={closed}
            onAddPoint={handleAddPoint}
            onSetPoints={handleSetPoints}
            onClosePolygon={handleClosePolygon}
          />
        </div>

        <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:px-5 sm:py-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleUndo}
              disabled={points.length === 0}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-white px-3 py-2 text-xs font-medium text-charcoal hover:bg-sand disabled:opacity-40"
            >
              <Undo2 className="h-3.5 w-3.5" />
              Αναίρεση
            </button>
            <button
              type="button"
              onClick={reset}
              disabled={points.length === 0}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-white px-3 py-2 text-xs font-medium text-charcoal hover:bg-sand disabled:opacity-40"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Καθαρισμός
            </button>
            <button
              type="button"
              onClick={handleClosePolygon}
              disabled={!canFinish}
              className="flex items-center gap-1.5 rounded-xl border border-teal/30 bg-teal/10 px-3 py-2 text-xs font-semibold text-teal hover:bg-teal/15 disabled:opacity-40"
            >
              <Check className="h-3.5 w-3.5" />
              Ολοκλήρωση
            </button>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={handleSearch}
              disabled={!canSearch}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gold px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40 sm:w-auto"
            >
              <Search className="h-4 w-4" />
              Αναζήτηση σε αυτή την περιοχή
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
