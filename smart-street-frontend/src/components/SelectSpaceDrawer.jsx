import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { XMarkIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";

export default function SelectSpaceDrawer({
  isOpen,
  onClose,
  spaces,
  selectedSpaceId,
  onSelectSpace,
  loading,
  title = "Select Space"
}) {
  const [query, setQuery] = useState("");
  const [mounted, setMounted] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Lock body scroll when drawer is open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setQuery(""); // Reset query on open
    } else {
      document.body.style.overflow = "auto";
      setIsFocused(false); // Reset focus
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  const filteredSpaces = spaces.filter((s) =>
    s.space_name.toLowerCase().includes(query.toLowerCase()) || 
    (s.address && s.address.toLowerCase().includes(query.toLowerCase()))
  );

  const handleDragEnd = (event, info) => {
    const { offset, velocity } = info;
    if (offset.y > 100 || velocity.y > 500) {
      onClose();
    }
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Deep Blur Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[9998] md:hidden"
          />

          {/* Drawer */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.4}
            onDragEnd={handleDragEnd}
            className={`fixed bottom-0 left-0 right-0 ${isFocused ? 'h-[85vh]' : 'h-[60vh]'} min-h-[400px] bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl z-[9999] rounded-t-3xl shadow-[0_-20px_50px_rgba(0,0,0,0.15)] flex flex-col md:hidden transition-all duration-300 will-change-transform transform-gpu`}
          >
            {/* Header & Drag Handle */}
            <div className="flex-none pt-3 pb-2 px-4 shadow-sm z-10 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md rounded-t-3xl border-b border-white/20 dark:border-slate-700/50">
              <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-600 rounded-full mx-auto mb-4 cursor-grab active:cursor-grabbing" />
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{title}</h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full bg-slate-100/80 dark:bg-slate-800/80 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative mt-2 mb-2">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-3 border border-slate-200/50 dark:border-slate-700/50 rounded-xl leading-5 bg-white/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm transition-all focus:bg-white dark:focus:bg-slate-800 backdrop-blur-sm shadow-inner"
                  placeholder="Search owner spaces..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-[calc(env(safe-area-inset-bottom)+2rem)] custom-scrollbar">
              {loading ? (
                // Skeleton UI
                <>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="w-full p-4 rounded-xl bg-slate-100/50 dark:bg-slate-800/30 animate-[pulse_1.5s_ease-in-out_infinite] border border-slate-100 dark:border-slate-800/50">
                       <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-3"></div>
                       <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-4"></div>
                       <div className="flex justify-between items-center">
                         <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-16"></div>
                         <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-20"></div>
                       </div>
                    </div>
                  ))}
                </>
              ) : filteredSpaces.length === 0 ? (
                <div className="text-center py-8 text-slate-500 italic">
                  No spaces found matching "{query}"
                </div>
              ) : (
                filteredSpaces.map((space) => {
                  const isSelected = space.space_id === selectedSpaceId;
                  return (
                    <motion.button
                      key={space.space_id}
                      whileTap={{ scale: 0.98 }}
                      onTap={() => {
                        onSelectSpace(space.space_id);
                        onClose();
                      }}
                      className={`w-full text-left p-4 rounded-xl border transition-all ${
                        isSelected
                          ? "border-blue-500 bg-blue-50/80 dark:bg-blue-900/30 shadow-md"
                          : "border-slate-200/50 dark:border-slate-700/50 bg-white/60 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 shadow-sm"
                      }`}
                    >
                      <h4 className={`font-bold text-lg ${isSelected ? 'text-blue-700 dark:text-blue-400' : 'text-slate-800 dark:text-slate-200'}`}>
                        {space.space_name}
                      </h4>
                      {space.address && (
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                          {space.address}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-3 mt-3">
                         <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md ${
                           space.occupancy_status === 'RED' ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300' : 
                           space.occupancy_status === 'YELLOW' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300' : 
                           'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 animate-[pulse_2s_ease-in-out_infinite]'
                         }`}>
                           {space.occupancy_status === 'RED' ? 'OCCUPIED' : space.occupancy_status === 'YELLOW' ? 'EXPIRING SOON' : 'AVAILABLE'}
                         </span>
                         <span className="text-sm font-bold text-slate-600 dark:text-slate-400">
                           {space.allowed_radius}m / <span className="text-blue-600 dark:text-blue-400">₹{space.price_per_radius}</span>
                         </span>
                      </div>
                    </motion.button>
                  );
                })
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
