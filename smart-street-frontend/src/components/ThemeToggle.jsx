import { SunIcon, MoonIcon } from "@heroicons/react/24/outline";
import { useTheme } from "../context/ThemeContext";

export default function ThemeToggle({ className = "" }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-full transition-all duration-300 ${
        theme === "dark" 
          ? "bg-slate-800 text-yellow-400 border border-slate-700 hover:bg-slate-700" 
          : "bg-orange-50 text-orange-500 border border-orange-200 hover:bg-orange-100"
      } ${className}`}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {theme === "dark" ? (
        <MoonIcon className="w-5 h-5" />
      ) : (
        <SunIcon className="w-5 h-5" />
      )}
    </button>
  );
}
