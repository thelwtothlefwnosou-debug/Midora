"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { MAP_TILE_ATTRIBUTION, MAP_TILE_URL } from "@/lib/map-tiles";

const pinIcon = L.divIcon({
  className: "",
  html: `
    <div style="position:relative;width:42px;height:42px;display:flex;align-items:center;justify-content:center;">
      <div style="width:42px;height:42px;border-radius:9999px;background:#1f1f1f;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 18px rgba(0,0,0,.24);border:2px solid rgba(255,255,255,.92);">
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 11.5L12 5l8 6.5" stroke="#fff" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M7 10.5V19h10v-8.5" stroke="#fff" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M10 19v-4h4v4" stroke="#fff" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
    </div>`,
  iconSize: [42, 42],
  iconAnchor: [21, 21],
});

type Props = {
  lat: number;
  lng: number;
  zoom?: number;
  height?: string;
  onPositionChange: (lat: number, lng: number) => void;
};

function MapCenterSync({ lat, lng, zoom }: { lat: number; lng: number; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], zoom, { animate: true });
  }, [lat, lng, zoom, map]);
  return null;
}

function MapResizeFix() {
  const map = useMap();
  useEffect(() => {
    const timer = window.setTimeout(() => {
      map.invalidateSize();
    }, 150);
    return () => window.clearTimeout(timer);
  }, [map]);
  return null;
}

function MapClickHandler({ onPositionChange }: { onPositionChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPositionChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export function LocationConfirmMapInner({
  lat,
  lng,
  zoom = 17,
  height = "320px",
  onPositionChange,
}: Props) {
  const t = useTranslations("Wizard.location");

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return (
      <div
        className="flex min-h-[320px] items-center justify-center rounded-xl bg-sand/40 text-sm text-muted"
        style={{ height }}
      >
        {t("noCoordinates")}
      </div>
    );
  }

  return (
    <div style={{ height, width: "100%" }} className="min-h-[320px]">
      <MapContainer
        center={[lat, lng]}
        zoom={zoom}
        style={{ height: "100%", width: "100%", minHeight: 320 }}
        scrollWheelZoom
        className="rounded-xl z-0"
      >
        <TileLayer
          attribution={MAP_TILE_ATTRIBUTION}
          url={MAP_TILE_URL}
          subdomains={["a", "b", "c"]}
        />
        <MapCenterSync lat={lat} lng={lng} zoom={zoom} />
        <MapResizeFix />
        <MapClickHandler onPositionChange={onPositionChange} />
        <Marker
          key={`${lat.toFixed(6)}-${lng.toFixed(6)}`}
          position={[lat, lng]}
          icon={pinIcon}
          draggable
          eventHandlers={{
            dragend: (e) => {
              const pos = (e.target as L.Marker).getLatLng();
              onPositionChange(pos.lat, pos.lng);
            },
          }}
        />
      </MapContainer>
    </div>
  );
}
