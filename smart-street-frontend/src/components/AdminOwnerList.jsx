import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import AdminOwnerDetail from "./AdminOwnerDetail.jsx";
import LoadingSpinner from "./LoadingSpinner";

export default function AdminOwnerList({ owners, loading }) {
  const [search, setSearch] = useState("");
  const [selectedOwnerId, setSelectedOwnerId] = useState(null);
  const { t } = useTranslation();

  const filtered = owners?.filter(o =>
    o.owner_name?.toLowerCase().includes(search.toLowerCase()) ||
    o.email?.toLowerCase().includes(search.toLowerCase()) ||
    o.phone_number?.toLowerCase().includes(search.toLowerCase())
  ) || [];
  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-20 flex flex-col items-center justify-center gap-4">
        <LoadingSpinner size="lg" color="black" />
        <p className="text-slate-500 font-medium">{t("loading_owners") || "Loading owners..."}</p>
      </div>
    );
  }

  if (!owners || owners.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-12 text-center">
        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t("no_owners_found")}</h3>
        <p className="text-slate-500 dark:text-slate-400 mt-2">{t("no_registered_owners")}</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col h-full">
      <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t("registered_owners")}</h2>
          <p className="text-lg text-slate-500 dark:text-slate-400">
            {t("total_count", { count: owners?.length || 0 })} {t("owners").toLowerCase()}
          </p>
        </div>
        <div className="relative w-full sm:w-80">
          <MagnifyingGlassIcon className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder={t("search_owners") || "Search owners..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 text-base rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
          />
        </div>
      </div>

      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left">
          <thead className="bg-slate-50 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-lg border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="px-8 py-5">{t("owner_details")}</th>
              <th className="px-8 py-5">{t("contact_info")}</th>
              <th className="px-8 py-5 text-center">{t("total_spaces")}</th>
              <th className="px-8 py-5 text-right">{t("joined")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-8 py-10 text-center text-lg text-slate-500 dark:text-slate-400 italic">
                  {t("no_owners_match", { search }) || `No owners found matching "${search}"`}
                </td>
              </tr>
            ) : (
              filtered.map((owner) => (
                <tr
                  key={owner.owner_id}
                  onClick={() => setSelectedOwnerId(owner.owner_id)}
                  className="hover:bg-blue-50/50 dark:hover:bg-slate-800/80 transition-all duration-200 group border-b border-transparent hover:border-blue-100 dark:hover:border-slate-700 cursor-pointer"
                >
                  <td className="px-8 py-6">
                    <div>
                      <div className="font-bold text-xl text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{owner.owner_name}</div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                        <span className="text-base bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-md font-medium group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 transition-colors">
                          {owner.phone_number || t("no_phone")}
                        </span>
                      </div>
                      <div className="text-slate-500 dark:text-slate-400 text-lg group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
                        {owner.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-center transform group-hover:scale-105 transition-transform duration-300">
                    <span className={`inline-flex items-center justify-center px-4 py-2 rounded-full text-base font-bold transition-all shadow-sm ${owner.total_spaces > 0
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-900/50"
                      : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-700"
                      }`}>
                      {owner.total_spaces} {t("spaces")}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right text-slate-500 dark:text-slate-400 whitespace-nowrap text-lg font-medium">
                    {new Date(owner.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Slide-out Panel Overlay */}
      {selectedOwnerId && (
        <>
          <div
            className="fixed inset-0 bg-slate-900/20 dark:bg-slate-900/60 backdrop-blur-sm z-[4999] transition-opacity"
            onClick={() => setSelectedOwnerId(null)}
          />
          <AdminOwnerDetail
            ownerId={selectedOwnerId}
            onClose={() => setSelectedOwnerId(null)}
          />
        </>
      )}
    </div>
  );
}
