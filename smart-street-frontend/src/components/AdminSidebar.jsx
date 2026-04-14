import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronRightIcon, ChevronLeftIcon, InboxIcon, ArchiveBoxIcon } from "@heroicons/react/24/outline";
import LoadingSpinner from "./LoadingSpinner";

export default function AdminSidebar({
  requests,
  loading,
  selectedId,
  setSelectedId,
  fetchRequests,
  statusColors,
  viewMode,
  setViewMode,
  className = ""
}) {
  const [collapsed, setCollapsed] = useState(false);
  const { t } = useTranslation();

  return (
    <div
      className={`fixed transition-all duration-300 shadow-xl border border-slate-200 dark:border-slate-800 z-[2000]
        ${collapsed
          ? "w-12 h-12 rounded-full overflow-hidden bg-white/90 dark:bg-slate-900/90 top-32 left-4 md:top-32 md:left-4"
          : "bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-t-2xl md:rounded-xl flex flex-col"
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
              onClick={() => setViewMode("pending")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-lg font-semibold rounded-lg transition-all ${viewMode === "pending" ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200 dark:border-slate-700" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                }`}
            >
              <InboxIcon className="w-6 h-6" />
              <span className="hidden sm:inline">{t("pending")}</span>
              <span className="sm:hidden">{t("tasks")}</span>
            </button>
            <button
              onClick={() => setViewMode("history")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-lg font-semibold rounded-lg transition-all ${viewMode === "history" ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200 dark:border-slate-700" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                }`}
            >
              <ArchiveBoxIcon className="w-6 h-6" />
              <span className="hidden sm:inline">{t("history")}</span>
              <span className="sm:hidden">{t("archive")}</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-safe">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-base font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1">
                  {viewMode === "pending" ? t("tasks") : t("archive")}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  {viewMode === "pending" ? t("incoming_requests") : t("past_decisions")}
                </p>
              </div>
              <button
                onClick={fetchRequests}
                disabled={loading}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 disabled:opacity-50 font-semibold"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <LoadingSpinner size="sm" color="black" />
                  </div>
                ) : t("refresh")}
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center p-8">
                <LoadingSpinner size="md" color="black" />
              </div>
            ) : requests.length === 0 ? (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-lg text-center">
                <p className="text-xs text-slate-500 dark:text-slate-400">{t("no_requests_found", { mode: viewMode })}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {requests.map(request => (
                  <div
                    key={request.request_id}
                    onClick={() => setSelectedId(request.request_id)}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${String(request.request_id) === String(selectedId)
                      ? "border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-200 dark:ring-blue-900 shadow-sm"
                      : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/30 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm"
                      }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                        #{request.request_id.slice(0, 8)}
                      </p>
                      <span className={`px-2 py-1 rounded text-xs font-bold ${statusColors[request.status] || "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"}`}>
                        {request.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-800 dark:text-slate-200 font-medium truncate">
                      {request.space_name || t("custom_location")}
                    </p>
                    <div className="flex justify-between items-center mt-2 text-xs text-slate-500 dark:text-slate-400">
                      <span>{t("by")} <span className="font-semibold">{request.vendor_name}</span></span>
                      <span>{new Date(request.submitted_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )
      }
    </div >
  );
}
