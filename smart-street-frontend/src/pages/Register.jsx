import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useTranslation } from "react-i18next";
import {
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  LockClosedIcon,
  BuildingStorefrontIcon,
  IdentificationIcon,
  KeyIcon,
  BriefcaseIcon,
  ArrowRightIcon
} from "@heroicons/react/24/outline";
import ThemeToggle from "../components/ThemeToggle.jsx";
import LanguageSwitcher from "../components/LanguageSwitcher.jsx";
import InteractiveParticles from "../components/InteractiveParticles.jsx";

const InputField = ({ label, icon: Icon, type = "text", value, onChange, placeholder, required = true, focused, onFocus, onBlur, ...props }) => (
  <div className="relative group mt-5">
    <label className={`absolute left-0 -top-5 text-[11px] font-bold uppercase tracking-wider transition-all duration-300 ${focused || value ? 'text-cyan-600 dark:text-cyan-400 opacity-100' : 'text-slate-500 dark:text-slate-400 opacity-0 translate-y-2'}`}>
      {label}
    </label>
    <div className="flex items-center gap-3 pb-2.5 border-b-2 border-slate-200 dark:border-slate-700/80 relative">
      {Icon && <Icon className={`w-5 h-5 transition-colors duration-300 ${focused ? 'text-cyan-500' : 'text-slate-400 dark:text-slate-500'}`} />}
      <input
        type={type}
        value={value}
        onChange={onChange}
        onFocus={onFocus}
        onBlur={onBlur}
        required={required}
        className="w-full bg-transparent text-base text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none font-semibold"
        placeholder={focused ? '' : placeholder}
        {...props}
      />
      <div className={`absolute bottom-[-2px] left-0 h-[2px] bg-gradient-to-r from-teal-500 to-cyan-500 transition-all duration-500 ease-out ${focused ? 'w-full' : 'w-0'}`} />
    </div>
  </div>
);

