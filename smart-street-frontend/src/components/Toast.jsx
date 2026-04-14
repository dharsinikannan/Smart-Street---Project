import { useEffect } from "react";
import { CheckCircleIcon, ExclamationCircleIcon, XMarkIcon } from "@heroicons/react/24/outline";

const Toast = ({ message, type = "success", onClose, duration = 4000 }) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [onClose, duration]);

  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case "error":
        return <ExclamationCircleIcon className="w-5 h-5 text-red-500" />;
      case "info":
        return <ExclamationCircleIcon className="w-5 h-5 text-blue-500" />;
      default:
        return null;
    }
  };

  const getStyles = () => {
    switch (type) {
      case "success":
        return "bg-green-50 border-green-200 text-green-800";
      case "error":
        return "bg-red-50 border-red-200 text-red-800";
      case "info":
        return "bg-blue-50 border-blue-200 text-blue-800";
      default:
        return "bg-slate-50 border-slate-200 text-slate-800";
    }
  };

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-md p-4 rounded-lg border shadow-lg ${getStyles()}`}>
      <div className="flex items-start gap-3">
        {getIcon()}
        <div className="flex-1 text-sm">{message}</div>
        <button
          onClick={onClose}
          className="flex-shrink-0 p-1 rounded hover:bg-black/10"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Toast;