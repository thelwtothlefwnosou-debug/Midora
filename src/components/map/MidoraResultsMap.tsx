"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Marker, Popup, Source, Layer } from "react-map-gl/maplibre";
import type { BBox } from "geojson";
import type { MapRef, ViewStateChangeEvent } from "@/components/map/MidoraMapCore";
import { MidoraMapCore } from "@/components/map/MidoraMapCore";
import { MidoraPriceMarker, formatMarkerPriceLabel } from "@/components/map/MidoraPriceMarker";
import { MidoraMapCluster } from "@/components/map/MidoraMapCluster";
import { ListingMapPreview } from "@/components/map/ListingMapPreview";
import type { MapMarker } from "@/components/map/types";
import {
  safeClusterExpansionZoom,
  useMapClusterLayer,
} from "@/components/map/use-map-clusters";
import type { LatLng, MapBounds } from "@/lib/geo/polygon";
import { MIDORA_MAP_LISTING_FOCUS_ZOOM } from "@/lib/map-config";
import { cn } from "@/lib/utils";

export type MapViewportChangeMeta = {
  userInitiated: boolean;
};

type Props = {
  lat: number;
  lng: number;
  zoom?: number;
  height?: string;
  markers?: MapMarker[];
  hoveredMarkerId?: string | null;
  selectedMarkerId?: string | null;
  searchPolygon?: LatLng[];
  initialBounds?: MapBounds;
  onViewportChange?: (bounds: MapBounds, meta: MapViewportChangeMeta) => void;
  fitMarkersOnLoad?: boolean;
  fitMaxZoom?: number;
  fitMinZoom?: number;
  onMarkerClick?: (id: string) => void;
  onMarkerHover?: (id: string | null) => void;
  onMarkerDeselect?: () => void;
  flush?: boolean;
};

function boundsFromMap(map: MapRef): MapBounds {
  const b = map.getBounds();
  return {
    north: b.getNorth(),
    south: b.getSouth(),
    east: b.getEast(),
    west: b.getWest(),
  };
}

function fitMapToBounds(
  map: MapRef,
  bounds: MapBounds,
  options?: { padding?: number; maxZoom?: number; minZoom?: number }
) {
  const padding = options?.padding ?? 40;
  map.fitBounds(
    [
      [bounds.west, bounds.south],
      [bounds.east, bounds.north],
    ],
    {
      padding,
      maxZoom: options?.maxZoom ?? 14,
      animate: false,
    }
  );
  if (options?.minZoom != null && map.getZoom() < options.minZoom) {
    map.setZoom(options.minZoom);
  }
}

function fitMapToMarkers(
  map: MapRef,
  markers: MapMarker[],
  maxZoom: number,
  minZoom: number
) {
  if (markers.length === 0) return;
  if (markers.length === 1) {
    map.easeTo({
      center: { lng: markers[0].lng, lat: markers[0].lat },
      zoom: Math.min(maxZoom, MIDORA_MAP_LISTING_FOCUS_ZOOM),
      duration: 0,
    });
    return;
  }

  let north = -Infinity;
  let south = Infinity;
  let east = -Infinity;
  let west = Infinity;

  for (const m of markers) {
    north = Math.max(north, m.lat);
    south = Math.min(south, m.lat);
    east = Math.max(east, m.lng);
    west = Math.min(west, m.lng);
  }

  fitMapToBounds(map, { north, south, east, west }, { maxZoom, minZoom });
}

function fitMapToPolygon(map: MapRef, polygon: LatLng[]) {
  const lats = polygon.map((p) => p.lat);
  const lngs = polygon.map((p) => p.lng);
  fitMapToBounds(
    map,
    {
      north: Math.max(...lats),
      south: Math.min(...lats),
      east: Math.max(...lngs),
      west: Math.min(...lngs),
    },
    { padding: 32 }
  );
}

function polygonGeoJson(polygon: LatLng[]) {
  return {
    type: "Feature" as const,
    properties: {},
    geometry: {
      type: "Polygon" as const,
      coordinates: [[...polygon.map((p) => [p.lng, p.lat]), [polygon[0].lng, polygon[0].lat]]],
    },
  };
}

function isUserMapEvent(event: ViewStateChangeEvent): boolean {
  return Boolean(event.originalEvent);
}

