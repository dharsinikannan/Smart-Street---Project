import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const storedToken = localStorage.getItem("smartstreet_token");
    const storedUser = localStorage.getItem("smartstreet_user");
    if (storedToken && storedUser) {
      // Restore existing session from localStorage
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      setInitializing(false);
    } else {
      // No localStorage session — check if there's a valid remember-me cookie
      api
        .post("/auth/auto-login", {}, { withCredentials: true })
        .then(({ data }) => {
          // Cookie was valid — restore session silently
          persistSession(data.token, data.user);
        })
        .catch(() => {
          // No valid cookie, user must log in manually
        })
        .finally(() => setInitializing(false));
    }
  }, []);

  const persistSession = (nextToken, nextUser) => {
    setToken(nextToken);
    setUser(nextUser);
    localStorage.setItem("smartstreet_token", nextToken);
    localStorage.setItem("smartstreet_user", JSON.stringify(nextUser));
  };

  const clearSession = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("smartstreet_token");
    localStorage.removeItem("smartstreet_user");
  };

  const login = async ({ email, password, rememberMe = false }) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post(
        "/auth/login",
        { email, password, rememberMe },
        { withCredentials: true }  // Allow the HttpOnly cookie to be set
      );
      persistSession(data.token, data.user);
      return data.user;
    } catch (err) {
      setError(err.response?.data?.message || "Unable to login");
      throw err;
    } finally {
      setLoading(false);
    }
  };


  const register = async payload => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post("/auth/register", payload);
      persistSession(data.token, data.user);
      return data.user;
    } catch (err) {
      setError(err.response?.data?.message || "Unable to register");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateUserProfile = async (payload) => {
    setLoading(true);
    try {
      const { data } = await api.put("/auth/me", payload);
      // Update local user state
      const newUser = { ...user, ...data.user };
      setUser(newUser);
      localStorage.setItem("smartstreet_user", JSON.stringify(newUser));
      return newUser;
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const changeUserPassword = async (payload) => {
    setLoading(true);
    try {
      await api.put("/auth/me/password", payload);
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Revoke the remember-me token server-side and clear the HttpOnly cookie
      await api.post("/auth/logout", {}, { withCredentials: true });
    } catch (_) {
      // Ignore errors — still clear client session
    } finally {
      clearSession();
    }
  };

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const { data } = await api.get("/notifications");
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      setNotifications(prev =>
        prev.map(n => n.notification_id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      await api.put("/notifications/mark-all-read");
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
    }
  };

  const value = useMemo(
    () => ({
      user,
      token,
      initializing,
      loading,
      error,
      login,
      register,
      updateUserProfile,
      changeUserPassword,
      logout,
      notifications,
      unreadCount,
      fetchNotifications,
      markNotificationAsRead,
      markAllNotificationsAsRead
    }),
    [user, token, initializing, loading, error, notifications, unreadCount]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
};
