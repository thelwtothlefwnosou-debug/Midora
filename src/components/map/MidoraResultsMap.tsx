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
  activeMarkerId?: string | null;
  searchPolygon?: LatLng[];
  initialBounds?: MapBounds;
  onViewportChange?: (bounds: MapBounds, meta: MapViewportChangeMeta) => void;
  fitMarkersOnLoad?: boolean;
  fitMaxZoom?: number;
  fitMinZoom?: number;
  onMarkerClick?: (id: string) => void;
  onMarkerHover?: (id: string | null) => void;
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

export function MidoraResultsMap({
  lat,
  lng,
  zoom = 12,
  height = "100%",
  markers = [],
  activeMarkerId,
  searchPolygon,
  initialBounds,
  onViewportChange,
  fitMarkersOnLoad = false,
  fitMaxZoom = 14,
  fitMinZoom = 6,
  onMarkerClick,
  onMarkerHover,
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

  const [popupMarkerId, setPopupMarkerId] = useState<string | null>(null);
  const [clusterBounds, setClusterBounds] = useState<BBox>([-180, -85, 180, 85]);
  const [clusterZoom, setClusterZoom] = useState(zoom);

  onViewportChangeRef.current = onViewportChange;

  const { index: clusterIndex, items: clusterItems } = useMapClusterLayer(
    markers,
    clusterBounds,
    clusterZoom
  );
  const clusterIndexRef = useRef(clusterIndex);
  clusterIndexRef.current = clusterIndex;

  const popupMarker = useMemo(
    () => markers.find((m) => m.id === popupMarkerId) ?? null,
    [markers, popupMarkerId]
  );

  useEffect(() => {
    if (popupMarkerId && !markers.some((m) => m.id === popupMarkerId)) {
      setPopupMarkerId(null);
    }
  }, [markers, popupMarkerId]);

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

  const flyToMarker = useCallback((marker: MapMarker) => {
    const map = mapRef.current;
    if (!map) return;
    userMovedRef.current = true;
    ignoreViewportUntilRef.current = Date.now() + 600;
    map.easeTo({
      center: { lng: marker.lng, lat: marker.lat },
      zoom: MIDORA_MAP_LISTING_FOCUS_ZOOM,
      duration: 450,
    });
  }, []);

  const handleMarkerClick = useCallback(
    (marker: MapMarker) => {
      setPopupMarkerId(marker.id);
      flyToMarker(marker);
      onMarkerClick?.(marker.id);
    },
    [flyToMarker, onMarkerClick]
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

  return (
    <MidoraMapCore
      mapRef={mapRef}
      initialViewState={initialViewStateRef.current}
      height={height}
      flush={flush}
      onLoad={handleLoad}
      onMoveStart={handleMoveStart}
      onMoveEnd={handleMoveEnd}
      scrollZoom
      dragPan
      doubleClickZoom
      touchZoomRotate
      boxZoom
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
        const highlighted = marker.id === activeMarkerId || marker.id === popupMarkerId;

        return (
          <Marker
            key={marker.id}
            longitude={longitude}
            latitude={latitude}
            anchor="center"
            style={{ zIndex: highlighted ? 2 : 1 }}
          >
            <MidoraPriceMarker
              label={formatMarkerPriceLabel(marker.priceLabel, marker.price)}
              active={highlighted}
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
          onClose={() => setPopupMarkerId(null)}
        >
          <ListingMapPreview marker={popupMarker} />
        </Popup>
      ) : null}
    </MidoraMapCore>
  );
}
