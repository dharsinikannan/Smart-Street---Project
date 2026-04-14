import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useTranslation } from "react-i18next";
import { UserCircleIcon, LockClosedIcon, BuildingStorefrontIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import ThemeToggle from "../components/ThemeToggle.jsx";
import LanguageSwitcher from "../components/LanguageSwitcher.jsx";
import InteractiveParticles from "../components/InteractiveParticles.jsx";

export default function Login() {
  const navigate = useNavigate();
  const { login, loading, error } = useAuth();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const user = await login({ email, password, rememberMe });
      if (user.role === "VENDOR") navigate("/vendor");
      else if (user.role === "OWNER") navigate("/owner");
      else if (user.role === "ADMIN") navigate("/admin");
      else navigate("/public");
    } catch (err) {
      // error handled via context state
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-white dark:bg-[#0B1120] font-sans text-base">
      {/* Left Panel - Branding/Visual — hidden on mobile, shows on lg+ */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-slate-900 flex-col justify-between p-12 lg:p-16">
        <div className="absolute inset-0 z-0">
          <InteractiveParticles />
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-cyan-900/80 pointer-events-none z-0" />
        
        <div className="relative z-10 flex items-center gap-3">
           <div className="w-12 h-12 bg-gradient-to-tr from-teal-400 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/30">
            <BuildingStorefrontIcon className="w-7 h-7 text-white" />
           </div>
           <span className="text-2xl font-black text-white tracking-tight">{t("app_name")}</span>
        </div>
        
        <div className="relative z-10 max-w-lg mb-20 animate-fade-in-up">
          <h1 className="text-5xl lg:text-6xl font-black text-white leading-[1.1] mb-6 tracking-tight">
            {t("landing_tagline")}
          </h1>
          <p className="text-xl text-cyan-50/80 font-medium leading-relaxed">
            {t("landing_tagline_2")}
          </p>
        </div>
        
        <div className="relative z-10 text-cyan-100/40 text-sm font-medium">
          {t("footer_copyright")}
        </div>
      </div>

      {/* Right Panel - Form: full width on mobile, half on desktop */}
      <div className="w-full lg:w-1/2 flex flex-col min-h-screen lg:h-screen bg-white dark:bg-[#0B1120]">

        {/* 1. Navbar — relative (in-flow), pushes content down naturally */}
        <nav className="w-full flex justify-between items-center px-4 sm:px-6 py-4 sm:py-5 gap-4 z-50 lg:justify-end border-b border-slate-100 dark:border-slate-800/60">
          <Link to="/" className="flex items-center gap-2 lg:hidden">
            <div className="w-9 h-9 bg-gradient-to-tr from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-md shadow-cyan-500/20">
              <BuildingStorefrontIcon className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-black text-slate-900 dark:text-white tracking-tight">{t("app_name")}</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3 ml-auto">
            <Link
              to="/register"
              className="inline-flex items-center px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-cyan-600 dark:hover:text-cyan-400 transition-all shadow-sm active:scale-95 touch-manipulation"
            >
              {t("sign_up")}
            </Link>
            <div className="bg-white dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-2 shadow-sm">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
          </div>
        </nav>

        {/* 2. Centering section — flex-1 grows to fill all space between nav and footer */}
        <section className="flex-1 flex flex-col justify-center items-center px-4 py-8">
          {/* Card — full-width on mobile, capped at md on desktop. No mt- or top- */}
          <div className="w-full max-w-md animate-fade-in-up">

            <div className="space-y-2 mb-8 sm:mb-12">
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{t("sign_in")}</h2>
              <div className="text-sm sm:text-base text-slate-500 dark:text-slate-400 font-medium">
                {t("no_account")}{" "}
                <Link to="/register" className="text-cyan-600 dark:text-cyan-400 font-bold hover:underline tracking-tight transition-colors">
                  {t("sign_up")}
                </Link>
              </div>
            </div>

            <form className="space-y-8" onSubmit={handleSubmit}>
              {/* Email Field */}
              <div className="relative group">
                <label className={`absolute left-0 -top-6 text-xs font-bold uppercase tracking-wider transition-all duration-300 ${focusedField === 'email' || email ? 'text-cyan-600 dark:text-cyan-400 opacity-100' : 'text-slate-500 dark:text-slate-400 opacity-0 translate-y-2'}`}>
                  {t("email_address")}
                </label>
                <div className="flex items-center gap-4 pb-3 border-b-2 border-slate-200 dark:border-slate-700/80 relative">
                  <UserCircleIcon className={`w-6 h-6 flex-shrink-0 transition-colors duration-300 ${focusedField === 'email' ? 'text-cyan-500' : 'text-slate-400 dark:text-slate-500'}`} />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    required
                    autoComplete="email"
                    inputMode="email"
                    className="w-full h-12 bg-transparent text-base sm:text-lg text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none font-semibold"
                    placeholder={focusedField === 'email' ? '' : t("email_address")}
                  />
                  <div className={`absolute bottom-[-2px] left-0 h-[2px] bg-gradient-to-r from-teal-500 to-cyan-500 transition-all duration-500 ease-out ${focusedField === 'email' ? 'w-full' : 'w-0'}`} />
                </div>
              </div>

              {/* Password Field */}
              <div className="relative group pt-2">
                <label className={`absolute left-0 -top-4 text-xs font-bold uppercase tracking-wider transition-all duration-300 ${focusedField === 'password' || password ? 'text-cyan-600 dark:text-cyan-400 opacity-100' : 'text-slate-500 dark:text-slate-400 opacity-0 translate-y-2'}`}>
                  {t("password")}
                </label>
                <div className="flex items-center gap-4 pb-3 border-b-2 border-slate-200 dark:border-slate-700/80 relative">
                  <LockClosedIcon className={`w-6 h-6 flex-shrink-0 transition-colors duration-300 ${focusedField === 'password' ? 'text-cyan-500' : 'text-slate-400 dark:text-slate-500'}`} />
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    minLength={8}
                    required
                    autoComplete="current-password"
                    className="w-full h-12 bg-transparent text-base sm:text-lg text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none font-semibold tracking-wide"
                    placeholder={focusedField === 'password' ? '' : "••••••••"}
                  />
                  <div className={`absolute bottom-[-2px] left-0 h-[2px] bg-gradient-to-r from-teal-500 to-cyan-500 transition-all duration-500 ease-out ${focusedField === 'password' ? 'w-full' : 'w-0'}`} />
                </div>
              </div>

              <div className="flex items-center justify-between text-sm font-semibold mt-2">
                <label className="flex items-center gap-2.5 cursor-pointer text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="w-5 h-5 rounded border-slate-300 text-cyan-500 focus:ring-cyan-500 dark:border-slate-600 dark:bg-slate-800 focus:ring-offset-0 transition-all cursor-pointer"
                  />
                  {t("remember_me")}
                </label>
                <Link to="/forgot-password" className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 transition-colors hover:underline py-1">
                  {t("forgot_password")}
                </Link>
              </div>

              {error && (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 text-sm font-semibold text-red-600 dark:text-red-400 flex items-center gap-3 shadow-sm animate-fade-in-up">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 shrink-0">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-2xl bg-slate-900 dark:bg-cyan-600 hover:bg-slate-800 dark:hover:bg-cyan-500 text-white font-bold text-base sm:text-lg shadow-xl shadow-slate-900/20 dark:shadow-cyan-900/30 transition-all duration-300 hover:-translate-y-1 active:scale-95 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 mt-6 flex items-center justify-center gap-2 group touch-manipulation"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    {t("sign_in")}
                    <ArrowRightIcon className="w-5 h-5 opacity-70 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

          </div>
        </section>

        {/* 3. Footer — mt-auto pins it to the bottom */}
        <footer className="mt-auto py-6 text-center text-xs sm:text-sm text-slate-400 dark:text-slate-500 font-medium lg:hidden border-t border-slate-100 dark:border-slate-800">
          {t("footer_secure")}
        </footer>

      </div>
    </div>
  );
}
