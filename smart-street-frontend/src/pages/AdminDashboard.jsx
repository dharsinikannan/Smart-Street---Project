import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Circle, Popup } from "react-leaflet";
import { useTranslation } from "react-i18next";
import "leaflet/dist/leaflet.css";
import { QRCodeCanvas } from "qrcode.react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import MapContainerFullscreen from "../components/MapContainerFullscreen.jsx";
import NotificationBell from "../components/NotificationBell.jsx";
import NotificationModal from "../components/NotificationModal.jsx";
import { ConfirmModal } from "../components/Modal.jsx";
import MapSearchControl from "../components/MapSearchControl.jsx";
import AdminSidebar from "../components/AdminSidebar.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";


import AdminRequestDetail from "../components/AdminRequestDetail.jsx";
import AdminStatsCards from "../components/AdminStatsCards.jsx";
import AdminVendorList from "../components/AdminVendorList.jsx";
import AdminOwnerList from "../components/AdminOwnerList.jsx";
import AdminSpaceApproval from "../components/AdminSpaceApproval.jsx";
import { ChartBarSquareIcon, MapIcon, UserGroupIcon, DocumentCheckIcon } from "@heroicons/react/24/outline";

import ThemeToggle from "../components/ThemeToggle.jsx";
import LanguageSwitcher from "../components/LanguageSwitcher.jsx";
import UserDropdown from "../components/UserDropdown.jsx";

const defaultCenter = [11.3410, 77.7172];

const radiusFromDims = (maxWidth, maxLength) => {
  return Math.sqrt(maxWidth ** 2 + maxLength ** 2) / 2;
};

import { STATUS_COLORS } from "../utils/constants.js";

