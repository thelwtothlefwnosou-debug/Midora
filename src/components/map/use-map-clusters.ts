import { useMemo } from "react";
import Supercluster from "supercluster";
import type { BBox } from "geojson";
import type { MapMarker } from "@/components/map/types";
import { MIDORA_MAP_MAX_ZOOM } from "@/lib/map-config";
import { formatMarkerPriceLabel } from "@/components/map/MidoraPriceMarker";

type ClusterPoint = Supercluster.PointFeature<{
  cluster: boolean;
  marker: MapMarker;
  cluster_id?: number;
  point_count?: number;
}>;

export type MapClusterItem =
  | {
      kind: "cluster";
      clusterId: number;
      longitude: number;
      latitude: number;
      pointCount: number;
      label: string;
    }
  | {
      kind: "marker";
      marker: MapMarker;
      longitude: number;
      latitude: number;
    };

export function lowestPriceLabelFromMarkers(markers: MapMarker[]): string {
  let bestPrice = Infinity;
  let bestLabel = "€";

  for (const marker of markers) {
    const price = marker.price ?? Infinity;
    if (price < bestPrice) {
      bestPrice = price;
      bestLabel = formatMarkerPriceLabel(marker.priceLabel, marker.price);
    }
  }

  return bestLabel;
}

/** Cluster badge: price + count so multi-listing pins are not mistaken for one listing. */
export function formatClusterMarkerLabel(
  markers: MapMarker[],
  pointCount: number
): string {
  const price = lowestPriceLabelFromMarkers(markers);
  if (pointCount <= 1) return price;
  return `${price} · ${pointCount}`;
}

export function buildSuperclusterIndex(markers: MapMarker[]) {
  const index = new Supercluster<{ marker: MapMarker }>({
    radius: 42,
    maxZoom: MIDORA_MAP_MAX_ZOOM - 1,
    minZoom: 0,
  });

  index.load(
    markers.map((marker) => ({
      type: "Feature",
      properties: { cluster: false, marker },
      geometry: {
        type: "Point",
        coordinates: [marker.lng, marker.lat],
      },
    }))
  );

  return index;
}

function safeClusterLeaves(
  index: Supercluster<{ marker: MapMarker }>,
  clusterId: number,
  limit = 100
): MapMarker[] {
  try {
    return index
      .getLeaves(clusterId, limit)
      .map((leaf) => leaf.properties.marker)
      .filter(Boolean);
  } catch {
    return [];
  }
}

export function safeClusterExpansionZoom(
  index: Supercluster<{ marker: MapMarker }>,
  clusterId: number,
  maxZoom = MIDORA_MAP_MAX_ZOOM
): number | null {
  try {
    return Math.min(index.getClusterExpansionZoom(clusterId), maxZoom);
  } catch {
    return null;
  }
}

function clusterItemsFromIndex(
  index: Supercluster<{ marker: MapMarker }>,
  bounds: BBox,
  zoom: number
): MapClusterItem[] {
  const features = index.getClusters(bounds, Math.floor(zoom)) as ClusterPoint[];

  const items: MapClusterItem[] = [];

  for (const feature of features) {
    const [longitude, latitude] = feature.geometry.coordinates;
    const { cluster, marker, cluster_id, point_count } = feature.properties;

    if (cluster && cluster_id != null && point_count != null) {
      const leaves = safeClusterLeaves(index, cluster_id);
      items.push({
        kind: "cluster",
        clusterId: cluster_id,
        longitude,
        latitude,
        pointCount: point_count,
        label: formatClusterMarkerLabel(leaves, point_count),
      });
      continue;
    }

    if (marker) {
      items.push({
        kind: "marker",
        marker,
        longitude,
        latitude,
      });
    }
  }

  return items;
}

/**
 * Single supercluster index per viewport — avoids stale cluster_id lookups
 * between separate index instances (the root cause of runtime crashes).
 */
export function useMapClusterLayer(
  markers: MapMarker[],
  bounds: BBox,
  zoom: number
): { index: Supercluster<{ marker: MapMarker }>; items: MapClusterItem[] } {
  const markerSignature = markers.map((m) => `${m.id}:${m.lat}:${m.lng}`).join("|");

  return useMemo(() => {
    const index = buildSuperclusterIndex(markers);
    if (markers.length === 0) {
      return { index, items: [] as MapClusterItem[] };
    }
    return {
      index,
      items: clusterItemsFromIndex(index, bounds, zoom),
    };
  }, [markerSignature, markers, bounds, zoom]);
}

/** @deprecated Use useMapClusterLayer */
export function useMapClusters(
  markers: MapMarker[],
  bounds: BBox,
  zoom: number
): ClusterPoint[] {
  const { index } = useMapClusterLayer(markers, bounds, zoom);
  if (markers.length === 0) return [];
  return index.getClusters(bounds, Math.floor(zoom)) as ClusterPoint[];
}

/** @deprecated Use safeClusterLeaves via useMapClusterLayer */
export function getClusterLeaves(
  index: Supercluster<{ marker: MapMarker }>,
  clusterId: number,
  limit = 100
): MapMarker[] {
  return safeClusterLeaves(index, clusterId, limit);
}

export type { ClusterPoint };
