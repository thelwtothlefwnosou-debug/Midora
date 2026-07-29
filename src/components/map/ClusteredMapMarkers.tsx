"use client";

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import type { MapMarker } from "@/components/map/PropertyMap";
import { buildMarkerPopupHtml } from "@/lib/listings-map-markers";

const markerDataMap = new WeakMap<L.Marker, MapMarker>();

const POPUP_OPTIONS: L.PopupOptions = {
  maxWidth: 260,
  minWidth: 200,
  className: "midora-map-popup-shell",
  autoClose: true,
  closeOnClick: false,
};

function formatMarkerPriceLabel(marker: MapMarker): string {
  return (
    marker.priceLabel ??
    (marker.price != null ? `€${marker.price.toLocaleString("el-GR")}` : "€")
  );
}

function buildPricePillIcon(label: string, active: boolean) {
  const width = Math.max(52, label.length * 8 + 20);
  return L.divIcon({
    className: "price-marker",
    html: `<div class="price-marker-pill${active ? " price-marker-pill--active" : ""}">${label}</div>`,
    iconSize: [width, 32],
    iconAnchor: [width / 2, 16],
  });
}

function priceMarkerIcon(marker: MapMarker, active: boolean) {
  return buildPricePillIcon(formatMarkerPriceLabel(marker), active);
}

function lowestPriceLabelFromLeafletMarkers(leafletMarkers: L.Marker[]): string {
  let bestPrice = Infinity;
  let bestLabel = "€";

  for (const lm of leafletMarkers) {
    const data = markerDataMap.get(lm);
    if (!data) continue;
    const price = data.price ?? Infinity;
    if (price < bestPrice) {
      bestPrice = price;
      bestLabel = formatMarkerPriceLabel(data);
    }
  }

  return bestLabel;
}

function createClusterGroup() {
  return L.markerClusterGroup({
    showCoverageOnHover: false,
    maxClusterRadius: 42,
    spiderfyOnMaxZoom: true,
    disableClusteringAtZoom: 14,
    animate: false,
    chunkedLoading: true,
    chunkInterval: 80,
    chunkDelay: 30,
    zoomToBoundsOnClick: true,
    iconCreateFunction: (cluster) => {
      const label = lowestPriceLabelFromLeafletMarkers(cluster.getAllChildMarkers());
      return buildPricePillIcon(label, false);
    },
  });
}

type Props = {
  markers: MapMarker[];
  activeMarkerId?: string | null;
  onMarkerClick?: (id: string) => void;
  onMarkerHover?: (id: string | null) => void;
};

export function ClusteredMapMarkers({
  markers,
  activeMarkerId,
  onMarkerClick,
  onMarkerHover,
}: Props) {
  const map = useMap();
  const groupRef = useRef<L.MarkerClusterGroup | null>(null);
  const markerMapRef = useRef(new Map<string, L.Marker>());
  const markersDataRef = useRef<MapMarker[]>([]);
  const onMarkerClickRef = useRef(onMarkerClick);
  const onMarkerHoverRef = useRef(onMarkerHover);
  const hoverIdRef = useRef<string | null>(null);
  const prevActiveIdRef = useRef<string | null>(null);
  const activeIdRef = useRef(activeMarkerId);

  onMarkerClickRef.current = onMarkerClick;
  onMarkerHoverRef.current = onMarkerHover;
  activeIdRef.current = activeMarkerId ?? null;

  function isHighlighted(id: string) {
    return id === activeIdRef.current || id === hoverIdRef.current;
  }

  function refreshMarkerVisual(id: string) {
    const data = markersDataRef.current.find((m) => m.id === id);
    const leafletMarker = markerMapRef.current.get(id);
    if (!data || !leafletMarker) return;
    markerDataMap.set(leafletMarker, data);
    const highlighted = isHighlighted(id);
    leafletMarker.setIcon(priceMarkerIcon(data, highlighted));
    leafletMarker.setZIndexOffset(highlighted ? 1000 : 0);
  }

  function setHoverId(next: string | null) {
    const prev = hoverIdRef.current;
    if (prev === next) return;
    hoverIdRef.current = next;
    onMarkerHoverRef.current?.(next);
    if (prev) refreshMarkerVisual(prev);
    if (next) refreshMarkerVisual(next);
  }

  function bindPopupOnDemand(leafletMarker: L.Marker, data: MapMarker) {
    if (leafletMarker.getPopup()) return;
    leafletMarker.bindPopup(buildMarkerPopupHtml(data), POPUP_OPTIONS);
  }

  function attachMarker(leafletMarker: L.Marker, data: MapMarker) {
    markerDataMap.set(leafletMarker, data);
    leafletMarker.setIcon(priceMarkerIcon(data, isHighlighted(data.id)));

    leafletMarker.on("click", (e) => {
      L.DomEvent.stopPropagation(e);
      bindPopupOnDemand(leafletMarker, data);
      onMarkerClickRef.current?.(data.id);
      leafletMarker.openPopup();
    });
    leafletMarker.on("mouseover", () => setHoverId(data.id));
    leafletMarker.on("mouseout", () => setHoverId(null));
  }

  useEffect(() => {
    if (!groupRef.current) {
      groupRef.current = createClusterGroup();
      map.addLayer(groupRef.current);
    }

    const group = groupRef.current;
    markersDataRef.current = markers;

    const nextIds = new Set(markers.map((m) => m.id));

    for (const id of markerMapRef.current.keys()) {
      if (nextIds.has(id)) continue;
      const leafletMarker = markerMapRef.current.get(id);
      if (leafletMarker) group.removeLayer(leafletMarker);
      markerMapRef.current.delete(id);
    }

    for (const data of markers) {
      const existing = markerMapRef.current.get(data.id);
      if (existing) {
        markerDataMap.set(existing, data);
        existing.setLatLng([data.lat, data.lng]);
        existing.setIcon(priceMarkerIcon(data, isHighlighted(data.id)));
        continue;
      }

      const leafletMarker = L.marker([data.lat, data.lng], {
        icon: priceMarkerIcon(data, false),
      });
      attachMarker(leafletMarker, data);
      markerMapRef.current.set(data.id, leafletMarker);
      group.addLayer(leafletMarker);
    }

    return undefined;
  }, [markers, map]);

  useEffect(() => {
    const prev = prevActiveIdRef.current;
    prevActiveIdRef.current = activeMarkerId ?? null;
    if (prev && prev !== activeMarkerId) refreshMarkerVisual(prev);
    if (activeMarkerId) refreshMarkerVisual(activeMarkerId);
  }, [activeMarkerId]);

  useEffect(() => {
    return () => {
      if (groupRef.current) {
        map.removeLayer(groupRef.current);
        groupRef.current.clearLayers();
        groupRef.current = null;
      }
      markerMapRef.current.clear();
      hoverIdRef.current = null;
    };
  }, [map]);

  return null;
}