function markerNeedsPanForPreview(map: MapRef, marker: MapMarker): boolean {
  const point = map.project([marker.lng, marker.lat]);
  const container = map.getContainer();
  const edge = 96;
  const topReserve = 200;
  return (
    point.x < edge ||
    point.x > container.clientWidth - edge ||
    point.y < topReserve ||
    point.y > container.clientHeight - edge
  );
}

function panToRevealMarker(map: MapRef, marker: MapMarker) {
  const container = map.getContainer();
  const center = map.getCenter();
  const centerPoint = map.project([center.lng, center.lat]);
  const markerPoint = map.project([marker.lng, marker.lat]);
  const targetX = container.clientWidth / 2;
  const targetY = container.clientHeight * 0.58;
  const newCenter = map.unproject([
    centerPoint.x + (markerPoint.x - targetX),
    centerPoint.y + (markerPoint.y - targetY),
  ]);
  map.easeTo({
    center: newCenter,
    duration: 280,
  });
}

export function MidoraResultsMap({
  lat,
  lng,
  zoom = 12,
  height = "100%",
  markers = [],
  hoveredMarkerId,
  selectedMarkerId,
  searchPolygon,
  initialBounds,
  onViewportChange,
  fitMarkersOnLoad = false,
  fitMaxZoom = 14,
  fitMinZoom = 6,
  onMarkerClick,
  onMarkerHover,
  onMarkerDeselect,
  flush = false,
}: Props) {
  const mapRef = useRef<MapRef>(null);
  const userMovedRef = useRef(false);
  const ignoreViewportUntilRef = useRef(0);
  const viewportInitializedRef = useRef(false);
  const onViewportChangeRef = useRef(onViewportChange);

  const initialViewStateRef = useRef({
    longitude: lng,
    latitude: lat,
    zoom,
  });

  const [clusterBounds, setClusterBounds] = useState<BBox>([-180, -85, 180, 85]);
  const [clusterZoom, setClusterZoom] = useState(zoom);
  const prevSelectedMarkerRef = useRef<string | null>(null);

  onViewportChangeRef.current = onViewportChange;

  const { index: clusterIndex, items: clusterItems } = useMapClusterLayer(
    markers,
    clusterBounds,
    clusterZoom
  );
  const clusterIndexRef = useRef(clusterIndex);
  clusterIndexRef.current = clusterIndex;

  const popupMarker = useMemo(
    () => markers.find((m) => m.id === selectedMarkerId) ?? null,
    [markers, selectedMarkerId]
  );

  const syncClusterViewport = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const b = map.getBounds();
    setClusterBounds([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]);
    setClusterZoom(map.getZoom());
  }, []);

  const reportViewport = useCallback((userInitiated: boolean) => {
    const map = mapRef.current;
    if (!map) return;
    syncClusterViewport();
    onViewportChangeRef.current?.(boundsFromMap(map), { userInitiated });
  }, [syncClusterViewport]);

  const applyInitialViewport = useCallback(() => {
    const map = mapRef.current;
    if (!map || viewportInitializedRef.current) return;

    viewportInitializedRef.current = true;
    userMovedRef.current = false;
    ignoreViewportUntilRef.current = Date.now() + 900;

    if (searchPolygon && searchPolygon.length >= 3) {
      fitMapToPolygon(map, searchPolygon);
    } else if (initialBounds) {
      fitMapToBounds(map, initialBounds, { maxZoom: fitMaxZoom });
    } else if (fitMarkersOnLoad && markers.length > 0) {
      fitMapToMarkers(map, markers, fitMaxZoom, fitMinZoom);
    } else {
      map.setCenter({ lng, lat });
      map.setZoom(zoom);
    }

    window.setTimeout(() => {
      reportViewport(false);
    }, 50);
  }, [
    fitMarkersOnLoad,
    fitMaxZoom,
    fitMinZoom,
    initialBounds,
    lat,
    lng,
    markers,
    reportViewport,
    searchPolygon,
    zoom,
  ]);

  const handleLoad = useCallback(() => {
    applyInitialViewport();
  }, [applyInitialViewport]);

  const handleMoveStart = useCallback((event: ViewStateChangeEvent) => {
    if (!isUserMapEvent(event)) return;
    userMovedRef.current = true;
  }, []);

  const handleMoveEnd = useCallback(
    (event: ViewStateChangeEvent) => {
      syncClusterViewport();

      if (Date.now() < ignoreViewportUntilRef.current) return;
      if (!userMovedRef.current && !isUserMapEvent(event)) return;

      reportViewport(true);
    },
    [reportViewport, syncClusterViewport]
  );

  useEffect(() => {
    const nextId = selectedMarkerId ?? null;
    if (nextId === prevSelectedMarkerRef.current) return;
    prevSelectedMarkerRef.current = nextId;

    if (!nextId) return;

    const marker = markers.find((m) => m.id === nextId);
    const map = mapRef.current;
    if (!marker || !map) return;

    if (markerNeedsPanForPreview(map, marker)) {
      userMovedRef.current = true;
      ignoreViewportUntilRef.current = Date.now() + 600;
      panToRevealMarker(map, marker);
    }
  }, [selectedMarkerId, markers]);

  const handleMarkerClick = useCallback(
    (marker: MapMarker) => {
      onMarkerClick?.(marker.id);
    },
    [onMarkerClick]
  );

  const handleClusterClick = useCallback(
    (clusterId: number, longitude: number, latitude: number) => {
      const map = mapRef.current;
      if (!map) return;

      userMovedRef.current = true;
      ignoreViewportUntilRef.current = Date.now() + 600;

      const expansionZoom = safeClusterExpansionZoom(clusterIndexRef.current, clusterId);
      map.easeTo({
        center: { lng: longitude, lat: latitude },
        zoom: expansionZoom ?? Math.min(map.getZoom() + 2, MIDORA_MAP_LISTING_FOCUS_ZOOM),
        duration: 350,
      });
    },
    []
  );

  const polygonFeature = useMemo(() => {
    if (!searchPolygon || searchPolygon.length < 3) return null;
    return polygonGeoJson(searchPolygon);
  }, [searchPolygon]);

  const handleMapBackgroundClick = useCallback(() => {
    onMarkerDeselect?.();
  }, [onMarkerDeselect]);

  return (
    <MidoraMapCore
      mapRef={mapRef}
      initialViewState={initialViewStateRef.current}
      height={height}
      flush={flush}
      onLoad={handleLoad}
      onMoveStart={handleMoveStart}
      onMoveEnd={handleMoveEnd}
      onMapClick={handleMapBackgroundClick}
      scrollZoomMode="full"
      dragPan
      doubleClickZoom
      touchZoomRotate
      boxZoom
      keyboard
      showZoomControls
      className={cn("midora-results-map")}
    >
      {polygonFeature ? (
        <Source id="search-polygon" type="geojson" data={polygonFeature}>
          <Layer
            id="search-polygon-fill"
            type="fill"
            paint={{
              "fill-color": "#5a8f7b",
              "fill-opacity": 0.15,
            }}
          />
          <Layer
            id="search-polygon-line"
            type="line"
            paint={{
              "line-color": "#5a8f7b",
              "line-width": 2,
            }}
          />
        </Source>
      ) : null}

      {clusterItems.map((item) => {
        if (item.kind === "cluster") {
          return (
            <Marker
              key={`cluster-${item.clusterId}-${item.pointCount}`}
              longitude={item.longitude}
              latitude={item.latitude}
              anchor="center"
            >
              <MidoraMapCluster
                label={item.label}
                onClick={() =>
                  handleClusterClick(item.clusterId, item.longitude, item.latitude)
                }
              />
            </Marker>
          );
        }

        const { marker, longitude, latitude } = item;
        const isHovered = marker.id === hoveredMarkerId;
        const isSelected = marker.id === selectedMarkerId;
        const isActive = isHovered || isSelected;

        return (
          <Marker
            key={marker.id}
            longitude={longitude}
            latitude={latitude}
            anchor="center"
            style={{ zIndex: isSelected ? 3 : isHovered ? 2 : 1 }}
          >
            <MidoraPriceMarker
              label={formatMarkerPriceLabel(marker.priceLabel, marker.price)}
              active={isActive}
              onClick={() => handleMarkerClick(marker)}
              onMouseEnter={() => onMarkerHover?.(marker.id)}
              onMouseLeave={() => onMarkerHover?.(null)}
            />
          </Marker>
        );
      })}

      {popupMarker ? (
        <Popup
          longitude={popupMarker.lng}
          latitude={popupMarker.lat}
          anchor="bottom"
          offset={18}
          closeButton={false}
          closeOnClick={false}
          className="midora-map-popup-shell"
          onClose={() => onMarkerDeselect?.()}
        >
          <ListingMapPreview marker={popupMarker} />
        </Popup>
      ) : null}
    </MidoraMapCore>
  );
}
