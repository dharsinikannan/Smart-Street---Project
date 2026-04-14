import { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { motion } from "framer-motion";
import {
  XMarkIcon,
  CheckCircleIcon,
  XCircleIcon,
  TicketIcon,
  BellIcon,
  InboxIcon,
  MapPinIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon
} from "@heroicons/react/24/outline";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../services/api";

const notificationIcons = {
  REQUEST_APPROVED: CheckCircleIcon,
  REQUEST_REJECTED: XCircleIcon,
  PERMIT_ISSUED: TicketIcon,
  PERMIT_REVOKED: XCircleIcon,
  NEW_VENDOR_REQUEST: InboxIcon,
  NEW_OWNER_SPACE: MapPinIcon,
  OWNER_SPACE_REQUEST: UserGroupIcon,
  OWNER_APPROVAL_GRANTED: ShieldCheckIcon,
  OWNER_APPROVAL_REJECTED: ShieldExclamationIcon
};

import { NOTIFICATION_STYLES } from "../utils/constants.js";

export default function NotificationModal({ isOpen, onClose, onNotificationClick }) {
  const {
    notifications,
    unreadCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    fetchNotifications
  } = useAuth();

  const [actionLoading, setActionLoading] = useState({});

  const handleMarkAsRead = async (notificationId) => {
    await markNotificationAsRead(notificationId);
  };

  const handleMarkAllAsRead = async () => {
    await markAllNotificationsAsRead();
  };

  const handleOwnerApprove = async (notification) => {
    const requestId = notification.related_request_id;
    if (!requestId) return;
    setActionLoading(prev => ({ ...prev, [notification.notification_id]: "approving" }));
    try {
      await api.post(`/owner/requests/${requestId}/approve`);
      await markNotificationAsRead(notification.notification_id);
      await fetchNotifications();
    } catch (err) {
      console.error("Failed to approve:", err);
      alert(err.response?.data?.message || "Failed to approve request");
    } finally {
      setActionLoading(prev => ({ ...prev, [notification.notification_id]: null }));
    }
  };

  const handleOwnerReject = async (notification) => {
    const requestId = notification.related_request_id;
    if (!requestId) return;
    const remarks = prompt("Enter rejection reason (optional):");
    setActionLoading(prev => ({ ...prev, [notification.notification_id]: "rejecting" }));
    try {
      await api.post(`/owner/requests/${requestId}/reject`, { remarks });
      await markNotificationAsRead(notification.notification_id);
      await fetchNotifications();
    } catch (err) {
      console.error("Failed to reject:", err);
      alert(err.response?.data?.message || "Failed to reject request");
    } finally {
      setActionLoading(prev => ({ ...prev, [notification.notification_id]: null }));
    }
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
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" />
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
              <Dialog.Panel
                as={motion.div}
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="w-full max-w-md transform overflow-hidden rounded-3xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl p-6 text-left align-middle shadow-2xl border border-white/50 dark:border-slate-700/50"
              >
                <div className="flex items-center justify-between mb-4">
                  <Dialog.Title as="h3" className="text-lg font-semibold text-slate-900 dark:text-white">
                    Notifications
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="rounded-lg p-1 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                  </button>
                </div>

                {unreadCount > 0 && (
                  <div className="mb-4">
                    <button
                      onClick={handleMarkAllAsRead}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                    >
                      Mark all as read
                    </button>
                  </div>
                )}

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="text-center py-8">
                      <BellIcon className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                      <p className="text-sm text-slate-500 dark:text-slate-400">No notifications yet</p>
                    </div>
                  ) : (
                    notifications.map((notification) => {
                      const Icon = notificationIcons[notification.type] || BellIcon;
                      const colorClass = NOTIFICATION_STYLES[notification.type] || "text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800";
                      const isOwnerAction = notification.type === "OWNER_SPACE_REQUEST" && !notification.is_read;
                      const loading = actionLoading[notification.notification_id];

                      return (
                        <div
                          key={notification.notification_id}
                          onClick={() => {
                            if (notification.related_request_id && onNotificationClick) {
                              markNotificationAsRead(notification.notification_id);
                              onNotificationClick(notification);
                              onClose();
                            }
                          }}
                          className={`p-3 rounded-lg border ${notification.related_request_id && onNotificationClick ? "cursor-pointer hover:ring-2 hover:ring-blue-300 dark:hover:ring-blue-700 transition-all" : ""} ${notification.is_read ? "bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800" : "bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-900/30"
                            }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${colorClass}`}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-slate-900 dark:text-slate-200 mb-1">
                                {notification.title}
                              </p>
                              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                                {notification.message}
                              </p>

                              {/* Owner action buttons for OWNER_SPACE_REQUEST */}
                              {isOwnerAction && (
                                <div className="flex items-center gap-2 mt-2 mb-2">
                                  <button
                                    onClick={() => handleOwnerApprove(notification)}
                                    disabled={!!loading}
                                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                                  >
                                    <CheckCircleIcon className="h-3.5 w-3.5" />
                                    {loading === "approving" ? "Approving..." : "Approve"}
                                  </button>
                                  <button
                                    onClick={() => handleOwnerReject(notification)}
                                    disabled={!!loading}
                                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                                  >
                                    <XCircleIcon className="h-3.5 w-3.5" />
                                    {loading === "rejecting" ? "Rejecting..." : "Reject"}
                                  </button>
                                </div>
                              )}

                              <p className="text-xs text-slate-500 dark:text-slate-500">
                                {new Date(notification.created_at).toLocaleString()}
                              </p>
                            </div>
                            {!notification.is_read && !isOwnerAction && (
                              <button
                                onClick={() => handleMarkAsRead(notification.notification_id)}
                                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                              >
                                Mark read
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}