import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
  timeout: 15000, // 15 seconds
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem("smartstreet_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  response => response,
  error => {
    // If we get a 401 on a public route, we can treat it as a guest
    const isPublicRoute = error.config.url.includes("/public/");
    if (error.response?.status === 401 && isPublicRoute) {
      console.warn("[Auth Debug]: 401 on public route, proceeding as guest.");
      return Promise.resolve({ data: error.response.data || {} });
    }
    return Promise.reject(error);
  }
);

export default api;
