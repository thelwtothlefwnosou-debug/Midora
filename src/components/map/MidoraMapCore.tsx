"use client";

import {
  Component,
  type ReactNode,
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import Map, { type MapRef, type ViewStateChangeEvent } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { MIDORA_MAP_MAX_ZOOM, MIDORA_MAP_MIN_ZOOM, MIDORA_MAP_STYLE } from "@/lib/map-config";
import { MapErrorState } from "@/components/map/MapErrorState";
import { cn } from "@/lib/utils";

type ViewState = {
  longitude: number;
  latitude: number;
  zoom: number;
};

type Props = {
  mapRef?: RefObject<MapRef | null>;
  initialViewState: ViewState;
  height?: string;
  className?: string;
  flush?: boolean;
  scrollZoom?: boolean;
  dragPan?: boolean;
  doubleClickZoom?: boolean;
  touchZoomRotate?: boolean;
  boxZoom?: boolean;
  maxZoom?: number;
  minZoom?: number;
  onMoveStart?: (event: ViewStateChangeEvent) => void;
  onMoveEnd?: (event: ViewStateChangeEvent) => void;
  onLoad?: () => void;
  children?: ReactNode;
};

type BoundaryState = { hasError: boolean };

class MapErrorBoundary extends Component<
  { onReset: () => void; height?: string; children: ReactNode },
  BoundaryState
> {
  state: BoundaryState = { hasError: false };

  static getDerivedStateFromError(): BoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <MapErrorState
          height={this.props.height}
          onRetry={() => {
            this.setState({ hasError: false });
            this.props.onReset();
          }}
        />
      );
    }
    return this.props.children;
  }
}

export function MidoraMapCore({
  mapRef,
  initialViewState,
  height = "100%",
  className,
  flush = false,
  scrollZoom = true,
  dragPan = true,
  doubleClickZoom = true,
  touchZoomRotate = true,
  boxZoom = false,
  maxZoom = MIDORA_MAP_MAX_ZOOM,
  minZoom = MIDORA_MAP_MIN_ZOOM,
  onMoveStart,
  onMoveEnd,
  onLoad,
  children,
}: Props) {
  const [loadError, setLoadError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [mapReady, setMapReady] = useState(false);
  const shellRef = useRef<HTMLDivElement>(null);

  const handleError = useCallback(() => setLoadError(true), []);

  const handleMapLoad = useCallback(() => {
    const map = mapRef?.current?.getMap();
    map?.setMaxZoom(maxZoom);
    map?.setMinZoom(minZoom);
    mapRef?.current?.resize();
    setMapReady(true);
    onLoad?.();
  }, [mapRef, maxZoom, minZoom, onLoad]);

  useEffect(() => {
    if (!mapReady) return;
    const map = mapRef?.current;
    if (!map) return;

    const resize = () => map.resize();
    const container = map.getContainer()?.parentElement;
    const ro = container ? new ResizeObserver(() => resize()) : null;
    if (container) ro?.observe(container);

    window.addEventListener("resize", resize);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, [mapReady, mapRef]);

  useEffect(() => {
    const shell = shellRef.current;
    if (!shell || !scrollZoom) return;

    const stopWheelBubble = (event: WheelEvent) => {
      event.stopPropagation();
    };

    shell.addEventListener("wheel", stopWheelBubble, { passive: false });
    return () => shell.removeEventListener("wheel", stopWheelBubble);
  }, [mapReady, scrollZoom, retryKey]);

  if (loadError) {
    return (
      <MapErrorState
        height={height}
        onRetry={() => {
          setLoadError(false);
          setMapReady(false);
          setRetryKey((k) => k + 1);
        }}
      />
    );
  }

  return (
    <div
      ref={shellRef}
      className={cn(
        "relative h-full w-full overflow-hidden bg-[#eceae6]",
        flush ? "rounded-none border-0" : "rounded-l-2xl border-l border-border",
        className
      )}
      style={height !== "100%" ? { height } : undefined}
    >
      <MapErrorBoundary
        key={retryKey}
        height={height}
        onReset={() => setRetryKey((k) => k + 1)}
      >
        <div className="midora-map-container h-full w-full">
          <Map
            ref={mapRef}
            mapStyle={MIDORA_MAP_STYLE}
            initialViewState={initialViewState}
            style={{ width: "100%", height: "100%" }}
            scrollZoom={scrollZoom}
            dragPan={dragPan}
            doubleClickZoom={doubleClickZoom}
            touchZoomRotate={touchZoomRotate}
            boxZoom={boxZoom}
            maxZoom={maxZoom}
            minZoom={minZoom}
            attributionControl={{ compact: true }}
            onMoveStart={onMoveStart}
            onMoveEnd={onMoveEnd}
            onLoad={handleMapLoad}
            onError={handleError}
          >
            {children}
          </Map>
        </div>
      </MapErrorBoundary>
    </div>
  );
}

export type { ViewStateChangeEvent, MapRef };
