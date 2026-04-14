
import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useTranslation } from "react-i18next";
import { UserCircleIcon, ArrowRightOnRectangleIcon, ChevronDownIcon } from "@heroicons/react/24/outline";

export default function UserDropdown() {
    const { user, logout } = useAuth();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const storageKey = `profile_photo_${user?.userId || user?.user_id || user?.id}`;
    const [profilePhoto, setProfilePhoto] = useState(() => localStorage.getItem(storageKey));

    useEffect(() => {
        const handlePhotoChange = () => {
            setProfilePhoto(localStorage.getItem(storageKey));
        };
        window.addEventListener("profilePhotoChanged", handlePhotoChange);
        return () => window.removeEventListener("profilePhotoChanged", handlePhotoChange);
    }, [storageKey]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-1 rounded-lg"
            >
                <div className="flex flex-col items-end hidden md:flex">
                    <span className="font-bold text-sm md:text-base truncate max-w-[150px]">
                        {user?.name}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                        {user?.role?.toLowerCase()}
                    </span>
                </div>

                {/* User Avatar */}
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 ring-2 ring-transparent group-hover:ring-blue-500/50 transition-all overflow-hidden shrink-0">
                    {profilePhoto ? (
                        <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        <UserCircleIcon className="w-6 h-6 md:w-7 md:h-7" />
                    )}
                </div>

                <ChevronDownIcon className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
            </button>


            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 py-1 overflow-hidden z-[5000] animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                    <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 md:hidden">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user?.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{user?.role?.toLowerCase()}</p>
                    </div>

                    <div className="p-1">

                        <Link
                            to="/profile"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-3 px-3 py-2.5 text-base font-semibold text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                        >
                            <UserCircleIcon className="w-5 h-5 text-slate-400" />
                            {t("view_profile")}
                        </Link>

                        <button
                            onClick={() => {
                                setIsOpen(false);
                                logout();
                                navigate("/login");
                            }}

                            className="flex w-full items-center gap-3 px-3 py-2.5 text-base font-semibold text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors mt-1"
                        >
                            <ArrowRightOnRectangleIcon className="w-5 h-5" />
                            {t("logout")}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
