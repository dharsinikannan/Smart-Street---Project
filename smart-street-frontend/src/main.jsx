import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import "./config/i18n"; // Initialize i18n
import { AuthProvider } from "./context/AuthContext.jsx";
import { ToastProvider } from "./context/ToastContext.jsx";
import { NotificationProvider } from "./context/NotificationContext.jsx";
import ToastContainer from "./components/ToastContainer.jsx";

import { ThemeProvider } from "./context/ThemeContext.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <NotificationProvider>
        <ToastProvider>
          <ThemeProvider>
            <App />
            <ToastContainer />
          </ThemeProvider>
        </ToastProvider>
      </NotificationProvider>
    </AuthProvider>
  </React.StrictMode>
);
