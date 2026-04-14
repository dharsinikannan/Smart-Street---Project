import React, { useState, useEffect } from "react";
import {
    TrophyIcon,
    CurrencyRupeeIcon,
    HeartIcon,
    ArrowPathIcon,
    MapPinIcon,
    ChevronRightIcon
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";
import { useTranslation } from "react-i18next";
import api from "../../services/api";
import LoadingSpinner from "../LoadingSpinner";

export default function VendorHome({ onSelectSpace, analytics, favorites, onToggleFavorite }) {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(!analytics);

    useEffect(() => {
        if (analytics) setLoading(false);
    }, [analytics]);

    const [requestLoadingId, setRequestLoadingId] = useState(null);

    const handleToggleFavorite = async (spaceId) => {
        if (onToggleFavorite) {
            onToggleFavorite(spaceId);
        }
    };

    const handleReRequest = async (req) => {
        setRequestLoadingId(req.request_id);
        try {
            await new Promise(resolve => setTimeout(resolve, 600));
            await onSelectSpace(req);
        } finally {
            setRequestLoadingId(null);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 space-y-4">
            <LoadingSpinner size="xl" className="text-blue-600" />
            <p className="text-slate-500 font-medium animate-pulse">{t("loading_dashboard")}</p>
        </div>
    );

    const stats = analytics?.summary || { total_permits: 0, pending_requests: 0, total_spent: 0 };

    return (
        <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-8 pb-32">
            {/* Welcome Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white">{t("vendor_central")}</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">{t("vendor_central_subtitle")}</p>
                </div>
            </div>

            {/* Stats Cards - 1-col on mobile, 2-col on sm, 3-col on md+ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                <StatCard
                    icon={<TrophyIcon className="w-8 h-8 text-emerald-500" />}
                    label={t("permits_issued")}
                    value={stats.total_permits}
                    color="emerald"
                />
                <StatCard
                    icon={<ArrowPathIcon className="w-8 h-8 text-blue-500" />}
                    label={t("pending_review")}
                    value={stats.pending_requests}
                    color="blue"
                />
                <StatCard
                    icon={<CurrencyRupeeIcon className="w-8 h-8 text-amber-500" />}
                    label={t("total_investment")}
                    value={`₹${Number(stats.total_spent).toLocaleString()}`}
                    color="amber"
                />
            </div>

            {/* Analytics grid */}
            <div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Re-request */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <MapPinIcon className="w-5 h-5 text-blue-500" />
                            {t("recent_locations")}
                        </h2>
                    </div>
                    <div className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 rounded-3xl shadow-sm overflow-hidden hover:shadow-xl transition-shadow duration-300">
                        {analytics?.recentRequests?.length > 0 ? (
                            <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                {analytics.recentRequests.map(req => (
                                    <div key={req.request_id} className="p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-center justify-between group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center shrink-0">
                                                <MapPinIcon className="w-6 h-6 text-blue-600" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-bold text-slate-900 dark:text-white">{req.space_name || t("custom_location")}</p>
                                                    <StatusBadge status={req.status} />
                                                </div>
                                                <p className="text-xs text-slate-500 truncate max-w-[200px] mt-0.5">{req.address}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-12 text-center text-slate-400">{t("no_recent_permits")}</div>
                        )}
                    </div>
                </section>

                {/* Favorite Places */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <HeartIconSolid className="w-5 h-5 text-rose-500" />
                            {t("favorite_places")}
                        </h2>
                    </div>
                    <div className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 rounded-3xl shadow-sm overflow-hidden hover:shadow-xl transition-shadow duration-300">
                        {favorites.length > 0 ? (
                            <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                {favorites.map(fav => (
                                    <div key={fav.space_id} className="p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-rose-50 dark:bg-rose-900/20 rounded-2xl flex items-center justify-center shrink-0">
                                                <HeartIconSolid className="w-6 h-6 text-rose-500" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 dark:text-white">{fav.space_name}</p>
                                                <p className="text-xs text-slate-500">₹{fav.price_per_radius}/m • {fav.allowed_radius}m</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0 ml-2">
                                            <button
                                                onClick={() => handleToggleFavorite(fav.space_id)}
                                                className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-xl transition-colors"
                                            >
                                                <HeartIconSolid className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => onSelectSpace(fav)}
                                                className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-blue-500/30 transition-all"
                                            >
                                                {t("book")}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-12 text-center text-slate-400 italic text-sm">{t("no_favorites_hint")}</div>
                        )}
                    </div>
                </section>

                {/* Top Locations Section */}
                {analytics?.locationStats?.length > 0 && (
                    <section className="space-y-4 lg:col-span-2">
                        <div className="flex items-center justify-between px-2">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <TrophyIcon className="w-5 h-5 text-amber-500" />
                                {t("your_top_locations")}
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {analytics.locationStats.map((loc, idx) => (
                                <div key={idx} className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 p-5 rounded-3xl flex items-center justify-between group hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center font-black text-slate-400 shrink-0">
                                            {idx + 1}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 dark:text-white leading-tight">{loc.space_name}</p>
                                            <p className="text-xs text-slate-500 mt-0.5">{loc.visit_count} {t("successful_bookings")}</p>
                                        </div>
                                    </div>
                                    <ChevronRightIcon className="w-5 h-5 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all shrink-0 ml-2" />
                                </div>
                            ))}
                        </div>
                    </section>
                )}
              </div>{/* end grid */}
            </div>

        </div>
    );
}

function StatCard({ icon, label, value, color }) {
    const colorMap = {
        emerald: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600",
        blue: "bg-blue-50 dark:bg-blue-900/20 text-blue-600",
        amber: "bg-amber-50 dark:bg-amber-900/20 text-amber-600"
    };

    return (
        <div className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 p-6 rounded-[2.5rem] shadow-sm flex items-center gap-5 group hover:-translate-y-2 hover:shadow-2xl hover:shadow-cyan-900/10 dark:hover:shadow-cyan-500/10 transition-all duration-300 relative overflow-hidden">
             {/* Subtle Gloss Overlay */}
             <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center relative z-10 ${colorMap[color]}`}>
                {icon}
            </div>
            <div className="relative z-10">
                <p className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{label}</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white mt-1 group-hover:scale-105 transition-transform origin-left">{value}</p>
            </div>
        </div>
    );
}

// Add the new status badge component
function StatusBadge({ status }) {
    if (!status) return null;
    
    // Normalize status to match standard strings
    const safeStatus = status.toLowerCase();
    
    let colorClass, text;
    if (safeStatus === "approved" || safeStatus === "active") {
        colorClass = "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50";
        text = "Active";
    } else if (safeStatus === "pending") {
        colorClass = "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50";
        text = "Pending";
    } else if (safeStatus === "expiring_soon" || safeStatus === "expiring") {
        colorClass = "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border border-orange-200 dark:border-orange-800/50";
        text = "Expiring Soon";
    } else if (safeStatus === "rejected" || safeStatus === "expired") {
        colorClass = "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50";
        text = safeStatus === "expired" ? "Expired" : "Rejected";
    } else {
        colorClass = "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700";
        text = status; // Fallback to raw status string
    }

    return (
        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${colorClass}`}>
            {text}
        </span>
    );
}
