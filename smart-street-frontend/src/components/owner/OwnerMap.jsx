import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl, Circle } from "react-leaflet";
import MapContainerFullscreen from "../../components/MapContainerFullscreen.jsx";
import { MagnifyingGlassIcon, MapPinIcon } from "@heroicons/react/24/outline";
import "leaflet/dist/leaflet.css";
import L from "leaflet";


// Fix Leaflet icons
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Highlighted Icon (Orange/Red)
const SelectedIcon = L.divIcon({
    className: "custom-selected-marker",
    html: `
        <div class="relative flex items-center justify-center">
            <div class="absolute w-8 h-8 bg-orange-500 rounded-full opacity-20 animate-ping"></div>
            <svg class="w-8 h-8 text-orange-600 drop-shadow-md" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z"/>
            </svg>
        </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
});

// Helper to programmatically move map
function MapUpdater({ center }) {
    const map = useMap();
    useEffect(() => {
        if (center && typeof center[0] === 'number' && typeof center[1] === 'number' && !isNaN(center[0]) && !isNaN(center[1])) {
            // Use flyTo for a smooth, professional transition
            map.flyTo(center, 16, {
                duration: 1.5,
                easeLinearity: 0.25
            });
        }
    }, [center, map]);
    return null;
}

export default function OwnerMap({ spaces, requests, initialCenterSpace }) {
    // Filter out spaces with invalid coordinates (Backend uses lat/lng)
    const validSpaces = spaces.filter(s => (s.lat != null || s.latitude != null) && (s.lng != null || s.longitude != null));

    const [mapCenter, setMapCenter] = useState([13.0827, 80.2707]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState([]);

    // Initialize center when spaces load or initialCenterSpace is provided
    useEffect(() => {
        if (initialCenterSpace) {
            const lat = initialCenterSpace.lat || initialCenterSpace.latitude;
            const lng = initialCenterSpace.lng || initialCenterSpace.longitude;
            if (lat != null && lng != null) {
                setMapCenter([lat, lng]);
            }
        } else if (validSpaces.length > 0) {
            const lat = validSpaces[0].lat || validSpaces[0].latitude;
            const lng = validSpaces[0].lng || validSpaces[0].longitude;
            setMapCenter([lat, lng]);
        }
    }, [initialCenterSpace, spaces]);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
            const data = await response.json();
            setSearchResults(data);
        } catch (err) {
            console.error("Search failed", err);
        } finally {
            setIsSearching(false);
        }
    };

    const selectSearchResult = (result) => {
        const lat = parseFloat(result.lat);
        const lon = parseFloat(result.lon);
        setMapCenter([lat, lon]);
        setSearchResults([]);
    };

    return (
        <div className="relative flex flex-col h-[calc(100svh-10rem)] lg:h-[calc(100svh-8rem)] w-full min-h-[400px] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
            {/* Search Overlay - Handled by MapContainerFullscreen */}
            <MapContainerFullscreen
                center={mapCenter}
                zoom={13}
                height="100%"
                searchQuery={searchQuery}
                onSearchSelect={(lat, lng) => {
                    selectSearchResult({ lat, lon: lng, display_name: "Selected Location" });
                }}
                showFullscreenButton={false}
            >
                <MapUpdater center={mapCenter} />

                {/* Render Spaces */}
                {validSpaces.map(space => {
                    const lat = space.lat || space.latitude;
                    const lng = space.lng || space.longitude;
                    const isSelected = initialCenterSpace && space.space_id === initialCenterSpace.space_id;

                    return (
                        <React.Fragment key={`space-${space.space_id}`}>
                        <Marker
                            position={[lat, lng]}
                            icon={isSelected ? SelectedIcon : DefaultIcon}
                            eventHandlers={{
                                add: (e) => {
                                    // Open popup with autoPan disabled initially to avoid conflicting with flyTo
                                    if (isSelected) {
                                        setTimeout(() => {
                                            e.target.openPopup();
                                        }, 1000); // Wait for flyTo to start/finish
                                    }
                                }
                            }}
                        >
                            <Popup autoPan={true} autoPanPadding={[50, 50]} className="custom-owner-popup">
                                <div className="p-1 min-w-[220px]">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-slate-900 dark:text-white text-base leading-tight">
                                            {space.space_name}
                                        </h3>
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1">
                                        <MapPinIcon className="w-3 h-3" />
                                        {space.address}
                                    </p>
                                    <div className="bg-blue-50 dark:bg-blue-900/30 p-2 rounded-lg border border-blue-100 dark:border-blue-800/50 flex items-center justify-between">
                                        <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 tracking-wider">Storage Radius</span>
                                        <span className="text-sm font-black text-blue-700 dark:text-blue-300">{space.allowed_radius}m</span>
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                        {isSelected && (
                            <Circle 
                                center={[lat, lng]} 
                                radius={space.allowed_radius} 
                                pathOptions={{ color: '#f97316', fillColor: '#f97316', fillOpacity: 0.2 }} 
                            />
                        )}
                        {!isSelected && (
                             <Circle 
                                center={[lat, lng]} 
                                radius={space.allowed_radius} 
                                pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.1 }} 
                            />
                        )}
                        </React.Fragment>
                    );
                })}

                {/* Legend / Overlay Controls */}
                <div className="absolute bottom-6 left-4 bg-white dark:bg-slate-900 p-3 rounded-lg shadow-lg z-[1000] border border-slate-200 dark:border-slate-800">
                    <h4 className="text-xs font-bold uppercase text-slate-500 mb-2">Map Layers</h4>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-sm font-medium">My Spaces ({validSpaces.length})</span>
                    </div>
                    {initialCenterSpace && (
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
                            <span className="text-sm font-medium text-orange-600 font-bold">Currently Viewing</span>
                        </div>
                    )}
                </div>
            </MapContainerFullscreen>
        </div>
    );
}

