import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap, Circle, ZoomControl } from "react-leaflet";
import MapContainerFullscreen from "../components/MapContainerFullscreen.jsx";
import { useTranslation } from "react-i18next";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import api from "../services/api";

// Fix icons
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// --- Helper Components ---

function LocationPicker({ setPin }) {
    useMapEvents({
        click(e) {
            setPin([e.latlng.lat, e.latlng.lng]);
        },
    });
    return null;
}

function MapUpdater({ center }) {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.setView(center, map.getZoom());
        }
    }, [center, map]);
    return null;
}

export default function OwnerAddSpace() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [pin, setPin] = useState(null); // [lat, lng]
    const [mapCenter, setMapCenter] = useState([13.0827, 80.2707]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [showForm, setShowForm] = useState(true);
    const [isMapModalOpen, setIsMapModalOpen] = useState(false);

    useEffect(() => {
        if (isMapModalOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => { document.body.style.overflow = ""; };
    }, [isMapModalOpen]);

    const [form, setForm] = useState({
        spaceName: "",
        address: "",
        allowedRadius: 50,
        pricePerRadius: 0,
        aadharNumber: "",
        aadharName: "",
        chittaNumber: "",
        chittaName: "",
        image1Url: "",
        image2Url: "",
    });
    // File refs for image pickers
    const image1Ref = useRef(null);
    const image2Ref = useRef(null);
    const [image1Uploading, setImage1Uploading] = useState(false);
    const [image2Uploading, setImage2Uploading] = useState(false);

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!pin) {
            alert(t("please_pin_location"));
            return;
        }

        setLoading(true);
        try {
            await api.post("/owner/spaces", {
                spaceName: form.spaceName,
                address: form.address,
                lat: pin[0],
                lng: pin[1],
                allowedRadius: form.allowedRadius,
                pricePerRadius: form.pricePerRadius,
                aadharNumber: form.aadharNumber,
                aadharName: form.aadharName,
                chittaNumber: form.chittaNumber,
                chittaName: form.chittaName,
                image1Url: form.image1Url,
                image2Url: form.image2Url
            });
            navigate("/owner");
        } catch (err) {
            alert(err.response?.data?.message || t("failed_create_space"));
        } finally {
            setLoading(false);
        }
    };

    // Handle file to Base64
    const handleImageFile = (e, key, setUploading) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) { alert("Please select an image file."); return; }
        if (file.size > 5 * 1024 * 1024) { alert("Image must be smaller than 5MB."); return; }
        setUploading(true);
        const reader = new FileReader();
        reader.onload = ev => { setForm(prev => ({ ...prev, [key]: ev.target.result })); setUploading(false); };
        reader.onerror = () => setUploading(false);
        reader.readAsDataURL(file);
    };

    return (
        <div className="h-screen w-screen flex flex-col md:flex-row overflow-hidden bg-slate-100 dark:bg-slate-900">
            {/* LEFT SIDEBAR / MAIN COLUMN: Form */}
            <div className="w-full md:w-[450px] lg:w-[500px] h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-xl z-20 flex flex-col shrink-0">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3 bg-white dark:bg-slate-900 sticky top-0 z-10 shrink-0">
                    <button
                        onClick={() => navigate("/owner")}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                        title={t("back_to_dashboard")}
                        type="button"
                    >
                        <ArrowLeftIcon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    </button>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">{t("add_new_space")}</h1>
                </div>

                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 form-scroller">
                    <form id="add-space-form" onSubmit={handleSubmit} className="space-y-6">
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl text-sm text-blue-800 dark:text-blue-200 border border-blue-100 dark:border-blue-900/50">
                            <strong>{t("step_1")}:</strong> {t("step_1_desc")}<br />
                            <strong>{t("step_2")}:</strong> {t("step_2_desc")}<br />
                            <strong>{t("step_3")}:</strong> {t("step_3_desc")}
                        </div>

                        {/* Basic Details */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">{t("space_name")}</label>
                                <input
                                    type="text"
                                    required
                                    value={form.spaceName}
                                    onChange={(e) => setForm({ ...form, spaceName: e.target.value })}
                                    className="w-full px-4 py-3 text-base rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-400"
                                    placeholder={t("space_name_placeholder")}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">{t("address")}</label>
                                <textarea
                                    required
                                    value={form.address}
                                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                                    className="w-full px-4 py-3 text-base rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none transition-all placeholder:text-slate-400"
                                    placeholder={t("address_placeholder")}
                                />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">{t("allowed_radius")}</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            required
                                            min="1"
                                            value={form.allowedRadius}
                                            onChange={(e) => setForm({ ...form, allowedRadius: parseInt(e.target.value) })}
                                            className="w-full pl-4 pr-8 py-3 text-base rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">m</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">{t("price_unit")}</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₹</span>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            step="0.01"
                                            value={form.pricePerRadius}
                                            onChange={(e) => setForm({ ...form, pricePerRadius: parseFloat(e.target.value) })}
                                            className="w-full pl-7 pr-4 py-3 text-base rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                            </div>
                            <p className="text-xs text-slate-500 italic mt-1">{t("price_formula_hint")}</p>
                        </div>

                        {/* Verification Requirements */}
                        <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-4">
                             <div className="mb-2">
                                <h3 className="font-bold text-slate-800 dark:text-slate-200">{t("govt_doc_verification")}</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{t("govt_doc_hint")}</p>
                             </div>
                             
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">{t("aadhar_number")}</label>
                                    <input
                                        type="text" required value={form.aadharNumber}
                                        onChange={(e) => setForm({ ...form, aadharNumber: e.target.value })}
                                        className="w-full px-4 py-2.5 text-base rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-slate-400" placeholder="XXXX-XXXX-XXXX"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">{t("aadhar_name")}</label>
                                    <input
                                        type="text" required value={form.aadharName}
                                        onChange={(e) => setForm({ ...form, aadharName: e.target.value })}
                                        className="w-full px-4 py-2.5 text-base rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-slate-400" placeholder={t("legal_name_placeholder")}
                                    />
                                </div>
                             </div>

                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">{t("chitta_number")}</label>
                                    <input
                                        type="text" required value={form.chittaNumber}
                                        onChange={(e) => setForm({ ...form, chittaNumber: e.target.value })}
                                        className="w-full px-4 py-2.5 text-base rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-slate-400" placeholder={t("connection_number_placeholder")}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">{t("chitta_name")}</label>
                                    <input
                                        type="text" required value={form.chittaName}
                                        onChange={(e) => setForm({ ...form, chittaName: e.target.value })}
                                        className="w-full px-4 py-2.5 text-base rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-slate-400" placeholder={t("registered_details_placeholder")}
                                    />
                                </div>
                             </div>

                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                                 <div>
                                     <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">{t("image_1")}</label>
                                     <input
                                          type="url" required value={form.image1Url}
                                          onChange={(e) => setForm({ ...form, image1Url: e.target.value })}
                                          className="w-full px-4 py-2.5 text-base rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-slate-400" placeholder="https://..."
                                      />
                                 </div>
                                 <div>
                                     <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">{t("image_2")}</label>
                                     <input
                                          type="url" required value={form.image2Url}
                                          onChange={(e) => setForm({ ...form, image2Url: e.target.value })}
                                          className="w-full px-4 py-2.5 text-base rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-slate-400" placeholder="https://..."
                                      />
                                 </div>
                             </div>
                        </div>

                        {/* PIN LOCATION - MOBILE TRIGGER */}
                        <div className="pt-6 pb-2 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-3 md:hidden">
                            <div>
                                <h3 className="font-bold text-slate-800 dark:text-slate-200">{t("pin_location")}</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    {pin ? "Location is ready." : "Tap to open map and drop pin 📍"}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setIsMapModalOpen(true)}
                                className={`w-full h-[120px] rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-2 cursor-pointer ${
                                    pin 
                                    ? "border-green-300 dark:border-green-700 bg-green-50/50 dark:bg-green-900/10 hover:border-green-400" 
                                    : "border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/20 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/20"
                                }`}
                            >
                                <span className="text-3xl">📍</span>
                                <span className="font-semibold text-slate-700 dark:text-slate-300">
                                    {pin ? "Tap to change location" : t("tap_map_drop_pin")}
                                </span>
                            </button>

                            {pin && (
                                <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 p-4 rounded-xl text-sm flex items-center gap-3 border border-green-200 dark:border-green-800 font-medium">
                                    <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse shrink-0"></span>
                                    <span className="truncate">Lat: {pin[0].toFixed(5)}, Lng: {pin[1].toFixed(5)}</span>
                                </div>
                            )}
                        </div>

                        {/* PIN LOCATION - DESKTOP */}
                        <div className="hidden md:flex pt-6 pb-2 border-t border-slate-200 dark:border-slate-800 flex-col gap-3">
                            <h3 className="font-bold text-slate-800 dark:text-slate-200">{t("pin_location")}</h3>
                            {pin ? (
                                <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 p-4 rounded-xl text-sm flex items-center gap-3 border border-green-200 dark:border-green-800 font-medium">
                                    <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse shrink-0"></span>
                                    <span className="truncate">Lat: {pin[0].toFixed(5)}, Lng: {pin[1].toFixed(5)}</span>
                                </div>
                            ) : (
                                <div className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 p-4 rounded-xl text-sm border border-slate-200 dark:border-slate-700 text-center font-medium">
                                    Use the map on the right to drop a pin.
                                </div>
                            )}
                        </div>
                    </form>
                </div>

                {/* Fixed Bottom Action Bar */}
                <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                    <button
                        type="submit"
                        form="add-space-form"
                        disabled={loading || !pin}
                        className="w-full px-4 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.98] text-lg"
                    >
                        {loading ? t("creating_space") : t("create_space")}
                    </button>
                    <button
                        onClick={() => navigate("/owner")}
                        type="button"
                        className="w-full mt-3 px-4 py-2.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 text-sm font-bold transition-colors"
                    >
                        {t("cancel")}
                    </button>
                </div>
            </div>

            {/* RIGHT SIDE: Full Desktop Map (Hidden on mobile) */}
            <div className="hidden md:block flex-1 relative h-full">
                <MapContainerFullscreen
                    center={mapCenter}
                    zoom={15}
                    height="100%"
                    className="!rounded-none !border-0"
                    searchQuery={searchQuery}
                    onSearchSelect={(lat, lng) => {
                        selectSearchResult({ lat, lon: lng, display_name: "Selected Location" });
                        setPin([lat, lng]);
                    }}
                    showFullscreenButton={false}
                >
                    <LocationPicker setPin={setPin} />
                    <MapUpdater center={mapCenter} />
                    {pin && <Marker position={pin} />}
                    {pin && form.allowedRadius > 0 && <Circle center={pin} radius={form.allowedRadius} pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.1 }} />}
                </MapContainerFullscreen>

                {/* Floating Map Hint */}
                {!pin && (
                    <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-md px-6 py-3 rounded-xl shadow-xl z-[2000] text-sm font-bold text-blue-700 border border-blue-100 flex items-center gap-2 animate-bounce pointer-events-none">
                        📍 {t("tap_map_drop_pin")}
                    </div>
                )}
            </div>
            {/* Mobile Full-Screen Map Modal */}
            {isMapModalOpen && (
                <div className="fixed inset-0 z-[5000] bg-white dark:bg-slate-900 flex flex-col md:hidden touch-pan-x touch-pan-y">
                    <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm shrink-0">
                        <button
                            type="button"
                            onClick={() => setIsMapModalOpen(false)}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                        >
                            <ArrowLeftIcon className="w-6 h-6 text-slate-700 dark:text-slate-300" />
                        </button>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Pin Location</h2>
                        <div className="w-10"></div> {/* Spacer */}
                    </div>
                    
                    <div className="flex-1 relative">
                        <MapContainerFullscreen
                            center={mapCenter}
                            zoom={15}
                            height="100%"
                            className="!rounded-none !border-0"
                            searchQuery={searchQuery}
                            controlsClassName="absolute top-1/2 -translate-y-1/2 right-3 z-[1000] flex flex-col gap-3"
                            searchClassName="absolute top-4 w-[calc(100%-2rem)] left-1/2 -translate-x-1/2 z-[1000]"
                            onSearchSelect={(lat, lng) => {
                                selectSearchResult({ lat, lon: lng, display_name: "Selected Location" });
                                setPin([lat, lng]);
                            }}
                            showFullscreenButton={false}
                        >
                            <LocationPicker setPin={setPin} />
                            <MapUpdater center={mapCenter} />
                            {pin && <Marker position={pin} />}
                            {pin && form.allowedRadius > 0 && (
                                <Circle center={pin} radius={form.allowedRadius} pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.1 }} />
                            )}
                        </MapContainerFullscreen>

                        {!pin && (
                            <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[calc(100%-4rem)] pointer-events-none z-[1000]">
                                <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-md px-4 py-3 rounded-xl shadow-xl text-center text-sm font-bold text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 flex flex-col items-center gap-1 animate-bounce">
                                    <span className="text-2xl">📍</span>
                                    {t("tap_map_drop_pin")}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                        <button
                            type="button"
                            onClick={() => setIsMapModalOpen(false)}
                            disabled={!pin}
                            className="w-full px-4 py-3.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-md hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.98] text-lg"
                        >
                            Confirm Location
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

