import { BellIcon } from "@heroicons/react/24/outline";
import { useAuth } from "../context/AuthContext.jsx";

export default function NotificationBell({ onClick }) {
  const { unreadCount } = useAuth();

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative rounded-full p-1 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
    >
      <span className="sr-only">View notifications</span>
      <BellIcon className="h-6 w-6" aria-hidden="true" />
      {unreadCount > 0 && (
        <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-red-600 ring-2 ring-white dark:ring-slate-900" />
      )}
    </button>
  );
}
