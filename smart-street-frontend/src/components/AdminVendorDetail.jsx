import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { XMarkIcon, UserCircleIcon, DocumentCheckIcon, CurrencyRupeeIcon } from "@heroicons/react/24/outline";
import api from "../services/api";
import LoadingSpinner from "./LoadingSpinner";

export default function AdminVendorDetail({ vendorId, onClose }) {
    const { t } = useTranslation();
    const [vendorData, setVendorData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!vendorId) return;
        const fetchVendorDetails = async () => {
            setLoading(true);
            try {
                const { data } = await api.get(`/admin/vendors/${vendorId}`);
                setVendorData(data.vendor);
            } catch (err) {
                console.error("Failed to load vendor details", err);
            } finally {
                setLoading(false);
            }
        };
        fetchVendorDetails();
    }, [vendorId]);

    return (
        <div className="fixed inset-y-0 right-0 w-full md:w-[500px] bg-white dark:bg-slate-900 shadow-2xl z-[5000] border-l border-slate-200 dark:border-slate-800 transform transition-transform duration-300 flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">{t("vendor_details") || "Vendor Details"}</h2>
                <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors">
                    <XMarkIcon className="w-6 h-6 text-slate-500" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {loading ? (
                    <div className="flex flex-col items-center justify-center p-20 gap-4">
                        <LoadingSpinner size="lg" color="black" />
                        <p className="text-slate-500 font-medium">Loading vendor details...</p>
                    </div>
                ) : vendorData ? (
                    <>
                        {/* Profile Section */}
                        <div className="flex items-center gap-4 p-4 rounded-xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30">
                            <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                <UserCircleIcon className="w-10 h-10" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white truncate">{vendorData.business_name}</h3>
                                <p className="text-slate-500 dark:text-slate-400 font-medium">{vendorData.vendor_name}</p>
                                <div className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                                    <p>{vendorData.email}</p>
                                    <p>{vendorData.phone_number}</p>
                                </div>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-800 flex flex-col items-center text-center">
                                <DocumentCheckIcon className="w-8 h-8 text-emerald-500 mb-2" />
                                <span className="text-2xl font-black text-slate-800 dark:text-white">{vendorData.active_permits}</span>
                                <span className="text-sm font-bold text-slate-500 uppercase tracking-wide">{t("active_permits") || "Active Permits"}</span>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-800 flex flex-col items-center text-center">
                                <CurrencyRupeeIcon className="w-8 h-8 text-blue-500 mb-2" />
                                <span className="text-2xl font-black text-slate-800 dark:text-white">₹{Number(vendorData.total_spent || 0).toLocaleString()}</span>
                                <span className="text-sm font-bold text-slate-500 uppercase tracking-wide">{t("total_spent") || "Total Spent"}</span>
                            </div>
                        </div>

                        {/* Requests & Permits List */}
                        <div>
                            <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                {t("requests_and_permits") || "Requests & Permits"}
                                <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 py-0.5 px-2 rounded-full text-xs">{vendorData.requests?.length || 0}</span>
                            </h4>
                            <div className="space-y-3">
                                {vendorData.requests?.map(req => (
                                    <div key={req.request_id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-between items-center group hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                                        <div>
                                            <p className="font-bold text-slate-900 dark:text-white mb-1">
                                                {req.space_name || t("custom_location")}
                                            </p>
                                            <p className="text-xs text-slate-500 font-medium">
                                                {new Date(req.start_time).toLocaleDateString()}
                                            </p>
                                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">
                                                ₹{Number(req.total_price || 0).toLocaleString()}
                                            </p>
                                        </div>
                                        <div>
                                            <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wide ${req.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                                req.status === 'REJECTED' ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400' :
                                                    'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                                                }`}>
                                                {req.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                                {!vendorData.requests?.length && (
                                    <p className="text-center text-slate-500 italic py-4">{t("no_requests_found") || "No requests found."}</p>
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="text-center text-slate-500 py-10 flex flex-col items-center">
                        <UserCircleIcon className="w-16 h-16 text-slate-300 dark:text-slate-700 mb-4" />
                        <p>{t("vendor_not_found") || "Vendor not found."}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
