import { useEffect, useState, useMemo } from "react";
import { Marker, Circle, Popup, useMap } from "react-leaflet";
import { Link, useLocation } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import api from "../services/api";
import MapContainerFullscreen from "../components/MapContainerFullscreen.jsx";
import MapSearchControl from "../components/MapSearchControl.jsx";
import PublicSidebar from "../components/PublicSidebar.jsx";
import ThemeToggle from "../components/ThemeToggle.jsx";
import LanguageSwitcher from "../components/LanguageSwitcher.jsx";
import UserDropdown from "../components/UserDropdown.jsx";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext.jsx";

const defaultCenter = [11.3410, 77.7172];

const radiusFromDims = (maxWidth, maxLength) => {
  return Math.sqrt(maxWidth ** 2 + maxLength ** 2) / 2;
};

// Helper component to sync map movement with parent state (for congestion logic, etc.)
const MapBoundsUpdater = ({ onBoundsChange }) => {
  const map = useMap();
  useEffect(() => {
    const updateBounds = () => {
      const bounds = map.getBounds();
      onBoundsChange({
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest()
      });
    };
    map.on("moveend", updateBounds);
    map.on("zoomend", updateBounds);
    updateBounds();
    return () => {
      map.off("moveend", updateBounds);
      map.off("zoomend", updateBounds);
    };
  }, [map, onBoundsChange]);
  return null;
};

// Helper to zoom to a vendor
const MapZoomHandler = ({ target }) => {
  const map = useMap();
  useEffect(() => {
    if (target && target.lat && target.lng) {
      map.flyTo([target.lat, target.lng], 17, { duration: 1.5 });
    }
  }, [target, map]);
  return null;
};

