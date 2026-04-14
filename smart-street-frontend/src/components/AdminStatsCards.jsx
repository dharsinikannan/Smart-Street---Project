import {
  UserGroupIcon,
  MapPinIcon,
  TicketIcon,
  ClockIcon
} from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import LoadingSpinner from "./LoadingSpinner";

export default function AdminStatsCards({ stats, loading }) {
  const { t } = useTranslation();
  if (loading) {
    return (
      <div className="flex justify-center items-center h-28 mb-6">
        <LoadingSpinner size="lg" color="black" />
      </div>
    );
  }

  if (!stats) return null;

  const cards = [
    {
      title: t("total_vendors"),
      value: stats.total_vendors,
      icon: UserGroupIcon,
      color: "bg-blue-500",
      bg: "bg-blue-50 dark:bg-blue-900/20",
      text: "text-blue-600 dark:text-blue-400"
    },
    {
      title: t("active_permits"),
      value: stats.active_permits,
      subValue: `/ ${stats.total_permits} ${t("total")}`,
      icon: TicketIcon,
      color: "bg-emerald-500",
      bg: "bg-emerald-50 dark:bg-emerald-900/20",
      text: "text-emerald-600 dark:text-emerald-400"
    },
    {
      title: t("owner_spaces"),
      value: stats.total_spaces,
      icon: MapPinIcon,
      color: "bg-purple-500",
      bg: "bg-purple-50 dark:bg-purple-900/20",
      text: "text-purple-600 dark:text-purple-400"
    },
    {
      title: t("pending_requests_label"),
      value: stats.pending_requests,
      icon: ClockIcon,
      color: "bg-amber-500",
      bg: "bg-amber-50 dark:bg-amber-900/20",
      text: "text-amber-600 dark:text-amber-400"
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
      {cards.map((card, idx) => (

        <div
          key={idx}
          className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 rounded-3xl p-6 lg:p-8 shadow-sm hover:-translate-y-2 hover:shadow-2xl hover:shadow-cyan-900/10 dark:hover:shadow-cyan-500/10 transition-all duration-300 group relative overflow-hidden"
        >
          {/* Subtle Gloss Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
                {card.title}
              </p>
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-extrabold text-slate-900 dark:text-white">
                  {card.value}
                </span>
                {card.subValue && (
                  <span className="text-sm font-medium text-slate-400 transform translate-y-[-2px]">{card.subValue}</span>
                )}
              </div>
            </div>
            <div className={`p-4 rounded-xl bg-gradient-to-br ${card.bg} shadow-sm group-hover:scale-110 transition-transform duration-300`}>
              <card.icon className={`w-8 h-8 ${card.text}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
