import React, { useState, useEffect } from "react";
import { CheckCircleIcon, XCircleIcon, ClockIcon } from "@heroicons/react/24/outline";
import { STATUS_COLORS, STATUS_LABELS } from "../../utils/constants";
import api from "../../services/api";
import LoadingSpinner from "../LoadingSpinner";

export default function OwnerRequestsList({ requests, fetchRequests, loading, highlightRequestId }) {
    const [actionLoading, setActionLoading] = useState({});

    // Scroll to highlighted request
    useEffect(() => {
        if (highlightRequestId) {
            const el = document.getElementById(`request-${highlightRequestId}`);
            if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "center" });
            }
        }
    }, [highlightRequestId, requests]);

    const handleApprove = async (requestId) => {
        setActionLoading(prev => ({ ...prev, [requestId]: "approving" }));
        try {
            await api.post(`/owner/requests/${requestId}/approve`);
            if (fetchRequests) fetchRequests();
        } catch (err) {
            alert(err.response?.data?.message || "Failed to approve request");
        } finally {
            setActionLoading(prev => ({ ...prev, [requestId]: null }));
        }
    };

    const handleReject = async (requestId) => {
        const remarks = prompt("Enter rejection reason (optional):");
        setActionLoading(prev => ({ ...prev, [requestId]: "rejecting" }));
        try {
            await api.post(`/owner/requests/${requestId}/reject`, { remarks });
            if (fetchRequests) fetchRequests();
        } catch (err) {
            alert(err.response?.data?.message || "Failed to reject request");
        } finally {
            setActionLoading(prev => ({ ...prev, [requestId]: null }));
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 gap-4">
                <LoadingSpinner size="lg" color="black" />
                <p className="text-slate-500 font-medium">Loading requests...</p>
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Vendor Requests</h2>
                    <p className="text-slate-500 dark:text-slate-400">Review and manage bookings</p>
                </div>
            </div>

            {requests.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                    <p className="text-slate-500 mb-4">No requests found.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {requests.map(req => {
                        const isPending = req.status === "OWNER_PENDING";
                        const loading = actionLoading[req.request_id];
                        const statusColor = STATUS_COLORS[req.status] || "bg-slate-100 text-slate-800";
                        const statusLabel = STATUS_LABELS[req.status] || req.status;
                        const isHighlighted = highlightRequestId === req.request_id;

                        return (
                            <div
                                key={req.request_id}
                                id={`request-${req.request_id}`}
                                className={`bg-white dark:bg-slate-900 p-6 rounded-xl border transition-all duration-500 ${isHighlighted ? "ring-2 ring-blue-500 shadow-lg scale-[1.01] bg-blue-50 dark:bg-blue-900/10" : ""
                                    } ${isPending ? 'border-orange-200 dark:border-orange-900 bg-orange-50/30' : 'border-slate-200 dark:border-slate-800'}`}
                            >
                                <div className="flex flex-col md:flex-row justify-between gap-4">
                                    {/* Info */}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">{req.vendor_name || "Vendor"}</h3>
                                            <span className={`px-2 py-1 text-xs font-bold rounded-full ${statusColor}`}>{statusLabel}</span>
                                        </div>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">
                                            Requesting space: <span className="font-semibold text-slate-700 dark:text-slate-300">{req.space_name}</span>
                                        </p>
                                        <div className="flex items-center gap-4 text-xs text-slate-500 mt-2">
                                            <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                                                <ClockIcon className="w-3.5 h-3.5" />
                                                {new Date(req.start_time).toLocaleString()} — {new Date(req.end_time).toLocaleTimeString()}
                                            </span>
                                            <span>Area: {req.max_width}m x {req.max_length}m</span>
                                        </div>
                                        {req.remarks && <p className="text-xs text-red-500 mt-2">Rejection Reason: {req.remarks}</p>}
                                    </div>

                                    {/* Actions */}
                                    {isPending && (
                                        <div className="flex items-center gap-3 self-start md:self-center">
                                            <button
                                                onClick={() => handleApprove(req.request_id)}
                                                disabled={!!loading}
                                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                                            >
                                                <CheckCircleIcon className="w-4 h-4" />
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => handleReject(req.request_id)}
                                                disabled={!!loading}
                                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                                            >
                                                <XCircleIcon className="w-4 h-4" />
                                                Reject
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
