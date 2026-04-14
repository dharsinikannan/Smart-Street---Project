import { useEffect } from "react";
import { Transition } from "@headlessui/react";
import { CheckCircleIcon, ExclamationCircleIcon, InformationCircleIcon, XCircleIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useToast } from "../context/ToastContext.jsx";

const toastStyles = {
  success: {
    icon: CheckCircleIcon,
    bg: "bg-green-50",
    border: "border-green-200",
    iconColor: "text-green-400",
    textColor: "text-green-800"
  },
  error: {
    icon: XCircleIcon,
    bg: "bg-red-50",
    border: "border-red-200",
    iconColor: "text-red-400",
    textColor: "text-red-800"
  },
  warning: {
    icon: ExclamationCircleIcon,
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    iconColor: "text-yellow-400",
    textColor: "text-yellow-800"
  },
  info: {
    icon: InformationCircleIcon,
    bg: "bg-blue-50",
    border: "border-blue-200",
    iconColor: "text-blue-400",
    textColor: "text-blue-800"
  }
};

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-2">
      {toasts.map((toast) => {
        const style = toastStyles[toast.type] || toastStyles.info;
        const Icon = style.icon;

        return (
          <Transition
            key={toast.id}
            appear={true}
            show={true}
            enter="transition-all duration-300"
            enterFrom="opacity-0 translate-x-full"
            enterTo="opacity-100 translate-x-0"
            leave="transition-all duration-200"
            leaveFrom="opacity-100 translate-x-0"
            leaveTo="opacity-0 translate-x-full"
          >
            <div className={`w-full max-w-md ${style.bg} border ${style.border} rounded-xl p-5 shadow-xl transition-all duration-300 pointer-events-auto`}>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <Icon className={`h-6 w-6 ${style.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <p className={`text-base font-medium leading-relaxed ${style.textColor} break-words`}>
                    {toast.message}
                  </p>
                </div>
                <div className="flex-shrink-0 flex">
                  <button
                    onClick={() => removeToast(toast.id)}
                    className={`inline-flex rounded-lg p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${style.iconColor} hover:bg-black/5 transition-colors`}
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </Transition>
        );
      })}
    </div>
  );
}