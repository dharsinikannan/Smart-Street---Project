import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ChevronRightIcon,
  ChevronLeftIcon,
  PlusCircleIcon,
  ListBulletIcon,
  InboxArrowDownIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon
} from "@heroicons/react/24/outline";
import api from "../services/api";
import { STATUS_COLORS, STATUS_LABELS } from "../utils/constants";
import LoadingSpinner from "./LoadingSpinner";

export default function OwnerSidebar({
  spaces,
  loading,
  fetchSpaces,
  form,
  setForm,
  pin,
  setPin,
  handleSubmit,
  saving,
  requests = [],
  requestsLoading = false,
  onRequestAction,
  activeTab: controlledActiveTab,
  onTabChange,
  highlightRequestId,
  className = ""
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [localActiveTab, setLocalActiveTab] = useState("list"); // "list", "create", "requests"

  const activeTab = controlledActiveTab !== undefined ? controlledActiveTab : localActiveTab;
  const setActiveTab = (tab) => {
    if (onTabChange) onTabChange(tab);
    else setLocalActiveTab(tab);
  };
  const [actionLoading, setActionLoading] = useState({});
  const { t } = useTranslation();

  const pendingCount = requests.filter(r => r.status === "OWNER_PENDING").length;

  // Scroll to highlighted request
  React.useEffect(() => {
    if (highlightRequestId && activeTab === "requests") {
      const el = document.getElementById(`request-${highlightRequestId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [highlightRequestId, activeTab, requests]);

  const handleApprove = async (requestId) => {
    setActionLoading(prev => ({ ...prev, [requestId]: "approving" }));
    try {
      await api.post(`/owner/requests/${requestId}/approve`);
      if (onRequestAction) onRequestAction();
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
      if (onRequestAction) onRequestAction();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to reject request");
    } finally {
      setActionLoading(prev => ({ ...prev, [requestId]: null }));
    }
  };

  const formatTime = (time) => {
    if (!time) return "";
    return new Date(time).toLocaleString(undefined, {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
    });
  };

  return (
    <div
      className={`fixed transition-all duration-300 shadow-xl border border-slate-200 dark:border-slate-800 z-[2000]
        ${collapsed
          ? "w-12 h-12 rounded-full overflow-hidden bg-white/90 dark:bg-slate-900/90 top-32 left-4 md:top-32 md:left-4"
          : "bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-t-2xl md:rounded-xl flex flex-col"
        }
        ${!collapsed && `
          bottom-0 left-0 right-0 w-full max-h-[50vh] 
          md:top-32 md:left-4 md:bottom-auto md:right-auto md:w-[clamp(320px,30vw,400px)] md:max-h-[calc(100vh-10rem)]
        `}
        ${className}
      `}
    >
      {/* Toggle Button */}
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className={`absolute z-[31] p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full shadow hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all ${collapsed
          ? "inset-0 flex items-center justify-center w-full h-full border-none"
          : "right-4 top-[-1.5rem] md:-right-4 md:top-2 w-8 h-8 flex items-center justify-center transform hover:scale-105"
          }`}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <ChevronRightIcon className="w-5 h-5 md:rotate-0 -rotate-90" />
        ) : (
          <ChevronLeftIcon className="w-4 h-4 md:rotate-0 -rotate-90" />
        )}
      </button>

      {!collapsed && (
        <div className="flex flex-col h-full overflow-hidden">
          {/* Tab Navigation */}
          <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-1 shrink-0">
            <button
              onClick={() => setActiveTab("list")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-lg font-semibold rounded-lg transition-all ${activeTab === "list" ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200 dark:border-slate-700" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                }`}
            >
              <ListBulletIcon className="w-6 h-6" />
              <span className="hidden sm:inline">{t("my_spaces")}</span>
              <span className="sm:hidden">{t("spaces")}</span>
            </button>
            <button
              onClick={() => setActiveTab("requests")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-lg font-semibold rounded-lg transition-all relative ${activeTab === "requests" ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200 dark:border-slate-700" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                }`}
            >
              <InboxArrowDownIcon className="w-6 h-6" />
              <span className="hidden sm:inline">{t("requests") || "Requests"}</span>
              <span className="sm:hidden">{t("requests") || "Requests"}</span>
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("create")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-lg font-semibold rounded-lg transition-all ${activeTab === "create" ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200 dark:border-slate-700" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                }`}
            >
              <PlusCircleIcon className="w-6 h-6" />
              <span className="hidden sm:inline">{t("create_new")}</span>
              <span className="sm:hidden">{t("create")}</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-safe">

            {/* --- TAB: LIST --- */}
            {activeTab === "list" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1">{t("your_spaces")}</h2>
                    <p className="text-base text-slate-500 dark:text-slate-400">{t("manage_locations")}</p>
                  </div>
                  <button onClick={fetchSpaces} disabled={loading} className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium">
                    {t("refresh")}
                  </button>
                </div>

                {loading ? (
                  <div className="flex justify-center p-8">
                    <LoadingSpinner size="md" color="black" />
                  </div>
                ) : spaces.length === 0 ? (
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-lg text-center">
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">{t("no_spaces_created")}</p>
                    <button onClick={() => setActiveTab("create")} className="text-sm text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                      {t("create_first_space")}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {spaces.map(space => (
                      <div
                        key={space.space_id}
                        className="p-4 bg-white dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-500 transition-colors cursor-pointer group"
                        onClick={() => {
                          window.dispatchEvent(new CustomEvent('centerMap', {
                            detail: { lat: Number(space.lat), lng: Number(space.lng), zoom: 18 }
                          }));
                        }}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-bold text-lg text-slate-700 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{space.space_name}</span>
                          <span className="bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 text-xs px-2 py-1 rounded font-mono">
                            {space.allowed_radius}m
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 truncate font-medium">{space.address}</p>
                        <div className="flex items-center gap-2 mt-3">
                          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{t("active_space")}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {spaces.length > 0 && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 p-2.5 rounded text-xs text-blue-700 dark:text-blue-300 font-medium flex items-center gap-2">
                    <span>💡</span> {t("tip_click_space")}
                  </div>
                )}
              </div>
            )}

            {/* --- TAB: REQUESTS --- */}
            {activeTab === "requests" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1">
                      Vendor Requests
                    </h2>
                    <p className="text-base text-slate-500 dark:text-slate-400">
                      Requests for your spaces
                    </p>
                  </div>
                  <button
                    onClick={onRequestAction}
                    disabled={requestsLoading}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                  >
                    {t("refresh")}
                  </button>
                </div>

                {requestsLoading ? (
                  <div className="flex justify-center p-8">
                    <LoadingSpinner size="md" color="black" />
                  </div>
                ) : requests.length === 0 ? (
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-lg text-center">
                    <p className="text-sm text-slate-500 dark:text-slate-400">No vendor requests yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {requests.map(req => {
                      const isPending = req.status === "OWNER_PENDING";
                      const loading = actionLoading[req.request_id];
                      const statusColor = STATUS_COLORS[req.status] || "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200";
                      const statusLabel = STATUS_LABELS[req.status] || req.status;

                      return (
                        <div
                          key={req.request_id}
                          id={`request-${req.request_id}`}
                          className={`p-4 bg-white dark:bg-slate-800/30 border rounded-lg transition-all duration-500 ${highlightRequestId === req.request_id
                            ? "ring-2 ring-blue-500 shadow-lg scale-[1.02] bg-blue-50/50 dark:bg-blue-900/20"
                            : ""
                            } ${isPending
                              ? "border-orange-300 dark:border-orange-700 bg-orange-50/50 dark:bg-orange-900/10"
                              : "border-slate-200 dark:border-slate-700"
                            }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-base text-slate-800 dark:text-slate-200 truncate">
                                {req.business_name || req.vendor_name || "Vendor"}
                              </p>
                              <p className="text-sm text-slate-500 dark:text-slate-400">
                                {req.space_name || "Custom Location"}
                              </p>
                            </div>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColor}`}>
                              {statusLabel}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mb-2">
                            <span className="flex items-center gap-1">
                              <ClockIcon className="w-3.5 h-3.5" />
                              {formatTime(req.start_time)} — {formatTime(req.end_time)}
                            </span>
                          </div>

                          <div className="text-xs text-slate-400 dark:text-slate-500 mb-2">
                            Area: {req.max_width}m × {req.max_length}m
                          </div>

                          {isPending && (
                            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                              <button
                                onClick={() => handleApprove(req.request_id)}
                                disabled={!!loading}
                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                              >
                                <CheckCircleIcon className="h-4 w-4" />
                                {loading === "approving" ? "Approving..." : "Approve"}
                              </button>
                              <button
                                onClick={() => handleReject(req.request_id)}
                                disabled={!!loading}
                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                              >
                                <XCircleIcon className="h-4 w-4" />
                                {loading === "rejecting" ? "Rejecting..." : "Reject"}
                              </button>
                            </div>
                          )}

                          {req.status === "OWNER_REJECTED" && req.remarks && (
                            <p className="text-xs text-rose-500 dark:text-rose-400 mt-2 italic">
                              Reason: {req.remarks}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* --- TAB: CREATE --- */}
            {activeTab === "create" && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1">{t("create_space")}</h2>
                  <p className="text-base text-slate-500 dark:text-slate-400">{t("define_zone")}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm sm:text-base font-semibold text-slate-700 dark:text-slate-300 block mb-1">{t("space_name")}</label>
                    <input
                      type="text"
                      value={form.spaceName}
                      onChange={e => setForm({ ...form, spaceName: e.target.value })}
                      required
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-3 text-base focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white transition-shadow"
                      placeholder="e.g. Central Park Lot"
                    />
                  </div>
                  <div>
                    <label className="text-sm sm:text-base font-semibold text-slate-700 dark:text-slate-300 block mb-1">{t("address")}</label>
                    <input
                      type="text"
                      value={form.address}
                      onChange={e => setForm({ ...form, address: e.target.value })}
                      required
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-3 text-base focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white transition-shadow"
                      placeholder="Street address"
                    />
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                      {t("location_and_radius")} {pin && <span className="text-green-600 dark:text-green-400 font-normal ml-1 text-xs bg-green-100 dark:bg-green-900/30 px-1.5 py-0.5 rounded">{t("pin_set")}</span>}
                    </label>

                    {!pin && (
                      <div className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/50 p-2.5 rounded mb-3 flex items-start gap-2">
                        <span>📍</span> {t("tap_map_set_center")}
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={form.allowedRadius}
                        onChange={e => setForm({ ...form, allowedRadius: e.target.value })}
                        required
                        min="1"
                        className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white transition-shadow"
                        placeholder="Radius (m)"
                      />
                      <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t("meters")}</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full rounded-lg bg-blue-600 py-3 text-sm font-bold text-white shadow-md hover:bg-blue-700 disabled:opacity-50 transition-all active:scale-[0.98]"
                  >
                    {saving ? t("creating_space") : t("create_space")}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
