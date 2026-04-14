import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import { ArrowsPointingOutIcon, XMarkIcon } from "@heroicons/react/24/outline";
import MapSearchControl from "./MapSearchControl.jsx";
import MapZoomLocationControls from "./MapZoomLocationControls.jsx";
import "leaflet/dist/leaflet.css";

const defaultCenter = [11.3410, 77.7172];

const MapEventListener = () => {
  const map = useMap();

  useEffect(() => {
    const handleCenterMap = (event) => {
      const { lat, lng, zoom = 16 } = event.detail;
      map.setView([lat, lng], zoom, { animate: true });
    };

    window.addEventListener('centerMap', handleCenterMap);
    return () => window.removeEventListener('centerMap', handleCenterMap);
  }, [map]);

  return null;
};

const MapInvalidator = ({ isFullscreen }) => {
  const map = useMap();
  useEffect(() => {
    // Fire immediately on mount to handle flex/grid parents with no explicit height
    const mountTimer = setTimeout(() => {
      map.invalidateSize({ animate: false });
    }, 100);
    // Fire again on fullscreen toggle
    const fsTimer = setTimeout(() => {
      map.invalidateSize();
    }, 300);
    return () => {
      clearTimeout(mountTimer);
      clearTimeout(fsTimer);
    };
  }, [map, isFullscreen]);
  return null;
};

export default function MapContainerFullscreen({
  children,
  center = defaultCenter,
  zoom = 13,
  className = "",
  height = "70vh",
  showSearch = true,
  searchQuery = "",
  onSearchSelect,
  isFullscreen: controlledIsFullscreen,
  onToggleFullscreen: controlledOnToggleFullscreen,
  overlayContent,
  showFullscreenButton = true,
  searchClassName = "absolute top-6 z-[1100] left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] md:w-[500px]",
  controlsClassName = "absolute top-1/2 -translate-y-1/2 right-3 z-[1100] flex flex-col gap-3"
}) {
  const [internalIsFullscreen, setInternalIsFullscreen] = useState(false);
  const containerRef = useRef(null);
  const isFullscreen = controlledIsFullscreen !== undefined ? controlledIsFullscreen : internalIsFullscreen;
  const [mapStyle, setMapStyle] = useState("street"); // "street" or "satellite"

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isNativeFullscreen = !!document.fullscreenElement;
      if (controlledOnToggleFullscreen) {
        if (controlledIsFullscreen !== isNativeFullscreen) {
          controlledOnToggleFullscreen(isNativeFullscreen);
        }
      } else {
        setInternalIsFullscreen(isNativeFullscreen);
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [controlledIsFullscreen, controlledOnToggleFullscreen]);

  const toggleFullscreen = async () => {
    try {
      if (!isFullscreen) {
        if (containerRef.current) await containerRef.current.requestFullscreen();
      } else {
        if (document.fullscreenElement) await document.exitFullscreen();
      }
    } catch (err) {
      console.error("Fullscreen toggle failed:", err);
    }
  };

  useEffect(() => {
    if (controlledIsFullscreen && !document.fullscreenElement && containerRef.current) {
      containerRef.current.requestFullscreen().catch(err => console.warn("Auto-enter FS failed", err));
    } else if (!controlledIsFullscreen && document.fullscreenElement) {
      document.exitFullscreen().catch(err => console.warn("Auto-exit FS failed", err));
    }
  }, [controlledIsFullscreen]);

  const containerStyle = {
    height: isFullscreen ? "100vh" : height,
    width: isFullscreen ? "100vw" : "100%",
    position: isFullscreen ? "fixed" : "relative",
    top: isFullscreen ? 0 : "auto",
    left: isFullscreen ? 0 : "auto",
    margin: 0,
    zIndex: isFullscreen ? 9999 : "auto",
    backgroundColor: "white"
  };

  return (
    <div
      ref={containerRef}
      className={`${className} ${isFullscreen ? "fullscreen-active fixed inset-0 z-[9999]" : "relative rounded-xl border border-slate-200 overflow-hidden"}`}
      style={containerStyle}
    >

      {/* Overlays (Sidebar, Action Bar) - Parent must ensure these have high z-index (e.g. z-[2000]) */}
      {overlayContent}

      <div className="w-full h-full min-h-0 z-0 isolate">
        <MapContainer
          center={center}
          zoom={zoom}
          style={{ height: "100%", width: "100%" }}
          zoomControl={false}
          maxZoom={22}
        >
          <MapInvalidator isFullscreen={isFullscreen} />

          {showSearch && (
            <MapSearchControl
              onSelect={onSearchSelect}
              externalQuery={searchQuery}
              className={searchClassName}
            />
          )}

          <TileLayer
            attribution={mapStyle === "street" ? '&copy; <a href="https://osm.org/copyright">OSM</a>' : 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EBP, and the GIS User Community'}
            url={mapStyle === "street"
              ? "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              : "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            }
            maxZoom={22}
            maxNativeZoom={mapStyle === "street" ? 19 : 18}
          />
          {mapStyle === "satellite" && (
            <>
              {/* Layer 1: Detailed place names, landmarks, and city markers from Esri */}
              <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
                maxZoom={22}
                maxNativeZoom={18}
                opacity={1}
                zIndex={11}
              />
              {/* Layer 2: High-density POIs like clinics, shops, and restaurants from CartoDB */}
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                maxZoom={22}
                maxNativeZoom={19}
                opacity={1}
                zIndex={12}
              />
              {/* Layer 3: Strategic road names and bypass indicators from Esri for clarity */}
              <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}"
                maxZoom={22}
                maxNativeZoom={18}
                opacity={0.8}
                zIndex={10}
              />
            </>
          )}
          <MapZoomLocationControls
            className={controlsClassName}
            mapStyle={mapStyle}
            setMapStyle={setMapStyle}
            isFullscreen={isFullscreen}
            onToggleFullscreen={() => {
              if (controlledOnToggleFullscreen) controlledOnToggleFullscreen(!isFullscreen);
              else toggleFullscreen();
            }}
            showFullscreenButton={showFullscreenButton}
          />
          <MapEventListener />
          {children}
        </MapContainer>
      </div>

      {isFullscreen && (
        <div className="absolute bottom-4 left-4 z-[2000] bg-white/50 backdrop-blur rounded px-2 py-1 text-[10px] text-slate-500 pointer-events-none">
          Press Esc to exit
        </div>
      )}
    </div>
  );
}