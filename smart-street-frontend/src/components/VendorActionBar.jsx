import { PaperAirplaneIcon, HeartIcon as HeartIconSolid, XMarkIcon } from "@heroicons/react/24/solid";
import { HeartIcon as HeartIconOutline } from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import LoadingSpinner from "./LoadingSpinner";
import { useRef, useEffect } from "react";

export default function VendorActionBar({
  intent,
  setIntent, // Add setIntent to allow closing
  form,
  setForm,
  requestedRadius,
  setRequestedRadius,
  ownerDefinedRadius,
  pricePerRadius,
  handleSubmit,
  saving,
  isFavorite,
  onToggleFavorite,
  showFavorite,
  className = ""
}) {
  const { t } = useTranslation();
  
  // If no intent, don't render the action bar
  if (!intent) return null;

  const isOwnerDefined = intent === "OWNER_DEFINED";
  const currentRadius = isOwnerDefined ? ownerDefinedRadius : (requestedRadius || 0);
  const estimatedPrice = currentRadius * (pricePerRadius || 0);

  const formRef = useRef(null);

  useEffect(() => {
    // Scroll the entire form into view when the component mounts (intent changes to truthy)
    if (formRef.current) {
        // Small delay to allow framer-motion entrance animation to start so the coordinates are correct
        setTimeout(() => {
            formRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }, 300);
    }
  }, []);

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ y: 200, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }} 
        exit={{ y: 200, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className={`
          fixed z-[2100] bottom-28 left-4 right-4
          md:absolute md:bottom-6 md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-5xl lg:max-w-6xl md:px-4 md:bg-transparent md:border-none md:shadow-none
          ${className}
        `}
      >
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className={`
            relative flex flex-col gap-3 p-4 pointer-events-auto
            bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] rounded-3xl border border-slate-200 dark:border-slate-800
            md:p-5 md:flex-row md:flex-wrap lg:flex-nowrap md:items-end
          `}
        >
          {/* Close Button */}
          <button
            type="button"
            onClick={() => setIntent(null)}
            className="absolute -top-3 -right-3 w-8 h-8 flex items-center justify-center bg-white dark:bg-slate-800 rounded-full shadow-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 md:hidden z-10"
            aria-label="Close"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>

          <div className="flex-1 w-full grid grid-cols-2 gap-2 md:gap-3 lg:gap-4 shrink-0 lg:shrink">
            <div className="min-w-[125px] overflow-hidden">
              <label className="block text-sm md:text-base font-bold text-slate-700 dark:text-slate-300 mb-1 whitespace-nowrap">{t('start_time')}</label>
              <input
                type="datetime-local"
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                className="w-full text-xs sm:text-sm lg:text-base rounded-xl border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 py-2 px-1 lg:px-2 bg-slate-50 dark:bg-slate-800 dark:text-white"
                required
              />
            </div>
            <div className="min-w-[125px] overflow-hidden">
              <label className="block text-sm md:text-base font-bold text-slate-700 dark:text-slate-300 mb-1 whitespace-nowrap">{t('end_time')}</label>
              <input
                type="datetime-local"
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                className="w-full text-xs sm:text-sm lg:text-base rounded-xl border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 py-2 px-1 lg:px-2 bg-slate-50 dark:bg-slate-800 dark:text-white"
                required
              />
            </div>
          </div>

          {/* Radius Input */}
          <div className="w-full md:w-28 lg:w-36 xl:w-48">
            <label className="block text-sm md:text-base font-bold text-slate-700 dark:text-slate-300 mb-1">
              {t('radius_m')}
            </label>
            <input
              type="number"
              value={isOwnerDefined ? ownerDefinedRadius : requestedRadius}
              onChange={(e) => !isOwnerDefined && setRequestedRadius(e.target.value)}
              placeholder={t('radius_placeholder')}
              readOnly={isOwnerDefined}
              className={`w-full text-sm lg:text-base xl:text-lg rounded-xl border-slate-200 dark:border-slate-700 py-2 px-2 md:px-3 focus:ring-2 focus:ring-blue-500 ${isOwnerDefined
                ? "bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 cursor-not-allowed"
                : "bg-white dark:bg-slate-800 dark:text-white"
                }`}
            />
          </div>

          {/* Price Estimate */}
          {estimatedPrice > 0 && (
            <div className="w-full md:w-auto px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800 text-center md:text-left">
              <p className="text-[10px] sm:text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">{t('estimated_price') || 'Estimated Price'}</p>
              <p className="text-lg sm:text-xl font-black text-blue-700 dark:text-blue-300">
                <span className="text-xs sm:text-sm font-medium opacity-70">₹</span> {estimatedPrice.toLocaleString()}
              </p>
            </div>
          )}

          {/* Favorite Toggle */}
          {showFavorite && (
            <button
              type="button"
              onClick={onToggleFavorite}
              className={`p-3 rounded-xl border-2 transition-all active:scale-95 ${isFavorite
                ? "bg-rose-50 border-rose-200 text-rose-500 shadow-sm"
                : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400"
                }`}
              title={isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
              {isFavorite ? <HeartIconSolid className="w-6 h-6" /> : <HeartIconOutline className="w-6 h-6" />}
            </button>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={saving}
            className={`shrink-0 w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-lg md:text-base lg:text-lg shadow-lg transition-all transform active:scale-95 ${saving
              ? "bg-slate-300 text-slate-500 cursor-wait shadow-none"
              : "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-blue-200"
              }`}
          >
            {saving ? (
              <>
                <LoadingSpinner size="sm" color="white" />
                <span>{t('submitting')}</span>
              </>
            ) : (
              <>
                <PaperAirplaneIcon className="w-5 h-5" />
                <span>{t('submit_request')}</span>
              </>
            )}
          </button>
        </form>
      </motion.div>
    </AnimatePresence>
  );
}
