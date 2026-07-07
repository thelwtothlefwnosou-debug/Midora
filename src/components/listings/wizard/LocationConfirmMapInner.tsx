"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { MAP_TILE_ATTRIBUTION, MAP_TILE_URL } from "@/lib/map-tiles";

const pinIcon = L.divIcon({
  className: "",
  html: `<div style="width:28px;height:28px;background:#b8860b;border:3px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 8px rgba(0,0,0,.25)"></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
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
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return (
      <div
        className="flex min-h-[320px] items-center justify-center rounded-xl bg-sand/40 text-sm text-muted"
        style={{ height }}
      >
        Δεν βρέθηκαν συντεταγμένες για τον χάρτη.
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
