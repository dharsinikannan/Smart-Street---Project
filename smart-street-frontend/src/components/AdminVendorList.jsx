import { useState } from "react";
import { useTranslation } from "react-i18next";
import { MagnifyingGlassIcon, UserCircleIcon } from "@heroicons/react/24/outline";
import AdminVendorDetail from "./AdminVendorDetail.jsx";
import LoadingSpinner from "./LoadingSpinner";

export default function AdminVendorList({ vendors, loading }) {
  const [search, setSearch] = useState("");
  const [selectedVendorId, setSelectedVendorId] = useState(null);
  const { t } = useTranslation();

  const filtered = vendors?.filter(v =>
    v.vendor_name.toLowerCase().includes(search.toLowerCase()) ||
    v.business_name.toLowerCase().includes(search.toLowerCase()) ||
    v.email.toLowerCase().includes(search.toLowerCase())
  ) || [];

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-20 shadow-sm flex flex-col items-center justify-center gap-4">
        <LoadingSpinner size="lg" color="black" />
        <p className="text-slate-500 font-medium">{t("loading_vendors") || "Loading vendors..."}</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-full">

      {/* Header */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{t("registered_vendors")}</h2>
          <p className="text-lg text-slate-500 dark:text-slate-400">
            {t("total_count", { count: vendors?.length || 0 })} {t("vendors").toLowerCase()}
          </p>
        </div>
        <div className="relative w-full sm:w-80">
          <MagnifyingGlassIcon className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder={t("search_vendors")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 text-base rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Table */}

      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 dark:bg-slate-800/50 text-lg uppercase text-slate-500 dark:text-slate-400 font-bold sticky top-0">
            <tr>
              <th className="px-8 py-5">{t("vendor_label")}</th>
              <th className="px-8 py-5">{t("contact")}</th>
              <th className="px-8 py-5 text-center">{t("statistics")}</th>
              <th className="px-8 py-5">{t("joined")}</th>
              <th className="px-8 py-5">{t("status")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-8 py-10 text-center text-lg text-slate-500 dark:text-slate-400 italic">
                  {t("no_vendors_match", { search })}
                </td>
              </tr>
            ) : (
              filtered.map((vendor) => (
                <tr
                  key={vendor.vendor_id}
                  onClick={() => setSelectedVendorId(vendor.vendor_id)}
                  className="hover:bg-blue-50/50 dark:hover:bg-slate-800/80 transition-all duration-200 group border-b border-transparent hover:border-blue-100 dark:hover:border-slate-700 cursor-pointer"
                >
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white dark:group-hover:bg-blue-500 transition-colors duration-300 shadow-sm">
                        <UserCircleIcon className="w-8 h-8" />
                      </div>
                      <div>
                        <p className="font-bold text-xl text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{vendor.business_name}</p>
                        <p className="text-base text-slate-500 dark:text-slate-400 font-medium">{vendor.vendor_name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="text-lg space-y-1">
                      <p className="text-slate-700 dark:text-slate-300 font-medium">{vendor.email}</p>
                      <p className="text-base text-slate-500">{vendor.phone_number}</p>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center justify-center gap-8">
                      <div className="text-center transform group-hover:scale-110 transition-transform duration-300">
                        <span className="block text-2xl font-bold text-slate-800 dark:text-slate-200">{vendor.active_permits}</span>
                        <span className="text-xs text-slate-500 uppercase font-bold tracking-wide">{t("permits")}</span>
                      </div>
                      <div className="h-12 w-px bg-slate-200 dark:bg-slate-700"></div>
                      <div className="text-center transform group-hover:scale-110 transition-transform duration-300">
                        <span className="block text-2xl font-bold text-slate-800 dark:text-slate-200">{vendor.total_requests}</span>
                        <span className="text-xs text-slate-500 uppercase font-bold tracking-wide">{t("requests")}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-lg text-slate-600 dark:text-slate-400 font-medium">
                      {new Date(vendor.created_at).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-base font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 group-hover:shadow-sm transition-shadow">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 group-hover:animate-pulse"></span>
                      {t("verified_label")}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Slide-out Panel Overlay */}
      {selectedVendorId && (
        <>
          <div
            className="fixed inset-0 bg-slate-900/20 dark:bg-slate-900/60 backdrop-blur-sm z-[4999] transition-opacity"
            onClick={() => setSelectedVendorId(null)}
          />
          <AdminVendorDetail
            vendorId={selectedVendorId}
            onClose={() => setSelectedVendorId(null)}
          />
        </>
      )}
    </div>
  );
}
