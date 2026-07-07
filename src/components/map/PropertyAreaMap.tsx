"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { Marker, Source, Layer } from "react-map-gl/maplibre";
import type { MapRef } from "@/components/map/MidoraMapCore";
import { MidoraMapCore } from "@/components/map/MidoraMapCore";
import { ApproximateLocationMarker } from "@/components/map/ApproximateLocationMarker";
import { getListingMapCenter } from "@/lib/listing-map";
import {
  MIDORA_MAP_APPROX_ZOOM,
  MIDORA_MAP_LISTING_FOCUS_ZOOM,
} from "@/lib/map-config";
import { cn } from "@/lib/utils";

type Props = {
  listingId: string;
  lat: number;
  lng: number;
  title?: string;
  height?: string;
  zoom?: number;
  exactLocation?: boolean;
  className?: string;
};

const APPROX_RADIUS_METERS = 280;

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
  const mapRef = useRef<MapRef>(null);

  const center = useMemo(
    () => getListingMapCenter(listingId, lat, lng, exactLocation),
    [listingId, lat, lng, exactLocation]
  );

  const viewZoom =
    zoom ?? (exactLocation ? MIDORA_MAP_LISTING_FOCUS_ZOOM : MIDORA_MAP_APPROX_ZOOM);

  const circleFeature = useMemo(
    () =>
      exactLocation ? null : circleGeoJson(center.lng, center.lat, APPROX_RADIUS_METERS),
    [center.lat, center.lng, exactLocation]
  );

  const applyView = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    map.easeTo({
      center: { lng: center.lng, lat: center.lat },
      zoom: viewZoom,
      duration: 0,
    });
  }, [center.lat, center.lng, viewZoom]);

  useEffect(() => {
    applyView();
  }, [applyView]);

  return (
    <MidoraMapCore
      mapRef={mapRef}
      initialViewState={{
        longitude: center.lng,
        latitude: center.lat,
        zoom: viewZoom,
      }}
      height={height}
      scrollZoom={exactLocation}
      dragPan
      doubleClickZoom={exactLocation}
      touchZoomRotate={exactLocation}
      onLoad={applyView}
      className={cn("overflow-hidden rounded-2xl border-0", className)}
      flush
    >
      {circleFeature ? (
        <Source id="approx-area" type="geojson" data={circleFeature}>
          <Layer
            id="approx-area-fill"
            type="fill"
            paint={{
              "fill-color": "#b98c5a",
              "fill-opacity": 0.12,
            }}
          />
          <Layer
            id="approx-area-line"
            type="line"
            paint={{
              "line-color": "#b98c5a",
              "line-width": 1.5,
              "line-opacity": 0.35,
            }}
          />
        </Source>
      ) : null}

      <Marker longitude={center.lng} latitude={center.lat} anchor="bottom">
        <ApproximateLocationMarker variant="gold" showRadius={false} />
      </Marker>
    </MidoraMapCore>
  );
}
