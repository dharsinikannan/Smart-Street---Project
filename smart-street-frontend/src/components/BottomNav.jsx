import React from "react";
import { HomeIcon, MapIcon, ClockIcon, UserIcon, BuildingStorefrontIcon } from "@heroicons/react/24/outline";
import {
  HomeIcon as HomeIconSolid,
  MapIcon as MapIconSolid,
  ClockIcon as ClockIconSolid,
  UserIcon as UserIconSolid,
  BuildingStorefrontIcon as BuildingStorefrontIconSolid,
} from "@heroicons/react/24/solid";
import { Link, useLocation } from "react-router-dom";

/**
 * BottomNav — sticky mobile bottom navigation bar.
 * Rendered only on screens < sm (640px) via parent `sm:hidden`.
 *
 * Props:
 *  - tabs: Array<{ key, label, icon, activeIcon }> — override default tabs
 *  - activeKey: string — the currently active tab key
 *  - onTabChange: (key) => void — called when a tab is tapped
 *  - profilePath: string — href for the Profile tab (default: "/profile")
 */
export default function BottomNav({ tabs, activeKey, onTabChange, profilePath = "/profile" }) {
  const location = useLocation();

  const defaultTabs = [
    {
      key: "HOME",
      label: "Home",
      icon: HomeIcon,
      activeIcon: HomeIconSolid,
    },
    {
      key: "MAP",
      label: "Map",
      icon: MapIcon,
      activeIcon: MapIconSolid,
    },
    {
      key: "REQUESTS",
      label: "Requests",
      icon: ClockIcon,
      activeIcon: ClockIconSolid,
    },
    {
      key: "STOREFRONT",
      label: "Store",
      icon: BuildingStorefrontIcon,
      activeIcon: BuildingStorefrontIconSolid,
    },
  ];

  const resolvedTabs = tabs || defaultTabs;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-[3000] sm:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Bottom navigation"
    >
      {/* Frosted glass background */}
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 shadow-[0_-4px_24px_rgba(0,0,0,0.07)]">
        <div className="flex items-stretch">
          {resolvedTabs.map((tab) => {
            const isActive = activeKey === tab.key;
            const Icon = isActive ? tab.activeIcon : tab.icon;

            if (tab.href) {
              // Link-based tab (e.g. Profile)
              return (
                <Link
                  key={tab.key}
                  to={tab.href}
                  className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-3 min-h-[56px] transition-all duration-200 active:scale-95 touch-manipulation ${
                    isActive
                      ? "text-cyan-600 dark:text-cyan-400"
                      : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                  }`}
                >
                  <Icon className="w-6 h-6" />
                  <span className="text-[10px] font-semibold tracking-wide">{tab.label}</span>
                  {isActive && (
                    <span className="absolute bottom-0 w-6 h-0.5 bg-cyan-500 rounded-full" />
                  )}
                </Link>
              );
            }

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => onTabChange && onTabChange(tab.key)}
                className={`relative flex-1 flex flex-col items-center justify-center gap-0.5 py-3 min-h-[56px] transition-all duration-200 active:scale-95 touch-manipulation ${
                  isActive
                    ? "text-cyan-600 dark:text-cyan-400"
                    : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                }`}
              >
                {/* Active indicator dot */}
                {isActive && (
                  <span className="absolute top-1.5 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-cyan-500 rounded-full" />
                )}
                <Icon className="w-6 h-6" />
                <span className="text-[10px] font-semibold tracking-wide">{tab.label}</span>
              </button>
            );
          })}

          {/* Profile tab — always links to /profile */}
          <Link
            to={profilePath}
            className={`relative flex-1 flex flex-col items-center justify-center gap-0.5 py-3 min-h-[56px] transition-all duration-200 active:scale-95 touch-manipulation ${
              location.pathname === profilePath
                ? "text-cyan-600 dark:text-cyan-400"
                : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
            }`}
          >
            {location.pathname === profilePath && (
              <span className="absolute top-1.5 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-cyan-500 rounded-full" />
            )}
            {location.pathname === profilePath
              ? <UserIconSolid className="w-6 h-6" />
              : <UserIcon className="w-6 h-6" />
            }
            <span className="text-[10px] font-semibold tracking-wide">Profile</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
