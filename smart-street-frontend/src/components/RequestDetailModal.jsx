import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon, CalendarIcon, MapPinIcon, ClockIcon, ClipboardDocumentListIcon, CheckCircleIcon, XCircleIcon, ArrowsPointingOutIcon } from "@heroicons/react/24/outline";
import { STATUS_COLORS, STATUS_LABELS } from "../utils/constants";

function StatusTimeline({ request, onView }) {
  const hasOwnerStep = request.space_id && request.owner_approved_by !== undefined;
  const status = request.status;

  const steps = [];

  // Step 1: Submitted
  steps.push({
    label: "Submitted",
    done: true,
    date: request.submitted_at,
    active: false,
    color: "bg-blue-500"
  });

  // Step 2: Owner Review (only for owner-space requests)
  if (hasOwnerStep || status === "OWNER_PENDING" || status === "OWNER_REJECTED") {
    const ownerDone = ["PENDING", "APPROVED", "REJECTED"].includes(status) && request.owner_approved_by;
    const ownerRejected = status === "OWNER_REJECTED";
    steps.push({
      label: ownerRejected ? "Owner Rejected" : ownerDone ? "Owner Approved" : "Owner Review",
      done: ownerDone || ownerRejected,
      date: request.owner_approved_at,
      active: status === "OWNER_PENDING",
      rejected: ownerRejected,
      color: ownerRejected ? "bg-red-500" : ownerDone ? "bg-emerald-500" : "bg-orange-400"
    });
  }

  // Step 3: Admin Review (skip if owner rejected)
  if (status !== "OWNER_REJECTED") {
    const adminDone = ["APPROVED", "REJECTED"].includes(status);
    steps.push({
      label: status === "REJECTED" ? "Admin Rejected" : adminDone ? "Admin Approved" : "Admin Review",
      done: adminDone,
      date: request.reviewed_at,
      active: status === "PENDING",
      rejected: status === "REJECTED",
      color: status === "REJECTED" ? "bg-red-500" : adminDone ? "bg-green-500" : "bg-yellow-400"
    });
  }

  // Step 4: Final (only if approved)
  if (status !== "OWNER_REJECTED") {
    steps.push({
      label: status === "APPROVED" ? "Permit Issued" : status === "REJECTED" ? "Rejected" : "Awaiting",
      done: status === "APPROVED" || status === "REJECTED",
      active: false,
      rejected: status === "REJECTED",
      color: status === "APPROVED" ? "bg-green-500" : status === "REJECTED" ? "bg-red-500" : "bg-slate-300 dark:bg-slate-600"
    });
  }

  return (
    <div className="space-y-0">
      <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-1 mb-4">
        <h4 className="text-base font-bold text-slate-900 dark:text-slate-200">
          Request Progress
        </h4>
        <button
          onClick={onView}
          className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all border border-blue-200 dark:border-blue-800 group"
        >
          <ArrowsPointingOutIcon className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
          View
        </button>
      </div>
      <div className="relative pl-6">
        {steps.map((step, idx) => (
          <div key={idx} className="relative pb-5 last:pb-0">
            {/* Vertical line */}
            {idx < steps.length - 1 && (
              <div className={`absolute left-[-16px] top-4 w-0.5 h-full ${step.done ? "bg-blue-300 dark:bg-blue-700" : "bg-slate-200 dark:bg-slate-700"}`} />
            )}
            {/* Dot */}
            <div className={`absolute left-[-20px] top-1 w-3 h-3 rounded-full border-2 transition-all ${step.done
              ? step.rejected ? "border-red-500 bg-red-500" : "border-blue-500 bg-blue-500"
              : step.active
                ? "border-orange-400 bg-orange-400 animate-pulse"
                : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
              }`} />
            {/* Content */}
            <div className="flex items-center justify-between gap-2">
              <span className={`text-sm font-semibold ${step.done
                ? step.rejected ? "text-red-600 dark:text-red-400" : "text-slate-800 dark:text-slate-200"
                : step.active
                  ? "text-orange-600 dark:text-orange-400"
                  : "text-slate-400 dark:text-slate-500"
                }`}>
                {step.done && !step.rejected && <CheckCircleIcon className="w-4 h-4 inline mr-1 text-green-500" />}
                {step.rejected && <XCircleIcon className="w-4 h-4 inline mr-1 text-red-500" />}
                {step.label}
              </span>
              {step.date && (
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  {new Date(step.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RequestDetailModal({ isOpen, onClose, request, onViewHighlight }) {
  if (!request) return null;

  const statusLabel = STATUS_LABELS[request.status] || request.status;
  const statusColorClass = STATUS_COLORS[request.status] || STATUS_COLORS.PENDING;

  const handleViewOnMap = () => {
    // Zoom in a bit more for specific permits
    const zoomLevel = 19;

    // Dispatch custom event for MapContainer to listen to
    window.dispatchEvent(new CustomEvent('centerMap', {
      detail: {
        lat: Number(request.lat),
        lng: Number(request.lng),
        zoom: zoomLevel
      }
    }));

    // Trigger highlighting in parent
    if (onViewHighlight) {
      onViewHighlight(request);
    }

    // Close the modal
    onClose();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[6000]" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-slate-900 p-6 text-left align-middle shadow-xl transition-all border border-slate-200 dark:border-slate-800">
                <div className="flex justify-between items-start mb-6">
                  <Dialog.Title
                    as="h3"
                    className="text-xl font-bold leading-6 text-slate-900 dark:text-white flex items-center gap-2"
                  >
                    <ClipboardDocumentListIcon className="w-6 h-6 text-blue-500" />
                    Request Details
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <XMarkIcon className="w-6 h-6 text-slate-500" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Status Banner */}
                  <div className={`p-4 rounded-xl border ${request.status === 'APPROVED' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' :
                    request.status === 'REJECTED' || request.status === 'OWNER_REJECTED' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' :
                      request.status === 'OWNER_PENDING' ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800' :
                        'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                    }`}>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Status</span>
                      <span className={`px-3 py-1 rounded-md text-sm font-bold ${statusColorClass}`}>
                        {statusLabel}
                      </span>
                    </div>
                    {request.remarks && (
                      <div className={`mt-3 pt-3 border-t ${request.status === 'REJECTED' || request.status === 'OWNER_REJECTED' ? 'border-red-200 dark:border-red-800/50' :
                        request.status === 'APPROVED' ? 'border-green-200 dark:border-green-800/50' :
                          'border-slate-200 dark:border-slate-700'
                        }`}>
                        <p className={`text-sm font-bold mb-1 ${request.status === 'REJECTED' || request.status === 'OWNER_REJECTED' ? 'text-red-600 dark:text-red-400' :
                          request.status === 'APPROVED' ? 'text-green-600 dark:text-green-400' :
                            'text-slate-600 dark:text-slate-400'
                          }`}>Remarks:</p>
                        <p className={`text-base ${request.status === 'REJECTED' || request.status === 'OWNER_REJECTED' ? 'text-red-700 dark:text-red-300' :
                          request.status === 'APPROVED' ? 'text-green-700 dark:text-green-300' :
                            'text-slate-700 dark:text-slate-300'
                          }`}>{request.remarks}</p>
                      </div>
                    )}
                  </div>

                  {/* Progress Timeline */}
                  <StatusTimeline request={request} onView={handleViewOnMap} />

                  {/* ID, Date & Price */}
                  <div className="grid grid-cols-2 gap-4 text-base">
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Request ID</p>
                      <p className="font-mono text-slate-900 dark:text-white text-base">#{request.request_id.slice(0, 8)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Submitted On</p>
                      <p className="text-slate-900 dark:text-white text-base">{new Date(request.submitted_at).toLocaleDateString()} {new Date(request.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    {request.total_price > 0 && (
                      <div className="col-span-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <p className="text-sm text-slate-500 dark:text-slate-400">Total Price</p>
                        <p className="text-2xl font-black text-blue-600 dark:text-blue-400">
                          <span className="text-base font-normal opacity-70">₹</span> {Number(request.total_price).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Location Info */}
                  <div className="space-y-3">
                    <h4 className="text-base font-bold text-slate-900 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-1">Location Info</h4>

                    <div className="flex items-start gap-3">
                      <MapPinIcon className="w-6 h-6 text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-base font-semibold text-slate-800 dark:text-slate-200">{request.space_name || "Custom Location"}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{request.address || `${Number(request.lat).toFixed(6)}, ${Number(request.lng).toFixed(6)}`}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pl-9">
                      <div>
                        <p className="text-sm text-slate-500">Requested Area</p>
                        <p className="text-base font-medium text-slate-700 dark:text-slate-300">
                          Radius: {Math.round(Math.sqrt((request.max_width**2 + request.max_length**2))/2)}m
                          <span className="block text-xs text-slate-400 font-normal">Approx Area: {Math.round(request.max_width * request.max_length)}m²</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Time Info */}
                  <div className="space-y-3">
                    <h4 className="text-base font-bold text-slate-900 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-1">Time & Duration</h4>

                    <div className="flex items-start gap-3">
                      <ClockIcon className="w-6 h-6 text-slate-400 mt-0.5" />
                      <div className="grid grid-cols-2 gap-x-8 gap-y-2 w-full">
                        <div>
                          <p className="text-sm text-slate-500">Starts</p>
                          <p className="text-base text-slate-700 dark:text-slate-300">{new Date(request.start_time).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-500">Ends</p>
                          <p className="text-base text-slate-700 dark:text-slate-300">{new Date(request.end_time).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

                <div className="mt-8 flex justify-end">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-xl border border-transparent bg-slate-100 dark:bg-slate-800 px-6 py-2.5 text-base font-medium text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 transition-colors"
                    onClick={onClose}
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
