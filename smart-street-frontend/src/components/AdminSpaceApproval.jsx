import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import api from "../services/api";
import { useToast } from "../context/ToastContext";
import LoadingSpinner from "./LoadingSpinner";
import { CheckCircleIcon, XCircleIcon, DocumentCheckIcon } from "@heroicons/react/24/outline";

export default function AdminSpaceApproval({ spaces, fetchSpaces, loading }) {
  const { t } = useTranslation();
  const { success, error } = useToast();
  const [selectedSpace, setSelectedSpace] = useState(null);
  const [terms, setTerms] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const handleApprove = async () => {
    if (!selectedSpace) return;
    setActionLoading(true);
    try {
      await api.post(`/admin/spaces/${selectedSpace.space_id}/approve`, { termsConditions: terms });
      success(t("space_approved_success"));
      setSelectedSpace(null);
      setTerms("");
      fetchSpaces();
    } catch (err) {
      error(err.response?.data?.message || t("failed_approve_space"));
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedSpace) return;
    setActionLoading(true);
    try {
      await api.post(`/admin/spaces/${selectedSpace.space_id}/reject`);
      success(t("space_rejected_success"));
      setSelectedSpace(null);
      setTerms("");
      fetchSpaces();
    } catch (err) {
      error(err.response?.data?.message || t("failed_reject_space"));
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <LoadingSpinner size="lg" color="black" />
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      {/* List Panel */}
      <div className="w-full lg:w-1/3 bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 rounded-3xl p-6 shadow-sm flex flex-col h-full overflow-hidden transition-colors duration-300">
        <h2 className="text-xl font-black text-slate-800 dark:text-white mb-4 flex items-center gap-2 tracking-tight">
          <DocumentCheckIcon className="w-6 h-6 text-blue-500" />
          {t("pending_verifications")}
        </h2>
        
        <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
          {spaces.length === 0 ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400 font-medium">
              {t("no_pending_spaces")}
            </div>
          ) : (
            spaces.map(space => (
              <div
                key={space.space_id}
                onClick={() => { setSelectedSpace(space); setTerms(space.terms_conditions || ""); }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  selectedSpace?.space_id === space.space_id
                    ? "border-blue-400 bg-blue-50 dark:border-blue-500 dark:bg-blue-900/20 shadow-md transform scale-[1.02]"
                    : "border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-sm"
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-slate-800 dark:text-slate-200 truncate">{space.space_name}</h3>
                  <span className="text-xs font-bold px-2 py-1 rounded bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">{t("pending").toUpperCase()}</span>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 truncate mb-2">{space.address}</p>
                <div className="text-xs text-slate-400 dark:text-slate-500 flex justify-between">
                  <span>{t("owner_label")}: {space.owner_name}</span>
                  <span>{new Date(space.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Detail Panel */}
      <div className="w-full lg:w-2/3 bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 rounded-3xl p-6 shadow-sm overflow-y-auto custom-scrollbar transition-colors duration-300">
        {!selectedSpace ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
            <DocumentCheckIcon className="w-16 h-16 mb-4 opacity-50" />
            <p className="font-medium text-lg tracking-tight">{t("select_space_to_review")}</p>
          </div>
        ) : (
          <div className="space-y-8 animate-fade-in-up">
            <div className="border-b border-slate-200 dark:border-slate-700 pb-4">
              <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">{selectedSpace.space_name}</h2>
              <p className="text-slate-500 dark:text-slate-400">{selectedSpace.address}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Owner Info */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-700">
                <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">{t("owner_info")}</h3>
                <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                  <p><span className="font-semibold text-slate-500 dark:text-slate-400 w-24 inline-block">{t("name_label")}:</span> {selectedSpace.owner_name}</p>
                  <p><span className="font-semibold text-slate-500 dark:text-slate-400 w-24 inline-block">{t("email_address")}:</span> {selectedSpace.email}</p>
                  <p><span className="font-semibold text-slate-500 dark:text-slate-400 w-24 inline-block">{t("contact")}:</span> {selectedSpace.contact_info}</p>
                </div>
              </div>

              {/* Space Parameters */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-700">
                <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">{t("space_details")}</h3>
                <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                  <p><span className="font-semibold text-slate-500 dark:text-slate-400 w-24 inline-block">{t("radius_label", { radius: "" }).replace(":", "")}:</span> {selectedSpace.allowed_radius}m</p>
                  <p><span className="font-semibold text-slate-500 dark:text-slate-400 w-24 inline-block">{t("price_per_meter_label")}:</span> ₹{selectedSpace.price_per_radius}</p>
                  <p><span className="font-semibold text-slate-500 dark:text-slate-400 w-24 inline-block">{t("coordinates_label")}:</span> {Number(selectedSpace.lat).toFixed(4)}, {Number(selectedSpace.lng).toFixed(4)}</p>
                </div>
              </div>
            </div>

            {/* Verification Documents */}
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4 tracking-tight">{t("space_documents")}</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Aadhar */}
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border shadow-sm border-slate-200 dark:border-slate-700">
                  <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-3 border-b border-slate-100 dark:border-slate-700 pb-2">{t("aadhar_details")}</h4>
                  <div className="space-y-2 text-sm">
                    <p className="flex justify-between"><span className="text-slate-500">{t("number_label")}:</span> <span className="font-mono bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded">{selectedSpace.aadhar_number || "N/A"}</span></p>
                    <p className="flex justify-between"><span className="text-slate-500">{t("name_label")}:</span> <span className="font-semibold">{selectedSpace.aadhar_name || "N/A"}</span></p>
                  </div>
                </div>

                {/* Chitta */}
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border shadow-sm border-slate-200 dark:border-slate-700">
                  <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-3 border-b border-slate-100 dark:border-slate-700 pb-2">{t("electricity_chitta")}</h4>
                  <div className="space-y-2 text-sm">
                    <p className="flex justify-between"><span className="text-slate-500">{t("number_label")}:</span> <span className="font-mono bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded">{selectedSpace.chitta_number || "N/A"}</span></p>
                    <p className="flex justify-between"><span className="text-slate-500">{t("name_label")}:</span> <span className="font-semibold">{selectedSpace.chitta_name || "N/A"}</span></p>
                  </div>
                </div>
              </div>

              {/* Name Match Warning */}
              {selectedSpace.aadhar_name && selectedSpace.chitta_name && 
               selectedSpace.aadhar_name.trim().toLowerCase() !== selectedSpace.chitta_name.trim().toLowerCase() && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3 text-red-700 dark:text-red-400">
                  <XCircleIcon className="w-6 h-6 shrink-0" />
                  <p className="text-sm font-medium"><strong>{t("warning")}:</strong> {t("mismatch_warning")}</p>
                </div>
              )}

            {/* Images */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t("site_images")} 1</span>
                  {selectedSpace.image_1_url ? (
                    <a href={selectedSpace.image_1_url} target="_blank" rel="noreferrer" className="block relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 aspect-video bg-slate-100 dark:bg-slate-800">
                      <img src={selectedSpace.image_1_url} alt="Site 1" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-medium text-sm">{t("view_full_image")}</div>
                    </a>
                  ) : (
                    <div className="aspect-video bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 text-sm">{t("no_image")}</div>
                  )}
                </div>
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t("site_images")} 2</span>
                  {selectedSpace.image_2_url ? (
                    <a href={selectedSpace.image_2_url} target="_blank" rel="noreferrer" className="block relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 aspect-video bg-slate-100 dark:bg-slate-800">
                      <img src={selectedSpace.image_2_url} alt="Site 2" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-medium text-sm">{t("view_full_image")}</div>
                    </a>
                  ) : (
                    <div className="aspect-video bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 text-sm">{t("no_image")}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Terms and Conditions Input */}
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-3 tracking-tight">{t("terms_conditions")}</h3>
              <p className="text-sm text-slate-500 mb-3">{t("terms_conditions_help")}</p>
              <textarea
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                placeholder={t("terms_conditions_placeholder")}
                className="w-full h-32 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none text-slate-700 dark:text-slate-200 shadow-inner"
              ></textarea>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={handleReject}
                disabled={actionLoading}
                className="px-6 py-2.5 rounded-xl font-bold border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 dark:border-red-900/50 dark:text-red-400 dark:bg-red-900/20 dark:hover:bg-red-900/40 transition-colors disabled:opacity-50"
              >
                {actionLoading ? t("rejecting") : t("reject_space")}
              </button>
              <button
                onClick={handleApprove}
                disabled={actionLoading || !terms.trim()}
                className="flex items-center gap-2 px-8 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-md shadow-blue-500/20 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                title={!terms.trim() ? t("terms_required_tooltip") : ""}
              >
                <CheckCircleIcon className="w-5 h-5" />
                {actionLoading ? t("approving") : t("approve_space")}
              </button>
            </div>
            {!terms.trim() && (
              <p className="text-xs text-red-500 text-right mt-2">{t("terms_required_msg")}</p>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
