
import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useTranslation } from "react-i18next";
import { UserCircleIcon, ShieldCheckIcon, ArrowLeftIcon, CameraIcon } from "@heroicons/react/24/outline";
import LanguageSwitcher from "../components/LanguageSwitcher";

export default function Profile() {
    const { user, updateUserProfile, changeUserPassword } = useAuth();
    const { success: showSuccess, error: showError } = useToast();
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState("profile"); // profile, security

    // Profile photo state — persisted in localStorage per userId
    const storageKey = `profile_photo_${user?.userId}`;
    const [profilePhoto, setProfilePhoto] = useState(() => {
        return localStorage.getItem(storageKey) || null;
    });
    const photoInputRef = useRef(null);

    // Profile Form State
    const [profileForm, setProfileForm] = useState({
        name: user?.name || "",
    });

    // Password Form State
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    const [loading, setLoading] = useState(false);
    const [photoUploading, setPhotoUploading] = useState(false);

    const handlePhotoChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate type and size (max 5MB)
        if (!file.type.startsWith("image/")) {
            showError("Please select an image file.");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            showError("Image must be smaller than 5MB.");
            return;
        }

        setPhotoUploading(true);
        const reader = new FileReader();
        reader.onload = (ev) => {
            const dataUrl = ev.target.result;
            setProfilePhoto(dataUrl);
            localStorage.setItem(storageKey, dataUrl);
            window.dispatchEvent(new Event("profilePhotoChanged"));
            showSuccess("Profile photo updated!");
            setPhotoUploading(false);
        };
        reader.onerror = () => {
            showError("Failed to read image file.");
            setPhotoUploading(false);
        };
        reader.readAsDataURL(file);
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await updateUserProfile({ name: profileForm.name });
            showSuccess("Profile updated successfully");
        } catch (err) {
            showError(err.response?.data?.message || "Failed to update profile");
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            showError("New passwords do not match");
            return;
        }
        setLoading(true);
        try {
            await changeUserPassword({
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword,
            });
            showSuccess("Password changed successfully");
            setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        } catch (err) {
            showError(err.response?.data?.message || "Failed to change password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors duration-300">
            <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-4">
                <div className="max-w-4xl mx-auto flex items-center gap-3 sm:gap-4 flex-wrap">
                    <Link
                        to={user?.role === "ADMIN" ? "/admin" : user?.role === "OWNER" ? "/owner" : user?.role === "VENDOR" ? "/vendor" : "/"}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors shrink-0"
                    >
                        <ArrowLeftIcon className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600 dark:text-slate-400" />
                    </Link>

                    <h1 className="text-xl sm:text-3xl font-bold text-slate-900 dark:text-white">{t("account_settings")}</h1>
                    <div className="ml-auto">
                        <LanguageSwitcher />
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-4xl mx-auto w-full p-4 sm:p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
                    {/* Sidebar */}
                    <div className="space-y-4 sm:space-y-6">
                        <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                            <div className="flex flex-col items-center text-center">
                                {/* Profile Photo */}
                                <div className="relative w-20 h-20 sm:w-24 sm:h-24 mb-4">
                                    {profilePhoto ? (
                                        <img
                                            src={profilePhoto}
                                            alt="Profile"
                                            className="w-full h-full rounded-full object-cover border-4 border-blue-100 dark:border-blue-900/40 shadow-md"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400">
                                            <UserCircleIcon className="w-12 h-12 sm:w-14 sm:h-14" />
                                        </div>
                                    )}
                                    {/* Camera overlay button */}
                                    <button
                                        type="button"
                                        onClick={() => photoInputRef.current?.click()}
                                        disabled={photoUploading}
                                        title="Change profile photo"
                                        className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white p-1.5 rounded-full shadow-md transition-all active:scale-95 disabled:opacity-60"
                                    >
                                        <CameraIcon className="w-3.5 h-3.5" />
                                    </button>
                                    <input
                                        ref={photoInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handlePhotoChange}
                                    />
                                </div>
                                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">{user?.name}</h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{t("account_label", { role: user?.role })}</p>
                                <p className="text-xs text-slate-400 mt-1 break-all">{user?.email}</p>
                                <button
                                    type="button"
                                    onClick={() => photoInputRef.current?.click()}
                                    disabled={photoUploading}
                                    className="mt-3 text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline transition-colors disabled:opacity-50"
                                >
                                    {photoUploading ? "Uploading..." : "Change Photo"}
                                </button>
                            </div>
                        </div>

                        {/* Navigation — horizontal on mobile, vertical on md+ */}
                        <nav className="flex flex-row md:flex-col gap-2">
                            <button
                                onClick={() => setActiveTab("profile")}
                                className={`flex-1 md:flex-none flex items-center justify-center md:justify-start gap-2 sm:gap-3 px-3 sm:px-5 py-3 sm:py-4 rounded-xl font-semibold text-sm sm:text-lg transition-all ${activeTab === "profile"
                                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                                    : "text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-900 hover:shadow-sm"
                                    }`}
                            >
                                <UserCircleIcon className="w-5 h-5 shrink-0" />
                                <span className="hidden sm:inline">{t("edit_profile")}</span>
                                <span className="sm:hidden">Profile</span>
                            </button>
                            <button
                                onClick={() => setActiveTab("security")}
                                className={`flex-1 md:flex-none flex items-center justify-center md:justify-start gap-2 sm:gap-3 px-3 sm:px-5 py-3 sm:py-4 rounded-xl font-semibold text-sm sm:text-lg transition-all ${activeTab === "security"
                                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                                    : "text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-900 hover:shadow-sm"
                                    }`}
                            >
                                <ShieldCheckIcon className="w-5 h-5 shrink-0" />
                                <span className="hidden sm:inline">{t("security")}</span>
                                <span className="sm:hidden">Security</span>
                            </button>
                        </nav>
                    </div>

                    {/* Main Content */}
                    <div className="md:col-span-2">
                        {activeTab === "profile" && (
                            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 sm:p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-300">

                                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-4 sm:mb-6">{t("personal_details")}</h3>
                                <form onSubmit={handleProfileUpdate} className="space-y-5 sm:space-y-6">
                                    <div>
                                        <label className="block text-sm sm:text-base font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            {t("full_name")}
                                        </label>
                                        <input
                                            type="text"
                                            value={profileForm.name}
                                            onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                                            className="w-full px-4 sm:px-5 py-3 rounded-xl text-base sm:text-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                        <div>
                                            <label className="block text-sm sm:text-base font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                {t("email_address")}
                                            </label>
                                            <input
                                                type="email"
                                                value={user?.email || ""}
                                                disabled
                                                className="w-full px-4 sm:px-5 py-3 rounded-xl text-base sm:text-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 cursor-not-allowed"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm sm:text-base font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                {t("phone_number")}
                                            </label>
                                            <input
                                                type="tel"
                                                value={user?.phone || ""}
                                                disabled
                                                className="w-full px-4 sm:px-5 py-3 rounded-xl text-base sm:text-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 cursor-not-allowed"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-4 sm:pt-6 flex justify-end">
                                        <button
                                            type="submit"
                                            disabled={loading || profileForm.name === user?.name}
                                            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 sm:px-8 text-base sm:text-lg rounded-xl transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:shadow-none"
                                        >
                                            {loading ? t("saving") : t("save_changes")}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {activeTab === "security" && (
                            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 sm:p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-300">

                                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-4 sm:mb-6">{t("security_preferences")}</h3>
                                <form onSubmit={handlePasswordChange} className="space-y-5 sm:space-y-6">
                                    <div>
                                        <label className="block text-sm sm:text-base font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            {t("current_password")}
                                        </label>
                                        <input
                                            type="password"
                                            value={passwordForm.currentPassword}
                                            onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                            className="w-full px-4 sm:px-5 py-3 rounded-xl text-base sm:text-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                        <div>
                                            <label className="block text-sm sm:text-base font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                {t("new_password")}
                                            </label>
                                            <input
                                                type="password"
                                                value={passwordForm.newPassword}
                                                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                                className="w-full px-4 sm:px-5 py-3 rounded-xl text-base sm:text-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                required
                                                minLength={8}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm sm:text-base font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                {t("confirm_new_password")}
                                            </label>
                                            <input
                                                type="password"
                                                value={passwordForm.confirmPassword}
                                                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                                className="w-full px-4 sm:px-5 py-3 rounded-xl text-base sm:text-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                required
                                                minLength={8}
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-4 sm:pt-6 flex justify-end">
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 sm:px-8 text-base sm:text-lg rounded-xl transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:shadow-none"
                                        >
                                            {loading ? t("updating") : t("update_password")}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
