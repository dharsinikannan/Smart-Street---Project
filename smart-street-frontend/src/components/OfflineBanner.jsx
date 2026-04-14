import { useState, useEffect } from "react";
import { WifiIcon } from "@heroicons/react/24/outline";

export default function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="bg-amber-500 text-white text-xs font-bold text-center py-2 fixed top-0 left-0 w-full z-[9999] shadow-md flex justify-center items-center gap-2 animate-slide-down">
      <WifiIcon className="w-4 h-4" />
      <span>You are currently offline. Local maps cached.</span>
    </div>
  );
}
