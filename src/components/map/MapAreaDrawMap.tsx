"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Polygon,
  Polyline,
  CircleMarker,
  useMap,
  useMapEvents,
} from "react-leaflet";
import type { LatLng } from "@/lib/geo/polygon";
import {
  haversineMeters,
  isNearFirstPoint,
  polygonBounds,
  POLYGON_MIN_POINTS,
  POLYGON_STROKE_MIN_METERS,
  simplifyPolygon,
} from "@/lib/geo/polygon";
import { MAP_TILE_ATTRIBUTION, MAP_TILE_URL } from "@/lib/map-tiles";

type Props = {
  center: LatLng;
  zoom: number;
  points: LatLng[];
  closed: boolean;
  onAddPoint: (point: LatLng) => void;
  onSetPoints: (points: LatLng[]) => void;
  onClosePolygon: () => void;
};

const FREEHAND_PIXEL_THRESHOLD = 10;

function FitBounds({ points }: { points: LatLng[] }) {
  const map = useMap();

  useEffect(() => {
    if (points.length < POLYGON_MIN_POINTS) return;
    const { minLat, maxLat, minLng, maxLng } = polygonBounds(points);
    map.fitBounds(
      [
        [minLat, minLng],
        [maxLat, maxLng],
      ],
      { padding: [48, 48] }
    );
  }, [map, points]);

  return null;
}

