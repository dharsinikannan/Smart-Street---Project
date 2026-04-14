import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  EnvelopeIcon,
  KeyIcon,
  LockClosedIcon,
  BuildingStorefrontIcon,
  ArrowRightIcon
} from "@heroicons/react/24/outline";
import ThemeToggle from "../components/ThemeToggle.jsx";
import LanguageSwitcher from "../components/LanguageSwitcher.jsx";
import InteractiveParticles from "../components/InteractiveParticles.jsx";
import api from "../services/api.js";

const InputField = ({ label, icon: Icon, type = "text", value, onChange, placeholder, required = true, focused, onFocus, onBlur, ...props }) => (
  <div className="relative group mt-6 text-left">
    <label className={`absolute left-0 -top-6 text-xs font-bold uppercase tracking-wider transition-all duration-300 ${focused || value ? 'text-cyan-600 dark:text-cyan-400 opacity-100' : 'text-slate-500 dark:text-slate-400 opacity-0 translate-y-2'}`}>
      {label}
    </label>
    <div className="flex items-center gap-3 pb-2 border-b-2 border-slate-200 dark:border-slate-700 relative">
      {Icon && <Icon className={`w-6 h-6 transition-colors duration-300 ${focused ? 'text-cyan-500' : 'text-slate-400 dark:text-slate-500'}`} />}
      <input
        type={type}
        value={value}
        onChange={onChange}
        onFocus={onFocus}
        onBlur={onBlur}
        required={required}
        className="w-full bg-transparent text-lg text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none font-medium"
        placeholder={focused ? '' : placeholder}
        {...props}
      />
      <div className={`absolute bottom-[-2px] left-0 h-[2px] bg-gradient-to-r from-teal-500 to-cyan-500 transition-all duration-500 ease-out ${focused ? 'w-full' : 'w-0'}`} />
    </div>
  </div>
);

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  
  const [step, setStep] = useState(1); // 1: Email Request / Success, 2: New Password
  
  const [emailSent, setEmailSent] = useState(false);
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    const urlToken = searchParams.get("token");
    if (urlToken) {
      setToken(urlToken);
      setStep(2); // Automatically advance to the reset step if a token is present
    }
  }, [searchParams]);
  
  const [focusedField, setFocusedField] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  // Optional: For the demo to show the generated token specifically
  const [mockDemoToken, setMockDemoToken] = useState(null); 

  const handleRequestToken = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.post("/auth/forgot-password", { email });
      setSuccessMsg(res.data.message);
      // For demo, grab the token if it comes back
      if (res.data.demoToken) {
        setMockDemoToken(res.data.demoToken);
      }
      setEmailSent(true);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to request reset token.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.post("/auth/reset-password", { token, newPassword });
      setSuccessMsg(res.data.message);
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password. Token might be expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-[#0B1120] overflow-hidden flex flex-col transition-colors duration-300 font-sans text-center">
      {/* Particle Background */}
      <div className="absolute inset-0 z-0 text-left">
        <InteractiveParticles />
      </div>

      {/* Dark Mode Gradient Overlay */}
      <div className="absolute inset-0 z-0 pointer-events-none bg-gradient-to-b from-transparent via-transparent to-slate-50/50 dark:to-[#0B1120] dark:via-transparent dark:from-transparent opacity-80" />

      {/* Header / Nav */}
      <nav className="relative z-50 flex flex-col md:flex-row justify-between items-center p-6 md:px-12 gap-4">
        <Link to="/" className="flex items-center gap-2 group hover:opacity-80 transition-opacity">
          <div className="w-10 h-10 bg-gradient-to-tr from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <BuildingStorefrontIcon className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">{t("app_name")}</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link
            to="/login"
            className="hidden sm:inline-flex items-center px-4 py-2 rounded-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-md border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 hover:text-cyan-600 dark:hover:text-cyan-400 transition-all shadow-sm"
          >
            {t("sign_in")}
          </Link>
          <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-md p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 pointer-events-auto flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* Centered Form */}
      <main className="relative z-10 flex-1 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 mt-[-60px]">
        {/* Glassmorphic Container matching Landing Page style */}
        <div className="w-full max-w-md bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl rounded-3xl shadow-2xl shadow-cyan-900/5 border border-white/50 dark:border-slate-700/50 p-8 sm:p-10 animate-fade-in-up">
          
          <div className="space-y-3 mb-10 text-center">
            <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{t("reset_password") || "Reset Password"}</h2>
            <div className="text-sm text-slate-500 dark:text-slate-400 font-light">
              {t("remember_password") || "Remembered your password?"}{" "}
              <Link to="/login" className="text-cyan-600 dark:text-cyan-400 font-bold hover:underline tracking-tight transition-colors">
                {t("sign_in")}
              </Link>
            </div>
          </div>

          {step === 1 ? (
            emailSent ? (
              <div className="text-center space-y-6 animate-fade-in-up">
                <div className="mx-auto w-20 h-20 bg-green-50 dark:bg-green-500/10 text-green-500 rounded-[2rem] flex items-center justify-center mb-6 shadow-inner border border-green-100 dark:border-green-500/20">
                  <EnvelopeIcon className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">{t("check_your_mail")}</h3>
                <p className="text-slate-500 dark:text-slate-400 font-light">
                  {t("reset_link_sent_to")} <span className="font-bold text-slate-700 dark:text-slate-300">{email}</span>. {t("click_link_inside")}
                </p>
                {mockDemoToken && (
                  <div className="mt-4 p-4 bg-white dark:bg-slate-900 rounded-xl border border-green-200 dark:border-green-800 break-all font-mono text-xs text-left shadow-sm">
                    <span className="font-bold block mb-2 text-green-700 dark:text-green-500 uppercase tracking-widest text-[10px]">{t("demo_token_link")}</span>
                    <a href={`http://localhost:5173/forgot-password?token=${mockDemoToken}`} className="text-cyan-600 hover:underline">
                      http://localhost:5173/forgot-password?token={mockDemoToken}
                    </a>
                  </div>
                )}
                <div className="pt-6">
                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center w-full py-4 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold transition-all shadow-sm"
                  >
                    {t("return_to_login")}
                  </Link>
                </div>
              </div>
            ) : (
            <form className="space-y-8" onSubmit={handleRequestToken}>
               <InputField
                  label={t("email_address")} icon={EnvelopeIcon} value={email}
                  onChange={e => setEmail(e.target.value)}
                  onFocus={() => setFocusedField("email")} onBlur={() => setFocusedField(null)}
                  focused={focusedField === "email"} placeholder="john@example.com" type="email"
                />

              {error && (
                <div className="p-4 rounded-xl text-left bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-sm font-medium text-red-600 dark:text-red-400 flex items-center gap-3 shadow-sm animate-fade-in-up">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-bold text-lg shadow-xl shadow-cyan-600/20 hover:shadow-cyan-600/40 transition-all duration-300 transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {t("processing") || "Processing..."}
                  </div>
                ) : t("send_reset_link") || "Send Reset Token"}
              </button>
            </form>
            )
          ) : (
            <form className="space-y-8" onSubmit={handleResetPassword}>
              
              {successMsg && (
                 <div className="p-4 rounded-xl text-left bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 text-sm font-medium text-green-700 dark:text-green-400 flex flex-col gap-2 shadow-sm animate-fade-in-up">
                    <div className="flex items-center gap-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      {successMsg}
                    </div>
                    {mockDemoToken && (
                      <div className="mt-2 p-2 bg-white dark:bg-slate-900 rounded border border-green-200 dark:border-green-800 break-all font-mono text-xs">
                        <span className="font-bold block mb-1">Demo Token (COPY THIS):</span>
                        {mockDemoToken}
                      </div>
                    )}
                 </div>
              )}

               <InputField
                  label={t("new_password") || "New Password"} icon={LockClosedIcon} value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  onFocus={() => setFocusedField("newPassword")} onBlur={() => setFocusedField(null)}
                  focused={focusedField === "newPassword"} placeholder="••••••••" type="password" minLength={8}
                />

              {error && (
                <div className="p-4 rounded-xl text-left bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-sm font-medium text-red-600 dark:text-red-400 flex items-center gap-3 shadow-sm animate-fade-in-up">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-bold text-lg shadow-xl shadow-cyan-600/20 hover:shadow-cyan-600/40 transition-all duration-300 transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                     {t("processing") || "Processing..."}
                  </div>
                ) : t("update_password") || "Update Password"}
              </button>
            </form>
          )}

        </div>
        {/* Footer */}
        <p className="text-center text-sm text-slate-400 dark:text-slate-600 font-light mt-8">
          {t("footer_secure")}
        </p>
      </main>
    </div>
  );
}