export default function Register() {
  const navigate = useNavigate();
  const { register, loading, error } = useAuth();
  const { t } = useTranslation();
  const [activeRole, setActiveRole] = useState("USER");
  const [focusedField, setFocusedField] = useState(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "USER",
    businessName: "",
    category: "",
    licenseNumber: "",
    ownerName: "",
    contactInfo: "",
    adminCode: ""
  });

  const updateField = (field, value) =>
    setForm(prev => ({
      ...prev,
      [field]: value
    }));

  const handleRoleChange = (role) => {
    setActiveRole(role);
    updateField("role", role);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const user = await register(form);
      if (user.role === "VENDOR") navigate("/vendor");
      else if (user.role === "OWNER") navigate("/owner");
      else if (user.role === "ADMIN") navigate("/admin");
      else navigate("/public");
    } catch (err) {
      // context handles error state
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-white dark:bg-[#0B1120] font-sans">
      
      {/* Left Panel - Branding/Visual */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-1/2 relative overflow-hidden bg-slate-900 flex-col justify-between p-12 lg:p-16">
        <div className="absolute inset-0 z-0">
          <InteractiveParticles />
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-teal-900/80 pointer-events-none z-0" />
        
        <div className="relative z-10 flex items-center gap-3">
           <div className="w-12 h-12 bg-gradient-to-tr from-teal-400 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/30">
            <BuildingStorefrontIcon className="w-7 h-7 text-white" />
           </div>
           <span className="text-2xl font-black text-white tracking-tight">{t("app_name")}</span>
        </div>
        
        <div className="relative z-10 max-w-lg mb-20 animate-fade-in-up">
          <h1 className="text-5xl lg:text-6xl font-black text-white leading-[1.1] mb-6 tracking-tight">
            {t("join_smart_street")}
          </h1>
          <p className="text-xl text-teal-50/80 font-medium leading-relaxed">
            {t("landing_tagline_2")}
          </p>
        </div>
        
        <div className="relative z-10 text-teal-100/40 text-sm font-medium">
          {t("footer_copyright")}
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-7/12 xl:w-1/2 flex flex-col relative bg-slate-50/50 dark:bg-transparent overflow-y-auto">
        {/* Header / Nav */}
        <nav className="flex justify-between items-center p-6 gap-4 z-50 lg:justify-end shrink-0">
          <Link to="/" className="flex items-center gap-2 lg:hidden">
            <div className="w-10 h-10 bg-gradient-to-tr from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-md shadow-cyan-500/20">
              <BuildingStorefrontIcon className="w-6 h-6 text-white" />
            </div>
          </Link>
          <div className="flex items-center gap-3 ml-auto">
            <Link
              to="/login"
              className="hidden sm:inline-flex items-center px-5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-cyan-600 dark:hover:text-cyan-400 transition-all shadow-sm"
            >
              {t("sign_in")}
            </Link>
            <div className="bg-white dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-2 shadow-sm">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
          </div>
        </nav>

        {/* Form Container */}
        <div className="flex-1 flex flex-col justify-center px-6 py-8 lg:px-16 w-full max-w-2xl mx-auto z-10">
          <div className="w-full animate-fade-in-up">
            
            <div className="space-y-3 mb-10">
              <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{t("create_account")}</h2>
              <div className="text-base text-slate-500 dark:text-slate-400 font-medium">
                {t("have_account")}{" "}
                <Link to="/login" className="text-cyan-600 dark:text-cyan-400 font-bold hover:underline tracking-tight transition-colors">
                  {t("sign_in")}
                </Link>
              </div>
            </div>

            {/* Role Selection Tabs */}
            <div className="flex bg-white dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm mb-8 overflow-x-auto scrollbar-hide">
              {[
                { id: "USER", label: "Citizen", icon: UserIcon },
                { id: "VENDOR", label: t("vendor_role"), icon: BuildingStorefrontIcon },
                { id: "OWNER", label: t("space_owner_role"), icon: KeyIcon },
                { id: "ADMIN", label: t("admin_role"), icon: LockClosedIcon }
              ].map((role) => (
                <button
                  type="button"
                  key={role.id}
                  onClick={() => handleRoleChange(role.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 min-w-fit ${activeRole === role.id
                    ? "bg-slate-900 dark:bg-cyan-600 text-white shadow-md shadow-slate-900/10 dark:shadow-cyan-900/20"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                    }`}
                >
                  <role.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="whitespace-nowrap">{role.label}</span>
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                <InputField
                  label={t("full_name")} icon={UserIcon} value={form.name}
                  onChange={e => updateField("name", e.target.value)}
                  onFocus={() => setFocusedField("name")} onBlur={() => setFocusedField(null)}
                  focused={focusedField === "name"} placeholder="John Doe"
                />
                <InputField
                  label={t("phone_number")} icon={PhoneIcon} value={form.phone}
                  onChange={e => updateField("phone", e.target.value)}
                  onFocus={() => setFocusedField("phone")} onBlur={() => setFocusedField(null)}
                  focused={focusedField === "phone"} placeholder="+1 234 567 890" type="tel"
                />
                <InputField
                  label={t("email_address")} icon={EnvelopeIcon} value={form.email}
                  onChange={e => updateField("email", e.target.value)}
                  onFocus={() => setFocusedField("email")} onBlur={() => setFocusedField(null)}
                  focused={focusedField === "email"} placeholder="john@example.com" type="email"
                />
                <InputField
                  label={t("password")} icon={LockClosedIcon} value={form.password}
                  onChange={e => updateField("password", e.target.value)}
                  onFocus={() => setFocusedField("password")} onBlur={() => setFocusedField(null)}
                  focused={focusedField === "password"} placeholder="••••••••" type="password" minLength={8}
                />

                {/* Dynamic Fields */}
                {activeRole === "VENDOR" && (
                  <>
                    <InputField
                      label={t("business_name")} icon={BriefcaseIcon} value={form.businessName}
                      onChange={e => updateField("businessName", e.target.value)}
                      onFocus={() => setFocusedField("businessName")} onBlur={() => setFocusedField(null)}
                      focused={focusedField === "businessName"} placeholder="Business Name"
                    />
                    <InputField
                      label={t("category")} icon={BriefcaseIcon} value={form.category}
                      onChange={e => updateField("category", e.target.value)}
                      onFocus={() => setFocusedField("category")} onBlur={() => setFocusedField(null)}
                      focused={focusedField === "category"} placeholder="Category"
                    />
                    <div className="sm:col-span-2">
                      <InputField
                        label={t("license_number")} icon={IdentificationIcon} value={form.licenseNumber}
                        onChange={e => updateField("licenseNumber", e.target.value)}
                        onFocus={() => setFocusedField("licenseNumber")} onBlur={() => setFocusedField(null)}
                        focused={focusedField === "licenseNumber"} placeholder="License Number"
                      />
                    </div>
                  </>
                )}

                {activeRole === "OWNER" && (
                  <>
                    <InputField
                      label={t("owner_entity_name")} icon={UserIcon} value={form.ownerName}
                      onChange={e => updateField("ownerName", e.target.value)}
                      onFocus={() => setFocusedField("ownerName")} onBlur={() => setFocusedField(null)}
                      focused={focusedField === "ownerName"} placeholder="Entity Name"
                    />
                    <InputField
                      label={t("contact_info_public")} icon={PhoneIcon} value={form.contactInfo}
                      onChange={e => updateField("contactInfo", e.target.value)}
                      onFocus={() => setFocusedField("contactInfo")} onBlur={() => setFocusedField(null)}
                      focused={focusedField === "contactInfo"} placeholder="Public Help Line"
                    />
                  </>
                )}

                {activeRole === "ADMIN" && (
                  <div className="sm:col-span-2">
                    <InputField
                      label={t("admin_access_code")} icon={KeyIcon} value={form.adminCode}
                      onChange={e => updateField("adminCode", e.target.value)}
                      onFocus={() => setFocusedField("adminCode")} onBlur={() => setFocusedField(null)}
                      focused={focusedField === "adminCode"} placeholder="Access Code"
                    />
                  </div>
                )}
              </div>

              {error && (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 text-sm font-semibold text-red-600 dark:text-red-400 flex items-center gap-3 shadow-sm animate-fade-in-up mt-6">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 shrink-0">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-2xl bg-slate-900 dark:bg-cyan-600 hover:bg-slate-800 dark:hover:bg-cyan-500 text-white font-bold text-lg shadow-xl shadow-slate-900/20 dark:shadow-cyan-900/30 transition-all duration-300 transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 mt-8 flex items-center justify-center gap-2 group"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    {t("complete_registration")}
                    <ArrowRightIcon className="w-5 h-5 opacity-70 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

          </div>
          
          {/* Footer */}
          <div className="mt-8 lg:mt-auto pt-8 text-center text-sm text-slate-400 dark:text-slate-500 font-medium lg:hidden">
            {t("footer_secure")}
          </div>
        </div>
      </div>
    </div>
  );
}
