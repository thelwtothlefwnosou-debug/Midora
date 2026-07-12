"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { Source, Layer } from "react-map-gl/maplibre";
import type { MapRef } from "@/components/map/MidoraMapCore";
import { MidoraMapCore } from "@/components/map/MidoraMapCore";
import { getListingMapCenter } from "@/lib/listing-map";
import { hideMapTextLabels } from "@/lib/map-label-visibility";
import { MIDORA_MAP_APPROX_ZOOM } from "@/lib/map-config";
import { cn } from "@/lib/utils";

type Props = {
  listingId: string;
  lat: number;
  lng: number;
  title?: string;
  height?: string;
  zoom?: number;
  /** Kept for callers; public detail always shows approximate area overlay */
  exactLocation?: boolean;
  className?: string;
};

const APPROX_RADIUS_METERS = 420;

function circleGeoJson(lng: number, lat: number, radiusMeters: number) {
  const points = 64;
  const coords: [number, number][] = [];
  const earthRadius = 6378137;
  const latRad = (lat * Math.PI) / 180;

  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * 2 * Math.PI;
    const dx = radiusMeters * Math.cos(angle);
    const dy = radiusMeters * Math.sin(angle);
    const dLng = (dx / (earthRadius * Math.cos(latRad))) * (180 / Math.PI);
    const dLat = (dy / earthRadius) * (180 / Math.PI);
    coords.push([lng + dLng, lat + dLat]);
  }

  return {
    type: "Feature" as const,
    properties: {},
    geometry: {
      type: "Polygon" as const,
      coordinates: [coords],
    },
  };
}

function centerPointGeoJson(lng: number, lat: number) {
  return {
    type: "Feature" as const,
    properties: {},
    geometry: {
      type: "Point" as const,
      coordinates: [lng, lat],
    },
  };
}

export function PropertyAreaMap({
  listingId,
  lat,
  lng,
  height = "380px",
  zoom,
  exactLocation = false,
  className,
}: Props) {
  const mapRef = useRef<MapRef>(null);

  const center = useMemo(
    () => getListingMapCenter(listingId, lat, lng, exactLocation),
    [listingId, lat, lng, exactLocation]
  );

  const viewZoom = zoom ?? MIDORA_MAP_APPROX_ZOOM;

  const circleFeature = useMemo(
    () => circleGeoJson(center.lng, center.lat, APPROX_RADIUS_METERS),
    [center.lat, center.lng]
  );

  const centerPoint = useMemo(
    () => centerPointGeoJson(center.lng, center.lat),
    [center.lat, center.lng]
  );

  const applyView = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    const maplibre = map.getMap();
    map.resize();

    const syncLabels = () => hideMapTextLabels(maplibre);
    if (maplibre.isStyleLoaded()) {
      syncLabels();
    } else {
      maplibre.once("styledata", syncLabels);
    }

    const ring = circleFeature.geometry.coordinates[0];
    let minLng = Infinity;
    let maxLng = -Infinity;
    let minLat = Infinity;
    let maxLat = -Infinity;
    for (const [ringLng, ringLat] of ring) {
      minLng = Math.min(minLng, ringLng);
      maxLng = Math.max(maxLng, ringLng);
      minLat = Math.min(minLat, ringLat);
      maxLat = Math.max(maxLat, ringLat);
    }

    map.fitBounds(
      [
        [minLng, minLat],
        [maxLng, maxLat],
      ],
      { padding: 64, duration: 0, maxZoom: viewZoom }
    );

    map.easeTo({
      center: { lng: center.lng, lat: center.lat },
      zoom: map.getZoom(),
      duration: 0,
    });
  }, [center.lat, center.lng, viewZoom, circleFeature]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => applyView());
    return () => cancelAnimationFrame(frame);
  }, [applyView]);

  return (
    <div className={cn("relative", className)}>
      <MidoraMapCore
        mapRef={mapRef}
        initialViewState={{
          longitude: center.lng,
          latitude: center.lat,
          zoom: viewZoom,
        }}
        height={height}
        scrollZoomMode="cooperative"
        dragPan
        doubleClickZoom
        touchZoomRotate
        keyboard
        showZoomControls
        showRecenter
        onRecenter={applyView}
        onLoad={applyView}
        showAttribution={false}
        className="overflow-hidden rounded-2xl border-0"
        flush
      >
        <Source id="approx-area" type="geojson" data={circleFeature}>
          <Layer
            id="approx-area-fill"
            type="fill"
            paint={{
              "fill-color": "#b98c5a",
              "fill-opacity": 0.14,
            }}
          />
          <Layer
            id="approx-area-line"
            type="line"
            paint={{
              "line-color": "#b98c5a",
              "line-width": 1.5,
              "line-opacity": 0.4,
            }}
          />
        </Source>

        <Source id="approx-center" type="geojson" data={centerPoint}>
          <Layer
            id="approx-center-ring"
            type="circle"
            paint={{
              "circle-radius": 10,
              "circle-color": "#ffffff",
              "circle-stroke-width": 2,
              "circle-stroke-color": "#b98c5a",
            }}
          />
          <Layer
            id="approx-center-dot"
            type="circle"
            paint={{
              "circle-radius": 3.5,
              "circle-color": "#b98c5a",
            }}
          />
        </Source>
      </MidoraMapCore>

      <div className="property-area-map-label pointer-events-none absolute bottom-3 left-3 z-[12] max-w-[calc(100%-5.5rem)] rounded-xl border border-charcoal/8 bg-white/92 px-3 py-2 shadow-[0_2px_10px_rgba(26,26,26,0.1)] backdrop-blur-sm">
        <p className="text-xs font-semibold text-charcoal">Περιοχή ακινήτου</p>
        <p className="mt-0.5 text-[11px] leading-snug text-charcoal/60">
          Η τοποθεσία είναι κατά προσέγγιση
        </p>
      </div>
    </div>
  );
}
