import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import InteractiveParticles from "../components/InteractiveParticles";
import { BuildingStorefrontIcon, ArrowRightIcon, ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";
import ThemeToggle from "../components/ThemeToggle";
import LanguageSwitcher from "../components/LanguageSwitcher";

export default function LandingPage() {
  const { t } = useTranslation();

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-[#0B1120] overflow-hidden flex flex-col transition-colors duration-300">
      {/* Particle Background */}
      <div className="absolute inset-0 z-0">
        <InteractiveParticles />
      </div>

      {/* Dark Mode Gradient Overlay */}
      <div className="absolute inset-0 z-0 pointer-events-none bg-gradient-to-b from-transparent via-transparent to-slate-50/50 dark:to-[#0B1120] dark:via-transparent dark:from-transparent opacity-80" />

      {/* Header / Nav */}
      <nav className="relative z-50 flex flex-col md:flex-row justify-between items-center p-6 md:px-12 gap-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-tr from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <BuildingStorefrontIcon className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">{t("app_name")}</span>
        </div>

        <div className="flex items-center gap-4">
          <Link
            to="/verify"
            className="hidden sm:inline-flex items-center px-4 py-2 rounded-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-md border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 hover:text-cyan-600 dark:hover:text-cyan-400 transition-all shadow-sm"
          >
            {t("verify_permit")}
          </Link>
          <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-md p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 pointer-events-auto flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* Hero Content */}
      <main className="relative z-10 flex-1 flex flex-col justify-center items-center text-center px-4 sm:px-6 lg:px-8 mt-[-80px]">
        <div className="animate-fade-in-up space-y-10 max-w-6xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-50/80 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300 text-xs font-bold uppercase tracking-widest shadow-sm border border-cyan-100 dark:border-cyan-800/50 backdrop-blur-sm hover:scale-105 transition-transform duration-300 cursor-default">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
            </span>
            <span>{t("intelligent_street_mgmt")}</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-8xl lg:text-9xl font-black text-slate-900 dark:text-white tracking-tighter leading-[0.9] select-none">
            {t("smart")}<br />
            <span className="bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500 bg-clip-text text-transparent">{t("street")}</span>
          </h1>

          <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed font-light tracking-wide">
            {t("landing_tagline")} <br className="hidden md:block" /> {t("landing_tagline_2")}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 w-full sm:w-auto px-4 sm:px-0">
            <Link
              to="/public"
              className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-bold text-lg shadow-xl shadow-cyan-600/20 hover:shadow-cyan-600/40 transition-all duration-300 transform hover:-translate-y-1"
            >
              {t("view_public_map")}
              <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-lg hover:border-cyan-500 dark:hover:border-cyan-500 hover:text-cyan-600 dark:hover:text-cyan-400 transition-all duration-300 block text-center"
            >
              {t("get_started")}
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 text-center text-slate-400 dark:text-slate-600 text-sm">
        {t("footer_copyright")}
      </footer>
    </div>
  );
}
