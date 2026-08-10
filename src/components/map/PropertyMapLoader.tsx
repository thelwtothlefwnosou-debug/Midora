"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import type { MapMarker } from "@/components/map/types";
import type { MapViewportChangeMeta } from "@/components/map/MidoraResultsMap";
import type { LatLng, MapBounds } from "@/lib/geo/polygon";
import { MapLoadingState } from "@/components/map/MapLoadingState";

const MidoraResultsMap = dynamic(
  () => import("@/components/map/MidoraResultsMap").then((m) => m.MidoraResultsMap),
  {
    ssr: false,
    loading: () => <MapLoadingState />,
  }
);

const PropertyAreaMap = dynamic(
  () => import("@/components/map/PropertyAreaMap").then((m) => m.PropertyAreaMap),
  {
    ssr: false,
    loading: () => <MapLoadingState height="380px" />,
  }
);

export type { MapMarker } from "@/components/map/types";

type Props = {
  lat: number;
  lng: number;
  title?: string;
  price?: number;
  zoom?: number;
  height?: string;
  markers?: MapMarker[];
  hoveredMarkerId?: string | null;
  selectedMarkerId?: string | null;
  interactive?: boolean;
  searchPolygon?: LatLng[];
  initialBounds?: MapBounds;
  onBoundsChange?: (bounds: MapBounds) => void;
  onViewportChange?: (bounds: MapBounds, meta?: MapViewportChangeMeta) => void;
  reportBoundsOnMove?: boolean;
  clustered?: boolean;
  /** When false with clustered map, show one pin per listing (no Supercluster). */
  clusterMarkers?: boolean;
  fitMarkersOnLoad?: boolean;
  fitMaxZoom?: number;
  fitMinZoom?: number;
  onMarkerClick?: (id: string) => void;
  onMarkerHover?: (id: string | null) => void;
  onMarkerDeselect?: () => void;
  onBackgroundClick?: () => void;
  flush?: boolean;
  /** Detail page: listing id for approximate public coordinates */
  listingId?: string;
  /** Detail page: show exact pin when owner confirmed location */
  exactLocation?: boolean;
  scrollZoomMode?: "full" | "cooperative" | false;
};

export function PropertyMapLoader({
  clustered,
  markers,
  listingId,
  exactLocation,
  lat,
  lng,
  title,
  zoom,
  height,
  hoveredMarkerId,
  selectedMarkerId,
  searchPolygon,
  initialBounds,
  onViewportChange,
  fitMarkersOnLoad,
  fitMaxZoom,
  fitMinZoom,
  onMarkerClick,
  onMarkerHover,
  onMarkerDeselect,
  onBackgroundClick,
  flush,
  clusterMarkers = true,
  scrollZoomMode,
}: Props) {
  useEffect(() => {
    void import("@/components/map/MidoraMapCore");
  }, []);

  if (clustered) {
    return (
      <MidoraResultsMap
        lat={lat}
        lng={lng}
        zoom={zoom}
        height={height}
        markers={markers}
        hoveredMarkerId={hoveredMarkerId}
        selectedMarkerId={selectedMarkerId}
        searchPolygon={searchPolygon}
        initialBounds={initialBounds}
        onViewportChange={onViewportChange}
        fitMarkersOnLoad={fitMarkersOnLoad}
        fitMaxZoom={fitMaxZoom}
        fitMinZoom={fitMinZoom}
        onMarkerClick={onMarkerClick}
        onMarkerHover={onMarkerHover}
        onMarkerDeselect={onMarkerDeselect}
        onBackgroundClick={onBackgroundClick}
        flush={flush}
        clusterMarkers={clusterMarkers}
        scrollZoomMode={scrollZoomMode}
      />
    );
  }

  const resolvedListingId = listingId ?? markers?.[0]?.id ?? "listing";

  return (
    <PropertyAreaMap
      listingId={resolvedListingId}
      lat={lat}
      lng={lng}
      title={title}
      height={height ?? "380px"}
      zoom={zoom}
      exactLocation={exactLocation}
    />
  );
}

export { PropertyMapLoader as PropertyMap };