export default function PublicMap() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [vendors, setVendors] = useState([]);
  const [congestion, setCongestion] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [mapBounds, setMapBounds] = useState(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null); 
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);

  useEffect(() => {
    const handleResize = () => {
      // Auto-collapse sidebar on mobile resize to desktop transition? 
      // Actually let's just leave it as is if fixed, but the user wants it hidden by default on mobile.
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Prevent double scrolling
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const categories = useMemo(() => {
    const cats = new Set(vendors.map(v => v.category).filter(Boolean));
    return Array.from(cats).sort();
  }, [vendors]);

  const filteredVendors = useMemo(() => {
    return vendors.filter(v => {
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        (v.business_name && v.business_name.toLowerCase().includes(q)) ||
        (v.category && v.category.toLowerCase().includes(q)) ||
        (v.space_name && v.space_name.toLowerCase().includes(q)) ||
        (v.address && v.address.toLowerCase().includes(q)) ||
        (v.menu_items && Array.isArray(v.menu_items) && v.menu_items.some(item => item.name && item.name.toLowerCase().includes(q)));
      const matchesCategory = !selectedCategory || v.category === selectedCategory;
      return matchesQuery && matchesCategory;
    });
  }, [vendors, searchQuery, selectedCategory]);

  const fetchVendors = async (signal) => {
    setLoading(true);
    console.log("[Search Debug]: Querying for:", searchQuery);
    console.log("[Auth Debug]: Token present:", !!localStorage.getItem('smartstreet_token'));
    try {
      const { data } = await api.get("/public/vendors", { signal });
      setVendors(data.vendors || []);
    } catch (err) {
      if (err.name !== "CanceledError" && err.code !== "ERR_CANCELED" && err.code !== "ECONNABORTED") {
        console.error("Failed to load vendors:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchCongestion = async (bounds, signal) => {
    if (!bounds) return;
    try {
      const { data } = await api.get(`/public/routes?bounds=${encodeURIComponent(JSON.stringify(bounds))}`, { signal });
      setCongestion(data.congestion || []);
    } catch (err) {
      if (err.name !== "CanceledError" && err.code !== "ERR_CANCELED" && err.code !== "ECONNABORTED") {
        console.error("Failed to load congestion data:", err);
      }
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchVendors(controller.signal);
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (mapBounds) {
      fetchCongestion(mapBounds);
    }
  }, [mapBounds]);

  const location = useLocation();
  useEffect(() => {
    if (location.state?.focusVendor) {
      // Small delay to ensure map is ready or just set it directly
      setSelectedVendor({ data: location.state.focusVendor, ts: Date.now() });

      // Clear state so it doesn't persist if we navigate away and back? 
      // Actually React Router state persists. We might want to clear it, but let's keep it simple.
      // We can also ensure the vendor is added to the list if not already present?
      // Logic: if the vendor from search results isn't in the current viewport list, we should probably add it 
      // OR we just rely on the map moving to that location and fetching new vendors there.
      // But fetchVendors depends on viewport? No, fetchVendors fetches ALL public vendors currently (based on API).
      // So simply setting selectedVendor is enough.
    }
  }, [location.state]);

  // Wrap selected vendor in an object with distinct key to force updates on re-click
  const handleVendorClick = (vendor) => {
    setSelectedVendor({ data: vendor, ts: Date.now() });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">

        <div className="absolute inset-0 z-0 overflow-hidden">
          <MapContainerFullscreen
            height="100dvh"
            center={defaultCenter}
            zoom={13}
            showSearch={false} // Disable internal search to avoid duplicate
            searchQuery={searchQuery}
            sidebarOpen={sidebarOpen}
            onToggleFullscreen={setFullscreen}
            isFullscreen={fullscreen}
            overlayContent={
              <PublicSidebar
                vendors={filteredVendors}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                categories={categories}
                onVendorClick={setSelectedVendor}
                loading={loading}
                congestion={congestion}
                isOpen={sidebarOpen}
                setIsOpen={setSidebarOpen}
              />
            }
          >
        {/* Center Search Bar - Intelligence Viewport Shift */}
        <div 
          className={`absolute top-2 md:top-4 z-[1000] pointer-events-none transition-all duration-500 ease-in-out left-1/2 -translate-x-1/2 w-[90%] md:w-[500px] ${
            sidebarOpen ? 'md:left-[calc(384px+(100vw-384px)/2)]' : ''
          }`}
        >
          <div className="pointer-events-auto">
            <MapSearchControl
              placeholder="Search places..."
              onSelect={(lat, lng) => {
                // Handled internally
              }}
            />
          </div>
        </div>

        {/* Header Controls (Right) */}
        <div className="absolute top-4 right-4 z-[2000] flex flex-col-reverse sm:flex-row items-end sm:items-start gap-3 pointer-events-none">
          <div className="flex items-center gap-3 pointer-events-auto shadow-sm rounded-xl overflow-hidden sm:overflow-visible sm:shadow-none bg-white/10 sm:bg-transparent p-1 sm:p-0 backdrop-blur-sm sm:backdrop-blur-none border sm:border-none border-white/20">

            {user ? (
              <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-2 py-1 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <UserDropdown />
              </div>
            ) : (
              <Link
                to="/login"
                className="bg-cyan-600 hover:bg-cyan-500 backdrop-blur-md px-4 py-2 sm:px-5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold text-white transition-all shadow-md shadow-cyan-600/30 border border-cyan-500"
              >
                {t('login')}
              </Link>
            )}
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-1.5 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hidden sm:block">
              <ThemeToggle />
            </div>
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-1.5 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hidden sm:block">
              <LanguageSwitcher />
            </div>
          </div>
        </div>

        <MapBoundsUpdater onBoundsChange={setMapBounds} />
        {selectedVendor?.data && (
          <MapZoomHandler
            key={selectedVendor.ts}
            target={selectedVendor.data}
          />
        )}

        {filteredVendors.map(vendor => {
          if (!vendor.lat || !vendor.lng) return null;

          const lat = Number(vendor.lat);
          const lng = Number(vendor.lng);
          const isOpenNow = isVendorOpen(vendor.start_time, vendor.end_time);

          const requestRadius = vendor.max_width && vendor.max_length
            ? radiusFromDims(vendor.max_width, vendor.max_length)
            : 5;

          return (
            <div key={`${vendor.vendor_id}-${vendor.request_id}`}>
              <Marker
                position={[lat, lng]}
                eventHandlers={{
                  click: () => handleVendorClick(vendor)
                }}
                icon={L.divIcon({
                  className: 'custom-vendor-marker',
                  html: `
                    <div class="relative group">
                      <div class="w-8 h-8 rounded-full border-4 border-white shadow-lg flex items-center justify-center transition-all duration-300 ${vendor.is_active ? 'bg-blue-600 scale-110' : 'bg-slate-400 grayscale opacity-75'}">
                        <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13.5 21l-7.5-7.5 7.5-7.5M21 12H3"></path>
                        </svg>
                      </div>
                      ${isOpenNow && vendor.is_active ? '<div class="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>' : ''}
                    </div>
                  `,
                  iconSize: [32, 32],
                  iconAnchor: [16, 16]
                })}
              >
                <Popup>
                  <div className="text-sm min-w-[200px]">
                    <div className="flex justify-between items-start mb-2">
                       <div className="flex flex-col">
                        <h3 className="font-bold text-base">{vendor.business_name}</h3>
                        {!vendor.is_active && (
                          <span className="text-[10px] text-red-500 font-bold uppercase mt-0.5">Closed</span>
                        )}
                       </div>
                      <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded font-medium uppercase">{vendor.category}</span>
                    </div>
                    
                    <div className="flex items-center gap-1 mb-1">
                      <span className="text-yellow-400 text-xs">★</span>
                      <span className="font-bold text-xs">4.{Math.floor(Math.random() * 9) + 1}</span>
                      <span className="text-slate-400 text-xs">({Math.floor(Math.random() * 50) + 10})</span>
                    </div>

                    <p className="text-xs text-slate-600 mb-1">{vendor.address}</p>
                    <p className="text-xs text-slate-500 mb-2">{vendor.space_name}</p>

                    {vendor.menu_items?.length > 0 && (
                      <div className="mb-2">
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Offering</p>
                         <div className="flex flex-wrap gap-1">
                           {vendor.menu_items.slice(0, 3).map((item, idx) => (
                             <span key={idx} className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded text-[10px] text-slate-600 dark:text-slate-300">
                               {item.name}
                             </span>
                           ))}
                           {vendor.menu_items.length > 3 && <span className="text-[10px] text-slate-400">+{vendor.menu_items.length - 3} more</span>}
                         </div>
                      </div>
                    )}

                    <div className="border-t pt-2 mt-2">
                       {vendor.operating_hours?.text && (
                         <p className="text-[10px] text-slate-500 mb-1 flex justify-between">
                            <span className="font-bold uppercase tracking-widest text-[9px]">Regular Hours</span>
                            <span>{vendor.operating_hours.text}</span>
                         </p>
                       )}
                       <p className="text-xs font-mono text-slate-500 flex items-center justify-between">
                         <span className="font-bold uppercase tracking-widest text-[9px]">{isOpenNow ? 'Current slot' : 'Slot'}</span>
                         <span>{new Date(vendor.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(vendor.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                       </p>
                    </div>
                  </div>
                </Popup>
              </Marker>

              {/* Optional: Show circle only on hover or selection to reduce clutter? For now keeping it simple */}
              {/* Or maybe show concise circle for all */}
              {requestRadius > 0 && (
                <Circle
                  center={[lat, lng]}
                  radius={requestRadius}
                  pathOptions={{
                    color: "#22c55e",
                    weight: 1,
                    fillOpacity: 0.1
                  }}
                />
              )}
            </div>
          );
        })}
      </MapContainerFullscreen>
    </div>
  </div>
  );
}

function isVendorOpen(start, end) {
  if (!start || !end) return false;
  const current = new Date();
  const startTime = new Date(start);
  const endTime = new Date(end);
  
  // Normalize to today's date for time comparison
  const s = new Date(); s.setHours(startTime.getHours(), startTime.getMinutes(), 0);
  const e = new Date(); e.setHours(endTime.getHours(), endTime.getMinutes(), 0);
  
  return current >= s && current <= e;
}
