import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Circle, useMapEvents, Popup } from "react-leaflet";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import api from "../services/api";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import MapContainerFullscreen from "../components/MapContainerFullscreen.jsx";
import NotificationBell from "../components/NotificationBell.jsx";
import NotificationModal from "../components/NotificationModal.jsx";
import MapSearchControl from "../components/MapSearchControl.jsx";

import ThemeToggle from "../components/ThemeToggle.jsx";
import LanguageSwitcher from "../components/LanguageSwitcher.jsx";
import OwnerSidebar from "../components/OwnerSidebar.jsx";
import UserDropdown from "../components/UserDropdown.jsx";

const defaultCenter = [11.3410, 77.7172];

const MapClickCatcher = ({ onClick }) => {
  useMapEvents({
    click: e => onClick([e.latlng.lat, e.latlng.lng]),
  });
  return null;
};

export default function OwnerDashboard() {
  const { user, logout, fetchNotifications } = useAuth();
  const { success: showSuccess, error: showError } = useToast();
  const { t } = useTranslation();
  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [requests, setRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [form, setForm] = useState({
    spaceName: "",
    address: "",
    allowedRadius: 50, // default meters
  });
  const [pin, setPin] = useState(null); // [lat, lng]
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [sidebarTab, setSidebarTab] = useState("list");
  const [highlightRequestId, setHighlightRequestId] = useState(null);

  const fetchSpaces = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/owner/spaces");
      setSpaces(data.spaces || []);
    } catch (err) {
      showError(err.response?.data?.message || "Failed to load spaces");
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    setRequestsLoading(true);
    try {
      const { data } = await api.get("/owner/requests");
      setRequests(data.requests || []);
    } catch (err) {
      console.error("Failed to load owner requests:", err);
    } finally {
      setRequestsLoading(false);
    }
  };

  useEffect(() => {
    fetchSpaces();
    fetchRequests();
    fetchNotifications();

    // Poll notifications
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pin) {
      showError("Please click on the map to set a location pin.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        spaceName: form.spaceName,
        address: form.address,
        lat: pin[0],
        lng: pin[1],
        allowedRadius: Number(form.allowedRadius),
      };
      await api.post("/owner/spaces", payload);
      showSuccess("Space created successfully!");
      setForm({ spaceName: "", address: "", allowedRadius: 50 });
      setPin(null);
      fetchSpaces();
    } catch (err) {
      showError(err.response?.data?.message || "Failed to create space");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden overflow-x-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-300">


      <header className="bg-white dark:bg-slate-900 shadow-sm border-b border-slate-200 dark:border-slate-800 transition-colors duration-300 relative z-[4000]">
        <div className="px-4 md:px-6 py-4 flex flex-col md:flex-row items-center justify-center min-h-[80px]">
          {/* Centered Title */}
          <div className="text-center z-10">
            <Link to="/" className="block">
              <p className="text-xs md:text-sm text-blue-700 dark:text-blue-400 font-bold tracking-[0.25em] hover:opacity-80 transition-opacity mb-1">{t("smart_street")}</p>
            </Link>
            <h1 className="text-xl md:text-3xl font-bold text-slate-900 dark:text-white mb-1">{t("owner_workspace")}</h1>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-medium">{t("create_spaces_hint")}</p>
          </div>

          {/* Right Controls - Absolute */}
          <div className="flex items-center gap-3 md:gap-5 absolute right-4 md:right-8 top-4 md:top-1/2 md:-translate-y-1/2">
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
      </header>

      <main className="flex-1 relative">
        {/* MAP-FIRST LAYOUT */}
        <MapContainerFullscreen
          center={defaultCenter}
          zoom={13}
          height="100%"
          showFullscreenButton={false}
          onSearchSelect={(lat, lng) => setPin([lat, lng])}
          overlayContent={
            <OwnerSidebar
              spaces={spaces}
              loading={loading}
              fetchSpaces={fetchSpaces}
              form={form}
              setForm={setForm}
              pin={pin}
              setPin={setPin}
              handleSubmit={handleSubmit}
              saving={saving}
              requests={requests}
              requestsLoading={requestsLoading}
              onRequestAction={fetchRequests}
              activeTab={sidebarTab}
              onTabChange={setSidebarTab}
              highlightRequestId={highlightRequestId}
            />
          }
        >
          <MapClickCatcher onClick={coord => setPin(coord)} />
          {pin && (
            <>
              <Marker position={pin}>
                <Popup>{t("space_center")}</Popup>
              </Marker>
              {form.allowedRadius && Number(form.allowedRadius) > 0 && (
                <Circle
                  center={pin}
                  radius={Number(form.allowedRadius)}
                  pathOptions={{ color: "#2563eb", fillOpacity: 0.2, weight: 2 }}
                >
                  <Popup>{t("space_radius", { radius: form.allowedRadius })}</Popup>
                </Circle>
              )}
            </>
          )}
          {spaces.map(space => (
            <Circle
              key={space.space_id}
              center={[space.lat, space.lng]}
              radius={space.allowed_radius}
              pathOptions={{ color: "#22c55e", weight: 2, fillOpacity: 0.1 }}
            >
              <Popup>{space.space_name}</Popup>
            </Circle>
          ))}
        </MapContainerFullscreen>
      </main>
      <NotificationModal
        isOpen={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
        onNotificationClick={(notification) => {
          if (notification.related_request_id) {
            setSidebarTab("requests");
            setHighlightRequestId(notification.related_request_id);
            setShowNotificationModal(false);
            // Clear highlight after 3 seconds
            setTimeout(() => setHighlightRequestId(null), 3000);
          } else {
            setShowNotificationModal(false);
          }
        }}
      />
    </div>
  );
}
