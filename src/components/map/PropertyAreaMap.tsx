"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useTranslations } from "next-intl";
import { Marker, Source, Layer } from "react-map-gl/maplibre";
import type { MapRef } from "@/components/map/MidoraMapCore";
import { MidoraMapCore } from "@/components/map/MidoraMapCore";
import { PropertyHouseMarker } from "@/components/map/PropertyHouseMarker";
import { getListingMapCenter } from "@/lib/listing-map";
import { hideMapTextLabels } from "@/lib/map-label-visibility";
import {
  MIDORA_MAP_APPROX_RADIUS_METERS,
  MIDORA_MAP_APPROX_ZOOM,
  MIDORA_MAP_EXACT_ZOOM,
} from "@/lib/map-config";
import { cn } from "@/lib/utils";

type Props = {
  listingId: string;
  lat: number;
  lng: number;
  title?: string;
  height?: string;
  zoom?: number;
  /** Owner-confirmed exact public pin (still privacy-safe when false). */
  exactLocation?: boolean;
  className?: string;
};

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

export function PropertyAreaMap({
  listingId,
  lat,
  lng,
  height = "380px",
  zoom,
  exactLocation = false,
  className,
}: Props) {
  const t = useTranslations("Map");
  const mapRef = useRef<MapRef>(null);

  const center = useMemo(
    () => getListingMapCenter(listingId, lat, lng, exactLocation),
    [listingId, lat, lng, exactLocation]
  );

  const viewZoom =
    zoom ?? (exactLocation ? MIDORA_MAP_EXACT_ZOOM : MIDORA_MAP_APPROX_ZOOM);

  const showApproxCircle = !exactLocation;

  const circleFeature = useMemo(
    () =>
      showApproxCircle
        ? circleGeoJson(center.lng, center.lat, MIDORA_MAP_APPROX_RADIUS_METERS)
        : null,
    [center.lat, center.lng, showApproxCircle]
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

    // Center + fixed neighborhood zoom — do not fitBounds to a large circle
    // (that was forcing a city-wide framing).
    map.easeTo({
      center: { lng: center.lng, lat: center.lat },
      zoom: viewZoom,
      // Slight upward bias so the pin sits a bit above geometric center
      // (leaves room for the privacy chip at the bottom).
      offset: [0, -28],
      duration: 0,
    });
  }, [center.lat, center.lng, viewZoom]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => applyView());
    return () => cancelAnimationFrame(frame);
  }, [applyView]);

  return (
    <div className={cn("relative h-full w-full", className)}>
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
        {circleFeature ? (
          <Source id="approx-area" type="geojson" data={circleFeature}>
            <Layer
              id="approx-area-fill"
              type="fill"
              paint={{
                "fill-color": "#b98c5a",
                "fill-opacity": 0.1,
              }}
            />
            <Layer
              id="approx-area-line"
              type="line"
              paint={{
                "line-color": "#b98c5a",
                "line-width": 1.25,
                "line-opacity": 0.32,
              }}
            />
          </Source>
        ) : null}

        <Marker
          longitude={center.lng}
          latitude={center.lat}
          anchor="bottom"
          style={{ zIndex: 2 }}
        >
          <PropertyHouseMarker exact={exactLocation} />
        </Marker>
      </MidoraMapCore>

      <div className="property-area-map-label pointer-events-none absolute bottom-3 left-3 z-[12] max-w-[calc(100%-5.5rem)] rounded-xl border border-charcoal/8 bg-white/92 px-3 py-2 shadow-[0_2px_10px_rgba(26,26,26,0.1)] backdrop-blur-sm">
        <p className="text-xs font-semibold text-charcoal">
          {exactLocation ? t("exactTitle") : t("approxTitle")}
        </p>
        <p className="mt-0.5 text-[11px] leading-snug text-charcoal/60">
          {exactLocation ? t("exactHint") : t("approxHint")}
        </p>
      </div>
    </div>
  );
}
