import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import OwnerSidebarNew from "../components/OwnerSidebarNew.jsx";
import OwnerAnalytics from "../components/owner/OwnerAnalytics.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import api from "../services/api";

import ThemeToggle from "../components/ThemeToggle.jsx";
import LanguageSwitcher from "../components/LanguageSwitcher.jsx";
import UserDropdown from "../components/UserDropdown.jsx";
import { Bars3Icon } from "@heroicons/react/24/outline";

// Placeholder for other tabs
import OwnerSpacesList from "../components/owner/OwnerSpacesList.jsx";
import OwnerRequestsList from "../components/owner/OwnerRequestsList.jsx";
import OwnerCalendar from "../components/owner/OwnerCalendar.jsx";
import OwnerMap from "../components/owner/OwnerMap.jsx";
import NotificationModal from "../components/NotificationModal.jsx";

export default function OwnerDashboardNew() {
    const { user, logout, fetchNotifications } = useAuth();
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState("dashboard");
    const { success, error: showError } = useToast();
    const [showNotificationModal, setShowNotificationModal] = useState(false);
    const [highlightRequestId, setHighlightRequestId] = useState(null);
    const [selectedSpace, setSelectedSpace] = useState(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const [spaces, setSpaces] = useState([]);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [spacesRes, requestsRes] = await Promise.all([
                api.get("/owner/spaces"),
                api.get("/owner/requests")
            ]);
            setSpaces(spacesRes.data.spaces || []);
            setRequests(requestsRes.data.requests || []);
        } catch (err) {
            console.error("Failed to load dashboard data", err);
            showError("Failed to load dashboard data");
        } finally {
            setLoading(false);
        }
    };

    // Initial load & Poll notifications
    useEffect(() => {
        fetchData();
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    // Lock body scroll when drawer is open on mobile
    useEffect(() => {
        if (isDrawerOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => { document.body.style.overflow = ""; };
    }, [isDrawerOpen]);

    return (
        <div className="flex flex-col lg:flex-row min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">

            {/* Sidebar — desktop permanent + mobile drawer */}
            <OwnerSidebarNew
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                isDrawerOpen={isDrawerOpen}
                onDrawerClose={() => setIsDrawerOpen(false)}
            />

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-h-screen lg:min-h-0 overflow-hidden">

                {/* Top Header */}
                <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg shadow-[0_4px_30px_rgba(0,0,0,0.05)] border-b border-white/50 dark:border-slate-800/50 h-16 flex items-center justify-between px-4 sm:px-6 shrink-0 sticky top-0 z-[5000] transition-colors duration-300">
                    <div className="flex items-center gap-3">
                        {/* Hamburger — mobile only */}
                        <button
                            onClick={() => setIsDrawerOpen(true)}
                            className="lg:hidden p-2 -ml-1 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors active:scale-95 touch-manipulation"
                            aria-label="Open navigation menu"
                        >
                            <Bars3Icon className="w-6 h-6" />
                        </button>
                        <h2 className="text-base sm:text-xl font-semibold text-slate-800 dark:text-slate-200 capitalize">
                            {activeTab.replace("-", " ")}
                        </h2>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-4">
                        <ThemeToggle />
                        <LanguageSwitcher />

                        {/* Notification Bell */}
                        <button
                            onClick={() => setShowNotificationModal(true)}
                            className="relative p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                            </svg>
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
                        </button>

                        <div className="hidden sm:block h-8 w-px bg-slate-200 dark:bg-slate-800 mx-1"></div>
                        <UserDropdown user={user} logout={logout} />
                    </div>
                </header>

                {/* Tab Content Area */}
                <main className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-950 px-4 sm:px-6 py-6 pb-20 lg:pb-6 w-full">
                    {activeTab === "dashboard" && (
                        <OwnerAnalytics
                            spaces={spaces}
                            requests={requests}
                            loading={loading}
                            onNavigate={(tab, requestId) => {
                                setActiveTab(tab);
                                if (requestId) {
                                    setHighlightRequestId(requestId);
                                    setTimeout(() => setHighlightRequestId(null), 3000);
                                }
                            }}
                        />
                    )}
                    {activeTab === "spaces" && (
                        <OwnerSpacesList
                            spaces={spaces}
                            loading={loading}
                            onRefresh={fetchData}
                            onViewOnMap={(space) => {
                                setSelectedSpace(space);
                                setActiveTab("map");
                            }}
                        />
                    )}
                    {activeTab === "requests" && (
                        <OwnerRequestsList
                            requests={requests}
                            fetchRequests={fetchData}
                            loading={loading}
                            highlightRequestId={highlightRequestId}
                        />
                    )}
                    {activeTab === "calendar" && (
                        <OwnerCalendar
                            requests={requests}
                            onEventClick={(reqId) => {
                                setActiveTab("requests");
                                setHighlightRequestId(reqId);
                                setTimeout(() => setHighlightRequestId(null), 3000);
                            }}
                        />
                    )}
                    {activeTab === "map" && <OwnerMap spaces={spaces} requests={requests} initialCenterSpace={selectedSpace} />}
                </main>
            </div>

            <NotificationModal
                isOpen={showNotificationModal}
                onClose={() => setShowNotificationModal(false)}
                onNotificationClick={(notification) => {
                    if (notification.related_request_id) {
                        setActiveTab("requests");
                        setHighlightRequestId(notification.related_request_id);
                        setShowNotificationModal(false);
                        setTimeout(() => setHighlightRequestId(null), 3000);
                    } else {
                        setShowNotificationModal(false);
                    }
                }}
            />
        </div>
    );
}
