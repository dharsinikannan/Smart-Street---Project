import React, { useState, useEffect, useRef } from "react";
import {
    PhotoIcon,
    ListBulletIcon,
    PlusIcon,
    TrashIcon,
    CheckCircleIcon,
    ShoppingBagIcon,
    ArrowUpTrayIcon,
    BuildingStorefrontIcon,
    ArrowLeftIcon
} from "@heroicons/react/24/outline";
import api from "../../services/api";
import LoadingSpinner from "../LoadingSpinner";
import { useToast } from "../../context/ToastContext";
import { useTranslation } from "react-i18next";

export default function VendorStorefront() {
    const { t } = useTranslation();
    const { success, error } = useToast();
    
    const [storefronts, setStorefronts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [viewMode, setViewMode] = useState("list"); // "list", "edit", "add"
    const [activeVendorId, setActiveVendorId] = useState(null);

    // Form state
    const [businessName, setBusinessName] = useState("");
    const [category, setCategory] = useState("Food");
    const [licenseNumber, setLicenseNumber] = useState("");
    const [stallPhoto, setStallPhoto] = useState("");
    const [menuItems, setMenuItems] = useState([]);
    const [isActive, setIsActive] = useState(false);
    const [operatingHours, setOperatingHours] = useState("");
    const [newItemName, setNewItemName] = useState("");
    const [newItemPrice, setNewItemPrice] = useState("");
    const [photoUploading, setPhotoUploading] = useState(false);

    const photoInputRef = useRef(null);

    useEffect(() => {
        fetchStorefronts();
    }, []);

    const fetchStorefronts = async () => {
        setLoading(true);
        try {
            const res = await api.get("/vendor/storefront");
            const data = res.data.storefront;
            setStorefronts(Array.isArray(data) ? data : data ? [data] : []);
        } catch (err) {
            error("Failed to load storefronts");
        } finally {
            setLoading(false);
        }
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            error("Please select an image file.");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            error("Image must be smaller than 5MB.");
            return;
        }

        setPhotoUploading(true);
        const reader = new FileReader();
        reader.onload = (ev) => {
            setStallPhoto(ev.target.result);
            setPhotoUploading(false);
        };
        reader.onerror = () => {
            error("Failed to read image file.");
            setPhotoUploading(false);
        };
        reader.readAsDataURL(file);
    };

    const handleAddItem = (e) => {
        e.preventDefault();
        if (!newItemName || !newItemPrice) return;
        setMenuItems([...menuItems, { name: newItemName, price: newItemPrice }]);
        setNewItemName("");
        setNewItemPrice("");
    };

    const handleRemoveItem = (index) => {
        setMenuItems(menuItems.filter((_, i) => i !== index));
    };

    const openEdit = (sf) => {
        setActiveVendorId(sf.vendor_id);
        setBusinessName(sf.business_name || "");
        setCategory(sf.category || "Food");
        setLicenseNumber(sf.license_number || "");
        setStallPhoto(sf.stall_photo || "");
        setMenuItems(sf.menu_items || []);
        setIsActive(sf.is_active || false);
        setOperatingHours(sf.operating_hours?.text || "");
        setViewMode("edit");
    };

    const openAdd = () => {
        setActiveVendorId(null);
        setBusinessName("");
        setCategory("Food");
        setLicenseNumber("");
        setStallPhoto("");
        setMenuItems([]);
        setIsActive(false);
        setOperatingHours("");
        setViewMode("add");
    };

    const handleSaveEdit = async () => {
        setSaving(true);
        try {
            await api.put("/vendor/storefront", {
                vendorId: activeVendorId,
                data: {
                    businessName,
                    category,
                    stallPhoto,
                    menuItems,
                    isActive,
                    operatingHours: { text: operatingHours }
                }
            });
            success(t("storefront_updated"));
            fetchStorefronts();
            setViewMode("list");
        } catch (err) {
            error(t("failed_save"));
        } finally {
            setSaving(false);
        }
    };

    const handleSaveAdd = async () => {
        setSaving(true);
        try {
            await api.post("/vendor/storefront", {
                businessName,
                category,
                licenseNumber
            });
            success("New storefront created! You can now edit its details.");
            fetchStorefronts();
            setViewMode("list");
        } catch (err) {
            error(err.response?.data?.message || t("failed_save"));
        } finally {
            setSaving(false);
        }
    };

    // ------------- RENDER LIIST -------------
    if (viewMode === "list") {
        if (loading) return (
            <div className="flex flex-col items-center justify-center min-h-[400px] p-8 space-y-4">
                <LoadingSpinner size="xl" className="text-blue-600" />
                <p className="text-slate-500 font-medium animate-pulse">{t("loading_storefront")}</p>
            </div>
        );

        return (
            <div className="p-4 sm:p-6 md:p-10 max-w-5xl mx-auto space-y-8 pb-32">
                <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">My Storefronts</h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm sm:text-base">Manage your businesses and their appearances.</p>
                    </div>
                    <button
                        onClick={openAdd}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-lg hover:shadow-blue-200"
                    >
                        <PlusIcon className="w-5 h-5" />
                        Add New Storefront
                    </button>
                </header>

                {storefronts.length === 0 ? (
                    <div className="text-center py-20 px-4 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                        <BuildingStorefrontIcon className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                        <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">No Storefronts Yet</h3>
                        <p className="text-slate-500 mt-2">Create your first public business profile to get started.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {storefronts.map((sf) => (
                            <div
                                key={sf.vendor_id}
                                onClick={() => openEdit(sf)}
                                className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl p-5 shadow-sm hover:shadow-xl hover:border-blue-300 dark:hover:border-blue-600 transition-all cursor-pointer flex flex-col items-center text-center space-y-4"
                            >
                                <div className="w-20 h-20 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border-4 border-white dark:border-slate-900 shadow-md flex items-center justify-center shrink-0">
                                    {sf.stall_photo ? (
                                        <img src={sf.stall_photo} alt={sf.business_name} className="w-full h-full object-cover" />
                                    ) : (
                                        <BuildingStorefrontIcon className="w-10 h-10 text-slate-300" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{sf.business_name}</h3>
                                    <p className="text-sm font-medium text-slate-500 uppercase tracking-widest mt-1">{sf.category}</p>
                                </div>
                                <div className="mt-auto pt-4 flex gap-2">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${sf.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                                        {sf.is_active ? 'Live Now' : 'Offline'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // ------------- RENDER EDIT / ADD -------------
    return (
        <div className="p-4 sm:p-6 md:p-10 max-w-4xl mx-auto space-y-8 sm:space-y-10 pb-32">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6 sm:pb-8">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => setViewMode("list")}
                        className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition"
                    >
                        <ArrowLeftIcon className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                            {viewMode === "edit" ? "Edit Storefront" : "Create Storefront"}
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm sm:text-base">
                            {viewMode === "edit" ? t("manage_stall_appearance") : "Register the foundational details of your public shop."}
                        </p>
                    </div>
                </div>

                {/* Save Button relocated to top right area */}
                <button
                    onClick={viewMode === "edit" ? handleSaveEdit : handleSaveAdd}
                    disabled={saving}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold shadow-lg transition-all ${
                        saving 
                            ? "bg-slate-200 text-slate-400 cursor-wait shadow-none" 
                            : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-blue-200 max-w-full truncate"
                    }`}
                >
                    {saving ? (
                        <>
                            <LoadingSpinner size="sm" color="white" />
                            Saving...
                        </>
                    ) : (
                        viewMode === "edit" ? "Save Changes" : "Create Store"
                    )}
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10">
                {/* Basic Info */}
                <section className="space-y-5 sm:space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <ShoppingBagIcon className="w-5 h-5 text-blue-500" />
                            {t("stall_identity")}
                        </h2>
                        {/* Live Now Toggle (only in Edit) */}
                        {viewMode === "edit" && (
                            <div className="flex items-center gap-2 sm:gap-3 bg-slate-100 dark:bg-slate-800 px-3 sm:px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-700">
                                 <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-green-500' : 'text-slate-400'}`}>
                                   {isActive ? 'Live Now' : 'Offline'}
                                 </span>
                                 <button
                                    onClick={() => setIsActive(!isActive)}
                                    className={`w-12 h-6 rounded-full transition-all duration-300 relative ${isActive ? 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.4)]' : 'bg-slate-300 dark:bg-slate-600'}`}
                                 >
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${isActive ? 'left-7' : 'left-1'}`} />
                                 </button>
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-500 uppercase mb-2">{t("business_name_label")}</label>
                            <input
                                value={businessName}
                                onChange={e => setBusinessName(e.target.value)}
                                className="w-full text-[16px] md:text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                                placeholder={t("name_of_stall_placeholder")}
                            />
                        </div>

                        {viewMode === "add" && (
                            <div>
                                <label className="block text-sm font-bold text-slate-500 uppercase mb-2">License Number</label>
                                <input
                                    value={licenseNumber}
                                    onChange={e => setLicenseNumber(e.target.value)}
                                    className="w-full text-[16px] md:text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                                    placeholder="e.g., LIC-12345"
                                />
                            </div>
                        )}

                        {viewMode === "edit" && (
                            <div>
                                <label className="block text-sm font-bold text-slate-500 uppercase mb-2">{t("operating_hours") || "Operating Hours"}</label>
                                <input
                                    value={operatingHours}
                                    onChange={e => setOperatingHours(e.target.value)}
                                    className="w-full text-[16px] md:text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                                    placeholder="Monday - Friday: 9:00 AM - 6:00 PM"
                                />
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-bold text-slate-500 uppercase mb-2">{t("category_uppercase")}</label>
                            <select
                                value={category}
                                onChange={e => setCategory(e.target.value)}
                                className="w-full text-base md:text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                            >
                                <option value="Food">{t("street_food")}</option>
                                <option value="Beverage">{t("beverages")}</option>
                                <option value="Apparel">{t("apparel_textiles")}</option>
                                <option value="Accessory">{t("accessories")}</option>
                                <option value="Produce">{t("fresh_produce")}</option>
                                <option value="Other">{t("other")}</option>
                            </select>
                        </div>

                        {viewMode === "edit" && (
                            <>
                            {/* Stall Photo — File Attachment */}
                            <div>
                                <label className="block text-sm font-bold text-slate-500 uppercase mb-2">Stall Photo</label>
                                <input
                                    ref={photoInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handlePhotoChange}
                                />
                                <button
                                    type="button"
                                    onClick={() => photoInputRef.current?.click()}
                                    disabled={photoUploading}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all text-slate-600 dark:text-slate-400 font-semibold text-sm disabled:opacity-60 cursor-pointer"
                                >
                                    {photoUploading ? (
                                        <>
                                            <LoadingSpinner size="xs" className="text-blue-500" />
                                            <span>Reading image...</span>
                                        </>
                                    ) : (
                                        <>
                                            <ArrowUpTrayIcon className="w-4 h-4" />
                                            <span>{stallPhoto ? "Change Photo" : "Select Photo from Device"}</span>
                                        </>
                                    )}
                                </button>
                                {stallPhoto && (
                                    <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-medium flex items-center gap-1">
                                        <CheckCircleIcon className="w-3.5 h-3.5" />
                                        Photo selected
                                    </p>
                                )}
                            </div>
                            </>
                        )}
                    </div>

                    {viewMode === "edit" && (
                        <div className="aspect-video bg-slate-100 dark:bg-slate-800 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center overflow-hidden mt-6">
                            {stallPhoto ? (
                                <img src={stallPhoto} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <>
                                    <PhotoIcon className="w-12 h-12 text-slate-300 mb-2" />
                                    <p className="text-xs text-slate-400">{t("photo_preview")}</p>
                                </>
                            )}
                        </div>
                    )}
                </section>

                {/* Menu Items (Only in Edit Mode) */}
                {viewMode === "edit" && (
                    <section className="space-y-5 sm:space-y-6">
                        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <ListBulletIcon className="w-5 h-5 text-blue-500" />
                            {t("menu_items_list")}
                        </h2>

                        <form onSubmit={handleAddItem} className="flex gap-2">
                            <input
                                value={newItemName}
                                onChange={e => setNewItemName(e.target.value)}
                                className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-[16px] md:text-sm outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder={t("item_name")}
                            />
                            <input
                                value={newItemPrice}
                                onChange={e => setNewItemPrice(e.target.value)}
                                className="w-20 sm:w-24 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-[16px] md:text-sm outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder={t("price_rupee")}
                            />
                            <button
                                type="submit"
                                className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 p-2 rounded-xl"
                            >
                                <PlusIcon className="w-5 h-5" />
                            </button>
                        </form>

                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden min-h-[200px] sm:min-h-[300px]">
                            {menuItems.length > 0 ? (
                                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {menuItems.map((item, idx) => (
                                        <div key={idx} className="p-4 flex items-center justify-between group">
                                            <div className="flex items-center gap-3">
                                                <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0" />
                                                <span className="font-medium text-slate-700 dark:text-slate-200 text-sm sm:text-base">{item.name}</span>
                                            </div>
                                            <div className="flex items-center gap-3 sm:gap-4">
                                                <span className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">₹{item.price}</span>
                                                <button
                                                    onClick={() => handleRemoveItem(idx)}
                                                    className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                                                >
                                                    <TrashIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 sm:p-12 text-center text-slate-400 italic text-sm">{t("no_items_listed")}</div>
                            )}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}
