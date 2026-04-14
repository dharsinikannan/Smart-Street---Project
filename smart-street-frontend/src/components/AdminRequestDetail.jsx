import React from "react";
import { useTranslation } from "react-i18next";
import { STATUS_COLORS } from "../utils/constants.js";

export default function AdminRequestDetail({
  selected,
  requestRadius,
  remarks,
  setRemarks,
  handleApproveClick,
  handleRejectClick,
  actionLoading,
}) {
  const { t } = useTranslation();
  return (
    <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-lg shadow-lg p-4 md:p-5 pb-20 md:pb-24 w-full md:w-96 max-w-[calc(100vw-2rem)] max-h-[calc(100vh-6rem)] md:max-h-[85vh] overflow-y-auto flex flex-col transition-colors duration-300 dark:border dark:border-slate-800">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
            {selected.status !== "PENDING" ? t("request") : t("review_request")} #{selected.request_id.slice(0, 8)}...
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            {t("submitted")} {new Date(selected.submitted_at).toLocaleString()}
          </p>
        </div>
        <span className={`text-xs font-bold px-3 py-1.5 rounded uppercase ${STATUS_COLORS[selected.status] || STATUS_COLORS.PENDING
          }`}>
          {selected.status}
        </span>
      </div>

      <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-3 mb-4 space-y-2 mt-4">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">{t("vendor_label")}</p>
            <p className="font-semibold text-base text-slate-900 dark:text-white leading-tight">{selected.business_name}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{selected.vendor_name}</p>
          </div>
          <span className="px-2 py-1 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 rounded text-xs text-slate-600 dark:text-slate-300">
            {t("verified_label")}
          </span>
        </div>
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/50 rounded-lg p-3 mb-4">
        <p className="text-sm text-amber-800 dark:text-amber-400 leading-snug">
          <strong>{t("review_hint")}:</strong> {t("review_hint_detail")}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 mb-4">
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 flex justify-between items-center">
          <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">{t("size_label")}</span>
          <div className="text-right">
            <p className="text-base font-semibold text-slate-900 dark:text-white">{selected.max_width}m × {selected.max_length}m</p>
            <p className="text-xs text-slate-400">Radius: {requestRadius.toFixed(1)}m</p>
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 flex justify-between items-center">
          <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">{t("space_label")}</span>
          <div className="text-right">
            <p className="text-base font-semibold text-slate-900 dark:text-white">{selected.allowed_radius ? `${selected.allowed_radius}m` : t("custom")}</p>
            <p className="text-xs text-slate-400 truncate max-w-[120px]">{selected.space_name || t("custom_location")}</p>
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">{t("start_time") || "Start Time"}</span>
            <span className="text-sm font-medium text-slate-900 dark:text-white">
              {selected.start_time ? new Date(selected.start_time).toLocaleString() : 'N/A'}
            </span>
          </div>
          <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 rounded p-1 -mx-1 px-1">
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">{t("end_time") || "End Time"}</span>
            <span className="text-sm font-medium text-slate-900 dark:text-white">
              {selected.end_time ? new Date(selected.end_time).toLocaleString() : 'N/A'}
            </span>
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 flex justify-between items-center">
          <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">{t("total_price") || "Total Price"}</span>
          <div className="text-right">
            <p className="text-base font-bold text-blue-600 dark:text-blue-400">
              <span className="text-xs font-normal opacity-70">₹</span> {Number(selected.total_price || 0).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <div>
          <div className="flex justify-between items-center text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            <label>{t("remarks_optional")}</label>
          </div>

          {selected.status === "PENDING" && (
            <div className="flex flex-wrap gap-2 mb-2">
              {["Space conflict", "Invalid boundaries", "Approved pending fee"].map((template, idx) => (
                <button
                  key={idx}
                  onClick={() => setRemarks(template)}
                  className="px-2.5 py-1 text-xs font-medium rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors border border-slate-200 dark:border-slate-700"
                >
                  {template}
                </button>
              ))}
            </div>
          )}

          <textarea
            value={remarks}
            onChange={e => setRemarks(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm text-slate-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            placeholder={t("remarks_placeholder")}
          />
        </div>

        {selected.status === "PENDING" && (
          <div className="flex gap-3">
            <button
              onClick={handleRejectClick}
              disabled={actionLoading}
              className="flex-1 rounded-lg bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              {t("reject_request")}
            </button>
            <button
              onClick={handleApproveClick}
              disabled={actionLoading}
              className="flex-1 rounded-lg bg-green-600 px-4 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
            >
              {t("approve_and_issue")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
