import { useMap } from "react-leaflet";
import { PlusIcon, MinusIcon, ArrowsPointingOutIcon, XMarkIcon, Square3Stack3DIcon } from "@heroicons/react/24/outline";
import { MapPinIcon } from "@heroicons/react/24/solid";

export default function MapZoomLocationControls({
  mapStyle,
  setMapStyle,
  isFullscreen,
  onToggleFullscreen,
  showFullscreenButton,
  className = "absolute top-24 right-4 z-[1000] flex flex-col gap-2"
}) {
  const map = useMap();

  const handleZoomIn = (e) => {
    e.stopPropagation();
    map.zoomIn();
  };

  const handleZoomOut = (e) => {
    e.stopPropagation();
    map.zoomOut();
  };

  const handleLocate = (e) => {
    e.stopPropagation();
    map.locate({ setView: true, maxZoom: 16 });
  };

  // Prevent clicks from propagating to map (dragging etc)
  const disablePropagation = (e) => {
    e.stopPropagation();
  };

  return (
    <div
      className={className}
      onDoubleClick={disablePropagation}
      onMouseDown={disablePropagation}
      onClick={disablePropagation}
      onTouchStart={disablePropagation}
    >
      {/* Fullscreen Button */}
      {showFullscreenButton && (
        <div className="relative group/tooltip">
          <button
            type="button"
            onClick={onToggleFullscreen}
            className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md p-2 rounded-full shadow-lg border border-slate-200/50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center justify-center w-11 h-11 transform active:scale-95"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? (
              <XMarkIcon className="h-6 w-6 text-slate-700 dark:text-slate-200" />
            ) : (
              <ArrowsPointingOutIcon className="h-6 w-6 text-slate-700 dark:text-slate-200" />
            )}
          </button>
        </div>
      )}

      {/* Location Button */}
      <div className="relative group/tooltip">
        <button
          onClick={handleLocate}
          className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md p-2 rounded-full shadow-lg border border-slate-200/50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center justify-center w-11 h-11 transform active:scale-95"
          title="Show Your Location"
          type="button"
        >
          <MapPinIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </button>
      </div>

      {/* Zoom Controls Stack */}
      <div className="flex flex-col gap-1">
        <div className="relative group/tooltip">
          <button
            onClick={handleZoomIn}
            className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md p-2 rounded-t-2xl rounded-b-sm shadow-lg border border-slate-200/50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center justify-center w-11 h-11 transform active:scale-95"
            title="Zoom In"
            type="button"
          >
            <PlusIcon className="h-6 w-6 text-slate-700 dark:text-slate-200 stroke-2" />
          </button>
        </div>
        <div className="relative group/tooltip">
          <button
            onClick={handleZoomOut}
            className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md p-2 rounded-b-2xl rounded-t-sm shadow-lg border border-slate-200/50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center justify-center w-11 h-11 transform active:scale-95"
            title="Zoom Out"
            type="button"
          >
            <MinusIcon className="h-6 w-6 text-slate-700 dark:text-slate-200 stroke-2" />
          </button>
        </div>
      </div>

      {/* Satellite Toggle Button */}
      <div className="relative group/tooltip">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setMapStyle(prev => prev === "street" ? "satellite" : "street");
          }}
          className={`bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-full shadow-lg border transition-all w-11 h-11 flex items-center justify-center group/btn overflow-hidden transform active:scale-95 ${mapStyle === 'satellite' ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200/50 dark:border-slate-700/50'
            }`}
          title={mapStyle === "street" ? "Switch to Satellite" : "Switch to Street Map"}
        >
          <Square3Stack3DIcon className={`h-6 w-6 transition-all duration-300 ${mapStyle === 'satellite' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-200'}`} />
        </button>
      </div>
    </div>
  );
}
