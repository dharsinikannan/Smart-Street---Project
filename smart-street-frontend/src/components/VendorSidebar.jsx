import React, { useState, useEffect } from "react";
import { motion, useAnimation } from "framer-motion";
import { ChevronRightIcon, ChevronLeftIcon, PlusCircleIcon, ClockIcon, DocumentCheckIcon, ArrowRightIcon, QrCodeIcon, ChartBarIcon, ArrowsUpDownIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import AnalyticsChart from "./AnalyticsChart";
import { useTranslation } from "react-i18next";
import { STATUS_COLORS, STATUS_LABELS } from "../utils/constants";
import SelectSpaceDrawer from "./SelectSpaceDrawer";
import LoadingSpinner from "./LoadingSpinner";
import SearchableSelect from "./SearchableSelect";

export default function VendorSidebar({
  intent,
  setIntent,
  spaces,
  selectedSpaceId,
  setSelectedSpaceId,
  loading,
  requests,
  permits,
  onOpenQr,
  onRequestClick,
  sheetState = "collapsed",
  setSheetState,
  onRefreshRequests,
  storefronts = [],
  selectedStorefrontId,
  setSelectedStorefrontId,
  className = ""
}) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("new"); // "new", "history", "permits"
  const [historySort, setHistorySort] = useState("recent"); // "recent", "size"
  const [permitsSort, setPermitsSort] = useState("recent"); // "recent", "size"
  const [refreshing, setRefreshing] = useState(false);
  const controls = useAnimation();

  // Desktop vs Mobile check
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showSpaceDrawer, setShowSpaceDrawer] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Web Share API helper — shares permit verify link
  const handleSharePermit = async (permit) => {
    const verifyUrl = `${window.location.origin}/verify?id=${permit.permit_id}`;
    const shareData = {
      title: `Smart Street Permit — ${permit.space_name || 'My Permit'}`,
      text: `Permit ID: ${permit.permit_id}\nValid: ${new Date(permit.valid_from).toLocaleDateString()} – ${new Date(permit.valid_to).toLocaleDateString()}`,
      url: verifyUrl,
    };
    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(verifyUrl);
      }
    } catch (err) {
      if (err.name !== 'AbortError') console.error('Share failed:', err);
    }
  };

  const variants = {
    collapsed: { y: "calc(100% - 150px)" }, // Show top bar + padding for BottomNav
    half: { y: "50%" },
    full: { y: "1%" } // almost reaching the top but not completely
  };

  useEffect(() => {
    if (isMobile) {
      controls.start(sheetState);
    } else {
      // Clean desktop start
      controls.start({ y: 0 });
    }
  }, [sheetState, isMobile, controls]);

  const handleDragEnd = (event, info) => {
    if (!isMobile) return;
    const { offset, velocity } = info;
    
    // threshold logic based on swipe direction and current state
    if (sheetState === "collapsed") {
      if (offset.y < -50 || velocity.y < -500) {
        setSheetState("half");
      }
    } else if (sheetState === "half") {
      if (offset.y < -50 || velocity.y < -500) {
        setSheetState("full");
      } else if (offset.y > 50 || velocity.y > 500) {
        setSheetState("collapsed");
      }
    } else if (sheetState === "full") {
      if (offset.y > 50 || velocity.y > 500) {
        setSheetState("half");
      }
    } else {
      controls.start(sheetState); // snap back
    }
  };

  return (
    <motion.div
      initial={isMobile ? "collapsed" : { y: 0 }}
      animate={controls}
      variants={isMobile ? variants : {}}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      drag={isMobile ? "y" : false}
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.2}
      onDragEnd={handleDragEnd}
      className={`fixed shadow-[var(--tw-shadow-xl),0_-10px_20px_rgba(0,0,0,0.1)] border border-slate-200 dark:border-slate-800 z-[2000]
        bg-white/95 dark:bg-slate-900/95 backdrop-blur-md flex flex-col
        ${isMobile 
          ? "bottom-0 left-0 right-0 w-full h-[90dvh] rounded-t-[2.5rem] pb-[env(safe-area-inset-bottom)]" 
          : "md:top-32 md:left-4 md:bottom-auto md:right-auto md:w-[clamp(320px,30vw,400px)] md:max-h-[calc(100vh-10rem)] rounded-xl !transform-none"
        }
        ${className}
      `}
    >
      {/* Drag Handle (Mobile Only) */}
      {isMobile && (
        <div className="w-full flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing shrink-0">
          <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-600 rounded-full" />
        </div>
      )}

      <div className="flex flex-col h-full overflow-hidden w-full">
        {/* Tab Navigation */}
        <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-1 shrink-0 w-full">
            <button
              onClick={() => setActiveTab("new")}
              className={`flex-1 flex items-center justify-center gap-1 py-3 text-base font-semibold rounded-lg transition-all whitespace-nowrap ${activeTab === "new" ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200 dark:border-slate-700" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                }`}
            >
              <PlusCircleIcon className="w-5 h-5 shrink-0" />
              <span className="hidden sm:inline">{t('tab_new')}</span>
              <span className="sm:hidden">{t('tab_new')}</span>
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`flex-1 flex items-center justify-center gap-1 py-3 text-base font-semibold rounded-lg transition-all whitespace-nowrap ${activeTab === "history" ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200 dark:border-slate-700" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                }`}
            >
              <ClockIcon className="w-5 h-5 shrink-0" />
              <span className="hidden sm:inline">{t('tab_history')}</span>
              <span className="sm:hidden">{t('tab_history')}</span>
            </button>
            <button
              onClick={() => setActiveTab("permits")}
              className={`flex-1 flex items-center justify-center gap-1 py-3 text-base font-semibold rounded-lg transition-all whitespace-nowrap ${activeTab === "permits" ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200 dark:border-slate-700" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                }`}
            >
              <DocumentCheckIcon className="w-5 h-5 shrink-0" />
              <span className="hidden sm:inline">{t('tab_permits')}</span>
              <span className="sm:hidden">{t('tab_permits')}</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-5 pb-safe">

            {/* --- TAB: NEW REQUEST --- */}
            {activeTab === "new" && (
              <>
                {/* Header */}
                <div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1">{t('new_request_title')}</h2>
                  <p className="text-base text-slate-500 dark:text-slate-400">{t('new_request_subtitle')}</p>
                </div>

                {/* 1. Intent Selection */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">{t('request_type')}</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIntent("OWNER_DEFINED");
                        setSelectedSpaceId(null); // Clear selected space to force drawer
                        if (isMobile) {
                          setShowSpaceDrawer(true);
                        }
                      }}
                      className={`py-3 px-2 text-sm font-medium rounded-lg border transition-all leading-tight text-center ${intent === "OWNER_DEFINED"
                        ? "bg-blue-600 text-white border-blue-600 shadow-md"
                        : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
                        }`}
                    >
                      {t('owner_location')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIntent("REQUEST_NEW")}
                      className={`py-3 px-2 text-sm font-medium rounded-lg border transition-all leading-tight text-center ${intent === "REQUEST_NEW"
                        ? "bg-purple-600 text-white border-purple-600 shadow-md"
                        : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
                        }`}
                    >
                      {t('new_request_button')}
                    </button>
                  </div>
                  
                  {/* Storefront Selector */}
                  {storefronts.length > 0 && (
                    <div className="mt-4 bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">
                        Applying As Storefront
                      </label>
                      <select
                        value={selectedStorefrontId}
                        onChange={(e) => setSelectedStorefrontId(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
                      >
                        {storefronts.map((sf) => (
                          <option key={sf.vendor_id} value={sf.vendor_id}>
                            {sf.business_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 my-1"></div>

                {/* 2. Content based on selection */}
                <div className="mt-4">
                  {!intent && (
                    <div className="text-sm text-slate-500 italic text-center py-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      {t('select_request_type_hint')}
                    </div>
                  )}

                  {intent === "OWNER_DEFINED" && (
                    <div className="space-y-2 animate-fadeIn">
                      <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300">{t('select_space')}</h3>
                      {loading ? (
                        <div className="flex justify-center p-4">
                          <LoadingSpinner size="sm" className="text-blue-600" />
                        </div>
                      ) : spaces.length === 0 ? (
                        <div className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 p-2 rounded border border-red-100 dark:border-red-900/30">
                          {t('no_spaces_available')}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {isMobile ? (
                            <>
                              {!selectedSpaceId ? (
                                <button
                                  type="button"
                                  onClick={() => setShowSpaceDrawer(true)}
                                  className="w-full relative overflow-hidden group bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl py-4 px-4 font-bold shadow-lg hover:shadow-xl transition-all flex justify-between items-center active:scale-[0.98]"
                                >
                                  {/* Decorative background circle */}
                                  <div className="absolute -right-4 -top-4 w-16 h-16 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out" />
                                  <div className="flex items-center gap-2 relative z-10">
                                    <span className="text-xl">📍</span>
                                    <span>Tap to Select Owner Space</span>
                                  </div>
                                  <ChevronRightIcon className="w-5 h-5 relative z-10 animate-pulse" />
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setShowSpaceDrawer(true)}
                                  className="w-full text-left bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-3 px-4 text-slate-900 dark:text-white font-medium hover:bg-slate-50 dark:hover:bg-slate-700/50 shadow-sm transition-colors flex justify-between items-center"
                                >
                                  {spaces.find(s => s.space_id === selectedSpaceId)?.space_name}
                                  <div className="p-1 rounded bg-slate-100 dark:bg-slate-700 text-slate-500">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                  </div>
                                </button>
                              )}
                              
                              <SelectSpaceDrawer
                                isOpen={showSpaceDrawer}
                                onClose={() => setShowSpaceDrawer(false)}
                                spaces={spaces}
                                selectedSpaceId={selectedSpaceId}
                                loading={loading}
                                onSelectSpace={(id) => {
                                  setSelectedSpaceId(id);
                                  // Auto-collapse bottom sheet to show the Action Card + Map pinpoint
                                  if (setSheetState) setSheetState("collapsed");
                                }}
                              />
                            </>
                          ) : (
                            <SearchableSelect
                              options={spaces.map(s => ({ value: s.space_id, label: s.space_name }))}
                              value={selectedSpaceId}
                              onChange={(val) => {
                                setSelectedSpaceId(val);
                                if (setSheetState) setSheetState("collapsed");
                              }}
                              placeholder={t('search_spaces_placeholder')}
                              className="w-full"
                            />
                          )}
                        </div>
                      )}

                      {/* Display Space Details if selected */}
                      {selectedSpaceId && (
                        <div className="mt-4 p-4 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl space-y-3 animate-fadeIn">
                          <h4 className="font-bold text-sm text-slate-700 dark:text-slate-200">Space Verification Details</h4>
                          
                          <div className="flex flex-col gap-2 text-sm text-slate-600 dark:text-slate-400">
                            <div className="flex justify-between">
                              <span className="font-medium">Fixed Radius:</span>
                              <span className="font-bold text-slate-800 dark:text-slate-200">{spaces.find(s => s.space_id === selectedSpaceId)?.allowed_radius || 0}m</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-medium">Approx Area:</span>
                              <span className="font-bold text-slate-800 dark:text-slate-200">{Math.round(Math.PI * (spaces.find(s => s.space_id === selectedSpaceId)?.allowed_radius || 0)**2)}m²</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-medium">Price per meter:</span>
                              <span className="font-bold text-slate-800 dark:text-slate-200">₹{spaces.find(s => s.space_id === selectedSpaceId)?.price_per_radius || 0}</span>
                            </div>
                          </div>
                          
                          {spaces.find(s => s.space_id === selectedSpaceId)?.terms_conditions && (
                            <div className="pt-2 border-t border-blue-200 dark:border-blue-800/50">
                              <span className="font-medium text-xs text-slate-500 uppercase tracking-wider block mb-1">Terms & Conditions</span>
                              <p className="text-xs text-slate-600 dark:text-slate-400 max-h-24 overflow-y-auto custom-scrollbar p-2 bg-white/50 dark:bg-slate-900/50 rounded-lg">
                                {spaces.find(s => s.space_id === selectedSpaceId)?.terms_conditions}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {intent === "REQUEST_NEW" && (
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-100 dark:border-purple-800 animate-fadeIn">
                      <h3 className="text-base font-bold text-purple-900 dark:text-purple-300 mb-2">{t('select_location')}</h3>
                      <p className="text-sm text-purple-800 dark:text-purple-200 mb-3">
                        <span className="font-semibold">{t('tap_on_map')}</span> {t('tap_map_hint')}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-purple-700 dark:text-purple-400">
                        <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div>
                        {t('map_interaction_enabled')}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* --- TAB: HISTORY --- */}
            {activeTab === "history" && (
              <div className="space-y-4">
                <div className="flex justify-between items-end mb-1">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">{t('request_history_title')}</h2>
                    <p className="text-base text-slate-500 dark:text-slate-400">{t('request_history_subtitle')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Refresh button */}
                    {onRefreshRequests && (
                      <button
                        type="button"
                        onClick={async () => {
                          setRefreshing(true);
                          await onRefreshRequests();
                          setTimeout(() => setRefreshing(false), 600);
                        }}
                        disabled={refreshing}
                        title="Refresh requests"
                        className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-800/40 transition-all active:scale-95 disabled:opacity-50"
                      >
                        <ArrowPathIcon className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                      </button>
                    )}
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200/50 dark:border-slate-700/50">
                      <ArrowsUpDownIcon className="w-3.5 h-3.5 text-slate-400 ml-1" />
                      <select
                        value={historySort}
                        onChange={(e) => setHistorySort(e.target.value)}
                        className="bg-transparent text-xs font-bold text-slate-600 dark:text-slate-400 outline-none pr-1"
                      >
                        <option value="recent">Recent</option>
                        <option value="size">Size</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  {loading ? (
                    /* Shimmer skeleton — 3 placeholder cards matching real card shape */
                    <div className="space-y-3" aria-busy="true" aria-label="Loading requests">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="p-4 bg-white dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700 rounded-lg overflow-hidden relative">
                          {/* Shimmer sweep overlay */}
                          <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/60 dark:via-slate-600/30 to-transparent" />
                          {/* Row 1: ID pill + badge pill */}
                          <div className="flex gap-2 mb-2">
                            <div className="h-4 w-16 rounded bg-slate-200 dark:bg-slate-700" />
                            <div className="h-4 w-14 rounded-full bg-slate-200 dark:bg-slate-700" />
                          </div>
                          {/* Row 2: Space name */}
                          <div className="h-3.5 w-3/4 rounded bg-slate-200 dark:bg-slate-700 mb-3" />
                          {/* Row 3: Date + arrow */}
                          <div className="flex justify-between">
                            <div className="h-3 w-20 rounded bg-slate-200 dark:bg-slate-700" />
                            <div className="h-3 w-16 rounded bg-slate-200 dark:bg-slate-700" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : requests.length === 0 ? (
                    <p className="text-base text-slate-400 italic">{t('no_requests_found')}</p>
                  ) : (
                    [...requests]
                      .sort((a, b) => {
                        if (historySort === "recent") return new Date(b.submitted_at) - new Date(a.submitted_at);
                        if (historySort === "size") {
                          const areaA = (a.max_width || 0) * (a.max_length || 0);
                          const areaB = (b.max_width || 0) * (b.max_length || 0);
                          return areaB - areaA;
                        }
                        return 0;
                      })
                      .map(r => (
                        <div
                          key={r.request_id}
                          onClick={() => onRequestClick && onRequestClick(r)}
                          className="p-4 bg-white dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700 rounded-lg hover:border-blue-200 dark:hover:border-blue-500 transition-colors cursor-pointer group"
                        >
                          {/* Row 1: ID + badge — wrap on small screens */}
                          <div className="flex flex-wrap gap-x-2 gap-y-1 items-start mb-1">
                            <span className="font-bold text-base text-slate-700 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">#{r.request_id.slice(0, 6)}</span>
                            <span className={`px-2.5 py-0.5 rounded text-xs font-bold leading-5 shrink-0 ${STATUS_COLORS[r.status] || STATUS_COLORS.PENDING}`}>
                              {STATUS_LABELS[r.status] || r.status}
                            </span>
                          </div>
                          {/* Space name: 2-line clamp instead of hard truncate */}
                          <p className="text-slate-600 dark:text-slate-400 line-clamp-2 text-sm font-medium leading-snug">{r.space_name || t('custom_location')}</p>
                          <div className="flex justify-between items-center mt-2">
                            <div className="flex flex-col">
                              <p className="text-xs text-slate-400">{new Date(r.submitted_at).toLocaleDateString()}</p>
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Area: {Math.round((r.max_width * r.max_length))}m²</p>
                            </div>
                            <span className="text-xs text-blue-500 font-bold">{t('view_details')} →</span>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            )}

            {/* --- TAB: PERMITS --- */}
            {activeTab === "permits" && (
              <div className="space-y-4">
                <div className="flex justify-between items-end mb-1">
                  <div>
                    <h2 className="text-base font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">{t('my_permits_title')}</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{t('my_permits_subtitle')}</p>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200/50 dark:border-slate-700/50">
                    <ArrowsUpDownIcon className="w-3.5 h-3.5 text-slate-400 ml-1" />
                    <select
                      value={permitsSort}
                      onChange={(e) => setPermitsSort(e.target.value)}
                      className="bg-transparent text-xs font-bold text-slate-600 dark:text-slate-400 outline-none pr-1"
                    >
                      <option value="recent">Recent</option>
                      <option value="size">Size</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  {loading ? (
                    <div className="flex justify-center p-8">
                      <LoadingSpinner size="md" className="text-green-600 dark:text-green-400" />
                    </div>
                  ) : permits.length === 0 ? (
                    <p className="text-sm text-slate-400 italic">{t('no_active_permits')}</p>
                  ) : (
                    [...permits]
                      .sort((a, b) => {
                        if (permitsSort === "recent") return new Date(b.issued_at || b.valid_from) - new Date(a.issued_at || a.valid_from);
                        if (permitsSort === "size") {
                          const areaA = (a.max_width || 0) * (a.max_length || 0);
                          const areaB = (b.max_width || 0) * (b.max_length || 0);
                          return areaB - areaA;
                        }
                        return 0;
                      })
                      .map((p, index) => (
                        <div key={p.permit_id} className="p-3 bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 rounded-lg text-sm">
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-bold text-base text-green-900 dark:text-green-300 border-b border-green-200 dark:border-green-800 pb-0.5 line-clamp-1">
                              {p.space_name || `Permit #${index + 1}`}
                            </span>
                            {/* Action buttons row */}
                            <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
                              {/* Share button — only shown when Web Share API is available (mobile) */}
                              {'share' in navigator && (
                                <button
                                  type="button"
                                  onClick={() => handleSharePermit(p)}
                                  title="Share permit"
                                  className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 active:scale-95 transition-all"
                                  aria-label="Share this permit"
                                >
                                  {/* Share icon (heroicons share) */}
                                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                  </svg>
                                </button>
                              )}
                              <button
                                onClick={() => onOpenQr && onOpenQr(p)}
                                className="text-sm bg-green-200 dark:bg-green-900 text-green-900 dark:text-green-100 px-3 py-2 rounded-lg hover:bg-green-300 dark:hover:bg-green-800 active:scale-95 transition-all font-bold shadow-sm"
                              >
                                {t('view_permit')}
                              </button>
                            </div>
                          </div>
                          <div className="flex flex-col gap-1 mt-2">
                             <div className="flex justify-between items-center text-xs font-semibold text-green-700 dark:text-green-400">
                               <span>{t('valid_from')}: {new Date(p.valid_from).toLocaleDateString()}</span>
                               <span>{t('valid_to')}: {new Date(p.valid_to).toLocaleDateString()}</span>
                             </div>
                             <div className="text-[10px] font-bold text-green-600/70 dark:text-green-400/50 uppercase tracking-tighter">
                               Radius: {Math.round(Math.sqrt((p.max_width**2 + p.max_length**2))/2)}m (Approx Area: {Math.round(p.max_width * p.max_length)}m²)
                             </div>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
    </motion.div>
  );
}