function DrawHandler({
  points,
  closed,
  onAddPoint,
  onSetPoints,
  onClosePolygon,
  onDrawingChange,
  onLiveStrokeChange,
}: Pick<Props, "points" | "closed" | "onAddPoint" | "onSetPoints" | "onClosePolygon"> & {
  onDrawingChange: (drawing: boolean) => void;
  onLiveStrokeChange: (stroke: LatLng[]) => void;
}) {
  const map = useMap();
  const drawingRef = useRef(false);
  const freehandRef = useRef(false);
  const strokeRef = useRef<LatLng[]>([]);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const startLatLngRef = useRef<LatLng | null>(null);

  useEffect(() => {
    if (closed) {
      map.dragging.enable();
      onDrawingChange(false);
    }
  }, [closed, map, onDrawingChange]);

  function beginDraw(containerPoint: { x: number; y: number }) {
    if (closed) return;
    drawingRef.current = true;
    freehandRef.current = false;
    strokeRef.current = [];
    startRef.current = containerPoint;
    startLatLngRef.current = null;
    map.dragging.disable();
    onDrawingChange(true);
  }

  function appendStrokePoint(point: LatLng) {
    const last = strokeRef.current[strokeRef.current.length - 1];
    if (last && haversineMeters(last, point) < POLYGON_STROKE_MIN_METERS) return;
    strokeRef.current.push(point);
    onLiveStrokeChange([...strokeRef.current]);
  }

  function resetDrawState() {
    drawingRef.current = false;
    freehandRef.current = false;
    strokeRef.current = [];
    startRef.current = null;
    startLatLngRef.current = null;
    map.dragging.enable();
    onDrawingChange(false);
    onLiveStrokeChange([]);
  }

  function finishDraw(latlng: { lat: number; lng: number } | null) {
    if (!drawingRef.current || closed) return;

    if (!latlng) {
      resetDrawState();
      return;
    }

    const point = { lat: latlng.lat, lng: latlng.lng };

    if (
      points.length >= POLYGON_MIN_POINTS &&
      isNearFirstPoint(point, points[0], map.getZoom())
    ) {
      resetDrawState();
      onClosePolygon();
      return;
    }

    onAddPoint(point);
    resetDrawState();
  }

  function completeFreehand() {
    const stroke = strokeRef.current;
    resetDrawState();

    if (stroke.length < POLYGON_MIN_POINTS) return;

    const simplified = simplifyPolygon(stroke);
    if (simplified.length < POLYGON_MIN_POINTS) return;

    onSetPoints(simplified);
    onClosePolygon();
  }

  function activateFreehand() {
    if (freehandRef.current) return;
    freehandRef.current = true;
    if (startLatLngRef.current) {
      strokeRef.current = [startLatLngRef.current];
      onLiveStrokeChange([startLatLngRef.current]);
    }
  }

  useMapEvents({
    mousedown(e) {
      beginDraw(e.containerPoint);
      startLatLngRef.current = { lat: e.latlng.lat, lng: e.latlng.lng };
    },
    mousemove(e) {
      if (!drawingRef.current || closed) return;

      const start = startRef.current;
      if (start) {
        const dx = e.containerPoint.x - start.x;
        const dy = e.containerPoint.y - start.y;
        if (Math.hypot(dx, dy) > FREEHAND_PIXEL_THRESHOLD) {
          activateFreehand();
        }
      }

      if (!freehandRef.current) return;

      appendStrokePoint({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
    mouseup(e) {
      if (freehandRef.current) {
        completeFreehand();
        return;
      }
      finishDraw(e.latlng);
    },
    dblclick() {
      if (closed) return;
      if (points.length >= POLYGON_MIN_POINTS) {
        onClosePolygon();
      }
    },
  });

  return null;
}

export function MapAreaDrawMap({
  center,
  zoom,
  points,
  closed,
  onAddPoint,
  onSetPoints,
  onClosePolygon,
}: Props) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [liveStroke, setLiveStroke] = useState<LatLng[]>([]);

  const polylinePositions = useMemo(
    () => points.map((p) => [p.lat, p.lng] as [number, number]),
    [points]
  );

  const liveStrokePositions = useMemo(
    () => liveStroke.map((p) => [p.lat, p.lng] as [number, number]),
    [liveStroke]
  );

  const canClose = points.length >= POLYGON_MIN_POINTS && !closed;

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={zoom}
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom
      doubleClickZoom={!isDrawing}
      className={isDrawing ? "map-draw-surface is-drawing" : "map-draw-surface"}
    >
      <TileLayer attribution={MAP_TILE_ATTRIBUTION} url={MAP_TILE_URL} />

      <DrawHandler
        points={points}
        closed={closed}
        onAddPoint={onAddPoint}
        onSetPoints={onSetPoints}
        onClosePolygon={onClosePolygon}
        onDrawingChange={(drawing) => {
          setIsDrawing(drawing);
          if (!drawing) setLiveStroke([]);
        }}
        onLiveStrokeChange={setLiveStroke}
      />

      {closed && points.length >= POLYGON_MIN_POINTS && <FitBounds points={points} />}

      {liveStroke.length >= 2 && (
        <Polyline
          positions={liveStrokePositions}
          pathOptions={{
            color: "#5a8f7b",
            weight: 3,
            opacity: 0.85,
          }}
        />
      )}

      {points.length >= 2 && !closed && (
        <Polyline
          positions={polylinePositions}
          pathOptions={{
            color: "#5a8f7b",
            weight: 2,
            dashArray: "6 4",
          }}
        />
      )}

      {closed && points.length >= POLYGON_MIN_POINTS && (
        <Polygon
          positions={polylinePositions}
          pathOptions={{
            color: "#5a8f7b",
            weight: 2,
            fillColor: "#5a8f7b",
            fillOpacity: 0.25,
          }}
        />
      )}

      {points.map((p, i) => {
        const isFirst = i === 0;
        const highlight = isFirst && canClose;

        return (
          <CircleMarker
            key={`${p.lat}-${p.lng}-${i}`}
            center={[p.lat, p.lng]}
            radius={highlight ? 12 : 7}
            pathOptions={{
              color: highlight ? "#5a8f7b" : "#ffffff",
              weight: highlight ? 3 : 2,
              fillColor: highlight ? "#5a8f7b" : "#ffffff",
              fillOpacity: 1,
            }}
            eventHandlers={
              highlight
                ? {
                    click: (e) => {
                      e.originalEvent.preventDefault();
                      e.originalEvent.stopPropagation();
                      onClosePolygon();
                    },
                  }
                : undefined
            }
          />
        );
      })}
    </MapContainer>
  );
}
