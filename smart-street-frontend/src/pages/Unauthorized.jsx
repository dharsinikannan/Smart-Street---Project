import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useTranslation } from "react-i18next";

export default function Unauthorized() {
  const { user } = useAuth();
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-lg bg-white shadow-lg rounded-xl p-8 space-y-4 text-center">
        <h1 className="text-2xl font-bold text-slate-900">{t("access_denied")}</h1>
        <p className="text-sm text-slate-600">
          {t("no_permission")} {user ? t("select_portal") : t("please_sign_in")}
        </p>
        <div className="flex flex-col gap-2">
          <Link className="text-blue-600 font-semibold hover:underline" to="/">
            {t("go_to_home")}
          </Link>
          {!user && (
            <Link className="text-blue-600 font-semibold hover:underline" to="/login">
              {t("sign_in")}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