export default function AdminDashboard() {
  const { user, logout, fetchNotifications } = useAuth();
  const { success: showSuccess, error: showError } = useToast();
  const { t } = useTranslation();
  const [requests, setRequests] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [permits, setPermits] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [routingLoading, setRoutingLoading] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  const [viewMode, setViewMode] = useState("pending");
  const [activeTab, setActiveTab] = useState("overview"); // overview, spaces, map, vendors, owners
  const [stats, setStats] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [owners, setOwners] = useState([]);
  const [pendingSpaces, setPendingSpaces] = useState([]);
  const [statsLoading, setStatsLoading] = useState(false);
  const [spacesLoading, setSpacesLoading] = useState(false);

  const fetchSpaces = async () => {
    setSpacesLoading(true);
    try {
      const { data } = await api.get("/admin/spaces/pending");
      setPendingSpaces(data.spaces || []);
    } catch (err) {
      console.error("Failed to load pending spaces", err);
    } finally {
      setSpacesLoading(false);
    }
  };

  useEffect(() => {
    const fetchStats = async () => {
      setStatsLoading(true);
      try {
        const [statsRes, vendorsRes, ownersRes] = await Promise.all([
          api.get("/admin/stats"),
          api.get("/admin/vendors"),
          api.get("/admin/owners")
        ]);
        setStats(statsRes.data.stats || statsRes.data);
        setVendors(vendorsRes.data.vendors || []);
        setOwners(ownersRes.data.owners || []);
      } catch (err) {
        console.error("Failed to load stats", err);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Poll notifications every 30s
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const endpoint = viewMode === "history" ? "/admin/requests?history=true" : "/admin/requests";
      const { data } = await api.get(endpoint);
      setRequests(data.requests || []);
      if (!selectedId && data.requests?.length) setSelectedId(data.requests[0].request_id);
    } catch (err) {
      showError(err.response?.data?.message || "Unable to load requests");
    } finally {
      setLoading(false);
    }
  };

  const fetchPermits = async () => {
    try {
      const { data } = await api.get("/admin/permits");
      setPermits(data.permits || []);
    } catch (err) {
      console.error("Failed to load permits", err);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const { data } = await api.get("/admin/audit-logs");
      setLogs(data.logs || []);
    } catch (err) {
      console.error("Failed to load audit logs", err);
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchPermits();
    fetchAuditLogs();
    fetchSpaces();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode]);

  const selected = useMemo(
    () => requests.find(r => String(r.request_id) === String(selectedId)) || null,
    [requests, selectedId]
  );

  useEffect(() => {
    if (selected && selected.lat && selected.lng) {
      window.dispatchEvent(
        new CustomEvent("centerMap", {
          detail: { lat: selected.lat, lng: selected.lng, zoom: 20 }
        })
      );
    }
  }, [selected]);

  const handleApproveClick = () => {
    setShowApproveModal(true);
  };

  const handleRejectClick = () => {
    setShowRejectModal(true);
  };

  const handleApprove = async () => {
    if (!selected) return;
    setActionLoading(true);
    try {
      await api.post(`/admin/requests/${selected.request_id}/approve`, { remarks });
      showSuccess("Request approved and permit issued");
      setRemarks("");
      setShowApproveModal(false);
      await fetchRequests();
      await fetchPermits();
      await fetchAuditLogs();
    } catch (err) {
      showError(err.response?.data?.message || "Approval failed");
      if (err.response?.data?.conflicts) console.error("Conflicts:", err.response.data.conflicts);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selected) return;
    setActionLoading(true);
    try {
      await api.post(`/admin/requests/${selected.request_id}/reject`, { remarks });
      showSuccess("Request rejected");
      setRemarks("");
      setShowRejectModal(false);
      await fetchRequests();
      await fetchAuditLogs();
    } catch (err) {
      showError(err.response?.data?.message || "Rejection failed");
    } finally {
      setActionLoading(false);
    }
  };

  const requestRadius = selected ? radiusFromDims(selected.max_width, selected.max_length) : 0;
  const conflictRadii = (selected?.conflicts || []).map(c => ({
    id: c.request_id,
    lat: c.lat,
    lng: c.lng,
    radius: radiusFromDims(c.max_width || 0, c.max_length || 0)
  }));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">


      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg shadow-[0_4px_30px_rgba(0,0,0,0.05)] border-b border-white/50 dark:border-slate-800/50 transition-colors duration-300 relative z-[4000] sticky top-0">
        <div className="px-4 md:px-6 py-4 flex flex-col items-center gap-3 min-h-[80px] xl:grid xl:grid-cols-[1fr_auto_1fr] xl:items-center">

          {/* Left Tabs - Absolute on large desktop, hidden on smaller */}
          <div className="hidden xl:flex items-center gap-1 justify-self-start">
            <button
              onClick={() => setActiveTab("overview")}
              className={`flex items-center justify-center gap-2 px-4 py-2 text-base font-bold rounded-xl transition-all duration-300 whitespace-nowrap ${activeTab === "overview" ? "bg-gradient-to-r from-teal-500/10 to-cyan-500/10 text-cyan-700 dark:text-cyan-400 ring-1 ring-cyan-200 dark:ring-cyan-800/50 shadow-sm shadow-cyan-500/10" : "text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                }`}
            >
              <ChartBarSquareIcon className="w-5 h-5" />
              {t("overview")}
            </button>
            <button
              onClick={() => setActiveTab("spaces")}
              className={`flex items-center justify-center gap-2 px-4 py-2 text-base font-bold rounded-xl transition-all duration-300 whitespace-nowrap ${activeTab === "spaces" ? "bg-gradient-to-r from-teal-500/10 to-cyan-500/10 text-cyan-700 dark:text-cyan-400 ring-1 ring-cyan-200 dark:ring-cyan-800/50 shadow-sm shadow-cyan-500/10" : "text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                }`}
            >
              <DocumentCheckIcon className="w-5 h-5" />
              Space Verification
            </button>
            <button
              onClick={() => setActiveTab("map")}
              className={`flex items-center justify-center gap-2 px-4 py-2 text-base font-bold rounded-xl transition-all duration-300 whitespace-nowrap ${activeTab === "map" ? "bg-gradient-to-r from-teal-500/10 to-cyan-500/10 text-cyan-700 dark:text-cyan-400 ring-1 ring-cyan-200 dark:ring-cyan-800/50 shadow-sm shadow-cyan-500/10" : "text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                }`}
            >
              <MapIcon className="w-5 h-5" />
              {t("map_and_requests")}
            </button>
            <button
              onClick={() => setActiveTab("vendors")}
              className={`flex items-center justify-center gap-2 px-4 py-2 text-base font-bold rounded-xl transition-all duration-300 whitespace-nowrap ${activeTab === "vendors" ? "bg-gradient-to-r from-teal-500/10 to-cyan-500/10 text-cyan-700 dark:text-cyan-400 ring-1 ring-cyan-200 dark:ring-cyan-800/50 shadow-sm shadow-cyan-500/10" : "text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                }`}
            >
              <UserGroupIcon className="w-5 h-5" />
              {t("vendors")}
            </button>
            <button
              onClick={() => setActiveTab("owners")}
              className={`flex items-center justify-center gap-2 px-4 py-2 text-base font-bold rounded-xl transition-all duration-300 whitespace-nowrap ${activeTab === "owners" ? "bg-gradient-to-r from-teal-500/10 to-cyan-500/10 text-cyan-700 dark:text-cyan-400 ring-1 ring-cyan-200 dark:ring-cyan-800/50 shadow-sm shadow-cyan-500/10" : "text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                }`}
            >
              <UserGroupIcon className="w-5 h-5" />
              {t("owners")}
            </button>
          </div>

          {/* Centered Title */}
          <div className="text-center z-10 mb-4 xl:mb-0 justify-self-center">
            <Link to="/" className="block group">
              <p className="text-xs md:text-sm text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-cyan-500 font-bold tracking-[0.25em] group-hover:opacity-80 transition-opacity mb-1">{t("smart_street")}</p>
            </Link>
            <h1 className="text-xl md:text-3xl font-black text-slate-900 dark:text-white mb-1 tracking-tight">{t("admin_console")}</h1>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-light">{t("review_requests_permits")}</p>
          </div>

          {/* Right Controls - Absolute on desktop */}
          <div className="flex items-center gap-3 md:gap-5 justify-self-end">
            <div className="transform scale-110">
              <LanguageSwitcher />
            </div>
            <div className="transform scale-110">
              <ThemeToggle />
            </div>
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>


            <div className="transform scale-110">
              <NotificationBell onClick={() => setShowNotificationModal(true)} />
            </div>

            <UserDropdown />
          </div>
        </div>

        {/* Navigation Tabs - Mobile/Tablet Only (below XL) */}
        <div className="w-full xl:hidden border-t border-slate-100 dark:border-slate-800/50">
          <div className="flex gap-1 justify-start px-4 py-2 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setActiveTab("overview")}
              className={`flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all duration-300 ${activeTab === "overview" ? "bg-gradient-to-r from-teal-500/10 to-cyan-500/10 text-cyan-700 dark:text-cyan-400 ring-1 ring-cyan-200 dark:ring-cyan-800/50 shadow-sm" : "text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                }`}
            >
              <ChartBarSquareIcon className="w-5 h-5 flex-shrink-0" />
              <span className="hidden sm:inline">{t("overview")}</span>
            </button>
            <button
              onClick={() => setActiveTab("spaces")}
              className={`flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all duration-300 ${activeTab === "spaces" ? "bg-gradient-to-r from-teal-500/10 to-cyan-500/10 text-cyan-700 dark:text-cyan-400 ring-1 ring-cyan-200 dark:ring-cyan-800/50 shadow-sm" : "text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                }`}
            >
              <DocumentCheckIcon className="w-5 h-5 flex-shrink-0" />
              <span className="hidden sm:inline">Space Verification</span>
            </button>
            <button
              onClick={() => setActiveTab("map")}
              className={`flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all duration-300 ${activeTab === "map" ? "bg-gradient-to-r from-teal-500/10 to-cyan-500/10 text-cyan-700 dark:text-cyan-400 ring-1 ring-cyan-200 dark:ring-cyan-800/50 shadow-sm" : "text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                }`}
            >
              <MapIcon className="w-5 h-5 flex-shrink-0" />
              <span className="hidden sm:inline">{t("map_and_requests")}</span>
            </button>
            <button
              onClick={() => setActiveTab("vendors")}
              className={`flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all duration-300 ${activeTab === "vendors" ? "bg-gradient-to-r from-teal-500/10 to-cyan-500/10 text-cyan-700 dark:text-cyan-400 ring-1 ring-cyan-200 dark:ring-cyan-800/50 shadow-sm" : "text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                }`}
            >
              <UserGroupIcon className="w-5 h-5 flex-shrink-0" />
              <span className="hidden sm:inline">{t("vendors")}</span>
            </button>
            <button
              onClick={() => setActiveTab("owners")}
              className={`flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all duration-300 ${activeTab === "owners" ? "bg-gradient-to-r from-teal-500/10 to-cyan-500/10 text-cyan-700 dark:text-cyan-400 ring-1 ring-cyan-200 dark:ring-cyan-800/50 shadow-sm" : "text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                }`}
            >
              <UserGroupIcon className="w-5 h-5 flex-shrink-0" />
              <span className="hidden sm:inline">{t("owners")}</span>
            </button>
          </div>
        </div>

      </header>

      <main className="flex-1 relative h-[calc(100vh-140px)] overflow-hidden">

        {activeTab === "overview" && (
          <div className="h-full overflow-y-auto p-6 md:p-10 max-w-[1920px] mx-auto w-full animate-fade-in-up">

            <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-8 tracking-tight">{t("dashboard_overview")}</h2>
            <AdminStatsCards stats={stats} loading={statsLoading} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

              {/* Quick Actions or Recent Logs? For now recent logs */}
              <div className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 rounded-3xl p-8 shadow-sm hover:shadow-lg transition-all duration-300">
                <h3 className="text-sm font-black text-slate-800 dark:text-white mb-6 uppercase tracking-widest">{t("recent_audit_logs")}</h3>
                <div className="space-y-4">
                  {logs.slice(0, 8).map((log, i) => (
                    <div key={i} className="flex gap-4 text-base pb-4 border-b border-slate-100 dark:border-slate-800/50 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 -mx-4 px-4 rounded-xl transition-colors items-center pt-2">
                      <div className="text-xs text-slate-400 whitespace-nowrap font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">{new Date(log.created_at).toLocaleTimeString()}</div>
                      <div>
                        <p className="text-slate-800 dark:text-slate-200 font-bold text-sm">{log.action}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t("by_admin", { id: log.admin_id?.slice(0, 6) })}</p>
                      </div>
                    </div>
                  ))}
                  {logs.length === 0 && <p className="text-sm text-slate-400 font-light italic">{t("no_logs_found")}</p>}
                </div>
              </div>

              <div className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 rounded-3xl p-8 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-center items-center text-center">
                <div className="p-6 bg-gradient-to-tr from-teal-500/20 to-cyan-500/20 rounded-full mb-6 relative group">
                  <div className="absolute inset-0 bg-cyan-400 blur-xl opacity-20 group-hover:opacity-40 transition-opacity rounded-full"></div>
                  <MapIcon className="w-12 h-12 text-cyan-600 dark:text-cyan-400 relative z-10" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{t("review_pending_requests")}</h3>
                <p className="text-base text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-3 mb-8 font-light leading-relaxed">
                  {t("pending_requests_count", { count: stats?.pending_requests || 0 })}
                </p>
                <button
                  onClick={() => setActiveTab("map")}
                  className="px-8 py-4 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-white rounded-2xl text-lg font-bold transition-all shadow-xl shadow-cyan-600/20 hover:shadow-cyan-600/40 hover:-translate-y-1"
                >
                  {t("go_to_map")}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "spaces" && (
          <div className="h-full overflow-hidden p-4 md:p-6 max-w-[1920px] mx-auto w-full animate-fade-in-up">
            <AdminSpaceApproval spaces={pendingSpaces} fetchSpaces={fetchSpaces} loading={spacesLoading} />
          </div>
        )}

        {activeTab === "vendors" && (
          <div className="h-full overflow-hidden p-4 md:p-6 max-w-7xl mx-auto w-full">
            <AdminVendorList vendors={vendors} loading={statsLoading} />
          </div>
        )}

        {activeTab === "owners" && (
          <div className="h-full overflow-hidden p-4 md:p-6 max-w-7xl mx-auto w-full">
            <AdminOwnerList owners={owners} loading={statsLoading} />
          </div>
        )}

        {activeTab === "map" && (

          <MapContainerFullscreen
            center={selected ? [selected.lat, selected.lng] : defaultCenter}
            zoom={selected ? 16 : 13}
            height="100vh"
            showFullscreenButton={false}
            searchPlaceholder={t('search_places')}
            searchClassName="absolute top-6 z-[2000] left-1/2 -translate-x-1/2 w-[calc(100%-5rem)] md:w-[500px]"
            controlsClassName="absolute top-6 z-[1000] right-4 md:right-[calc(50%-330px)] flex flex-col gap-2"
            overlayContent={
              <>
                {/* LEFT SIDEBAR: List */}
                <AdminSidebar
                  requests={requests}
                  loading={loading}
                  selectedId={selectedId}
                  setSelectedId={setSelectedId}
                  fetchRequests={fetchRequests}
                  statusColors={STATUS_COLORS}
                  viewMode={viewMode}
                  setViewMode={setViewMode}
                />

                {/* RIGHT SIDEBAR: Detail (Conditionally rendered) */}
                {selected && (
                  <div className="absolute top-4 right-4 z-[2000]">
                    <AdminRequestDetail
                      selected={selected}
                      requestRadius={requestRadius}
                      remarks={remarks}
                      setRemarks={setRemarks}
                      handleApproveClick={handleApproveClick}
                      handleRejectClick={handleRejectClick}
                      actionLoading={actionLoading}
                    />
                  </div>
                )}

                {!selected && requests.length > 0 && (
                  <div className="absolute top-4 right-4 z-[2000]">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg p-6 max-w-4xl w-full transition-colors duration-300">
                      <div className="text-center py-8">
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 max-w-md mx-auto">
                          <p className="text-sm text-blue-800 dark:text-blue-300">
                            <strong>👆 {t("select_request_hint")}</strong><br />
                            {t("select_request_detail")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            }
          >
            {selected && (
              <>
                {/* Space circle - only if space exists */}
                {selected.space_id && selected.space_lat && selected.space_lng && (
                  <Circle
                    center={[selected.space_lat, selected.space_lng]}
                    radius={selected.allowed_radius || 50}
                    pathOptions={{ color: "#22c55e", weight: 2, fillOpacity: 0.08 }}
                  >
                    <Popup>{t("space_boundary", { radius: selected.allowed_radius })}</Popup>
                  </Circle>
                )}
                {/* Request pin + circle */}
                <Marker position={[selected.lat, selected.lng]}>
                  <Popup>
                    <div className="font-semibold text-center mt-1">
                      <span className="text-slate-500 text-xs uppercase tracking-wider block mb-1">Status</span>
                      <span className={`px-2 py-0.5 rounded-md text-sm font-bold ${selected.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                        selected.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                        {selected.status || 'PENDING'}
                      </span>
                    </div>
                  </Popup>
                </Marker>
                {requestRadius > 0 && (
                  <Circle
                    center={[selected.lat, selected.lng]}
                    radius={requestRadius}
                    pathOptions={{ color: "#2563eb", weight: 3, fillOpacity: 0.18 }}
                  >
                    <Popup>{t("request_area", { width: selected.max_width, length: selected.max_length })}</Popup>
                  </Circle>
                )}
                {/* Conflict circles */}
                {conflictRadii.map(c =>
                  c.lat && c.lng && c.radius > 0 ? (
                    <Circle
                      key={`conflict-${c.lat}-${c.lng}`}
                      center={[c.lat, c.lng]}
                      radius={c.radius}
                      pathOptions={{ color: "#ef4444", weight: 1, fillOpacity: 0.3 }}
                    >
                      <Popup>{t("conflict_region")}</Popup>
                    </Circle>
                  ) : null
                )}
              </>
            )}

          </MapContainerFullscreen>
        )}

        <NotificationModal
          isOpen={showNotificationModal}
          onClose={() => setShowNotificationModal(false)}
          onNotificationClick={async (notification) => {
            setShowNotificationModal(false);

            if (notification.type === "NEW_OWNER_SPACE") {
              setActiveTab("owners");
              return;
            }

            if (notification.related_request_id) {
              const reqId = notification.related_request_id;

              try {
                // Determine if the request is pending or in history by fetching directly
                setRoutingLoading(true);
                const pendingRes = await api.get("/admin/requests");
                const pendingRequests = pendingRes.data.requests || [];
                const isPending = pendingRequests.some(r => String(r.request_id) === String(reqId));

                if (isPending) {
                  setViewMode("pending");
                  setRequests(pendingRequests);
                  setActiveTab("map");
                  setSelectedId(reqId);
                } else {
                  const historyRes = await api.get("/admin/requests?history=true");
                  const historyRequests = historyRes.data.requests || [];
                  setViewMode("history");
                  setRequests(historyRequests);
                  setActiveTab("map");
                  setSelectedId(reqId);
                }
              } catch (err) {
                console.error("Error routing to notification request:", err);
                setActiveTab("map");
                setSelectedId(reqId);
              } finally {
                setRoutingLoading(false);
              }
            }
          }}
        />
        <ConfirmModal
          isOpen={showRejectModal}
          onClose={() => setShowRejectModal(false)}
          onConfirm={handleReject}
          title={t("reject_request")}
          message={t("reject_request_msg", { id: selected?.request_id })}
          confirmText={t("reject_request")}
          confirmVariant="danger"
          loading={actionLoading}
        />

        <ConfirmModal
          isOpen={showApproveModal}
          onClose={() => setShowApproveModal(false)}
          onConfirm={handleApprove}
          title={t("approve_request")}
          message={t("approve_request_msg", { id: selected?.request_id })}
          confirmText={t("approve_and_issue")}
          confirmVariant="primary"
          loading={actionLoading}
        />

        {actionLoading && (
          <div className="fixed inset-0 z-[10000] bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center transition-all duration-300">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-4">
              <LoadingSpinner size="lg" color="black" />
              <p className="text-lg font-bold text-slate-800 dark:text-slate-200">
                {t("loading_wait") || "Loading... Please Wait..."}
              </p>
            </div>
          </div>
        )}

        {routingLoading && (
          <div className="fixed inset-0 z-[10000] bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center transition-all duration-300">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-4">
              <LoadingSpinner size="lg" color="black" />
              <p className="text-lg font-bold text-slate-800 dark:text-slate-200">
                {t("loading_wait") || "Loading... Please Wait..."}
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

