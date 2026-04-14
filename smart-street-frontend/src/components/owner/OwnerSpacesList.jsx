import React, { useState } from "react";
import { PlusIcon, MapPinIcon } from "@heroicons/react/24/outline";
import LoadingSpinner from "../LoadingSpinner";

import { useNavigate } from "react-router-dom";

export default function OwnerSpacesList({ spaces, loading, onRefresh, onViewOnMap }) {
    const navigate = useNavigate();

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 gap-4">
                <LoadingSpinner size="lg" color="black" />
                <p className="text-slate-500 font-medium">Loading spaces...</p>
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">My Spaces</h2>
                    <p className="text-slate-500 dark:text-slate-400">Manage your valuable properties</p>
                </div>
                <button
                    onClick={() => navigate("/owner/add-space")}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm"
                >
                    <PlusIcon className="w-5 h-5" />
                    Add New Space
                </button>
            </div>

            {spaces.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                    <p className="text-slate-500 mb-4">You haven't added any spaces yet.</p>
                    <button onClick={() => navigate("/owner/add-space")} className="text-blue-600 font-medium hover:underline">Create your first space</button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {spaces.map(space => (
                        <div
                            key={space.space_id}
                            onClick={() => onViewOnMap && onViewOnMap(space)}
                            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-700 transition-all cursor-pointer group"
                        >
                            {/* Image Placeholder */}
                            <div className="h-48 bg-slate-200 dark:bg-slate-800 relative">
                                <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                                    <MapPinIcon className="w-12 h-12 opacity-50 group-hover:scale-110 group-hover:text-blue-500 transition-transform" />
                                </div>
                                {/* Status Badge */}
                                <div className="absolute top-4 right-4 px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full border border-green-200 shadow-sm">
                                    ACTIVE
                                </div>
                            </div>

                            <div className="p-5">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-1 group-hover:text-blue-600 transition-colors">
                                    {space.space_name}
                                </h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 flex items-start gap-1 mb-4">
                                    <MapPinIcon className="w-4 h-4 mt-0.5 shrink-0" />
                                    {space.address}
                                </p>

                                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <div className="text-center">
                                        <p className="text-xs text-slate-400 uppercase tracking-wide">Radius</p>
                                        <p className="font-semibold text-slate-700 dark:text-slate-300">{space.allowed_radius}m</p>
                                    </div>
                                    <span className="text-blue-600 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                        View on Map &rarr;
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}


        </div>
    );
}
