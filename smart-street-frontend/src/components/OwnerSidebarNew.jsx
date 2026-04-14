import React from "react";
import { useTranslation } from "react-i18next";
import {
    HomeIcon,
    MapIcon,
    CalendarIcon,
    InboxStackIcon,
    BuildingStorefrontIcon,
    XMarkIcon,
} from "@heroicons/react/24/outline";

export default function OwnerSidebarNew({ activeTab, setActiveTab, isDrawerOpen = false, onDrawerClose }) {
    const { t } = useTranslation();

    const navItems = [
        { id: "dashboard", label: "Dashboard", icon: HomeIcon },
        { id: "spaces", label: "My Spaces", icon: BuildingStorefrontIcon },
        { id: "requests", label: "Requests", icon: InboxStackIcon },
        { id: "calendar", label: "Calendar", icon: CalendarIcon },
        { id: "map", label: "Map View", icon: MapIcon },
    ];

    const handleTabClick = (id) => {
        setActiveTab(id);
        if (onDrawerClose) onDrawerClose(); // Close drawer on mobile after selection
    };

    const SidebarBody = (
        <div className="flex flex-col h-full">
            {/* Brand + optional close button */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Owner Portal
                </h1>
                {/* Close button — only visible inside the drawer on mobile */}
                {onDrawerClose && (
                    <button
                        onClick={onDrawerClose}
                        className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        aria-label="Close menu"
                    >
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => handleTabClick(item.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 active:scale-95 touch-manipulation
                ${isActive
                                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                                }`}
                        >
                            <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-400"}`} />
                            {item.label}
                        </button>
                    );
                })}
            </nav>
        </div>
    );

    return (
        <>
            {/* ── Desktop Permanent Sidebar (lg+) ── */}
            <div className="hidden lg:flex w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex-col h-screen sticky top-0 shrink-0">
                {SidebarBody}
            </div>

            {/* ── Mobile Drawer Backdrop ── */}
            {isDrawerOpen && (
                <div
                    className="fixed inset-0 z-[8000] bg-black/40 backdrop-blur-sm lg:hidden"
                    onClick={onDrawerClose}
                    aria-hidden="true"
                />
            )}

            {/* ── Mobile Slide-out Drawer ── */}
            <div
                className={`fixed top-0 left-0 z-[8500] h-full w-72 bg-white dark:bg-slate-900 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out lg:hidden
                    ${isDrawerOpen ? "translate-x-0" : "-translate-x-full"}`}
                role="dialog"
                aria-modal="true"
                aria-label="Navigation menu"
            >
                {SidebarBody}
            </div>
        </>
    );
}
