import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async (signal) => {
    // Skip if not logged in (no token)
    const token = localStorage.getItem("smartstreet_token");
    if (!token) return;

    try {
      setLoading(true);
      const { data } = await api.get("/notifications", { signal });
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      if (err.name !== "CanceledError" && err.code !== "ERR_CANCELED" && err.code !== "ECONNABORTED") {
         console.error("Failed to fetch notifications:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  // ... (keep other functions same)
  const markAsRead = async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      setNotifications(prev =>
        prev.map(n =>
          n.notification_id === notificationId ? { ...n, is_read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put("/notifications/mark-all-read");
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
    }
  };

  const addNotification = (notification) => {
    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchNotifications(controller.signal);
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
       fetchNotifications(); // Polling doesn't use the same controller to avoid killing the interval logic, or we can just let it be.
       // Ideally polling requests should be cancellable too but for now let's keep it simple.
    }, 30000);
    
    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, []);

  const value = {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    addNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return ctx;
};