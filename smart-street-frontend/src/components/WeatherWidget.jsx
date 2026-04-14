import React, { useState, useEffect } from "react";
import { CloudIcon, SunIcon, BoltIcon, BeakerIcon } from "@heroicons/react/24/outline";

const API_KEY = "e029a2ffe3f2afd2e4d8527c9b753bf7";

export default function WeatherWidget() {
    const [weather, setWeather] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Get user location for weather
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    const res = await fetch(
                        `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`
                    );
                    const data = await res.json();
                    setWeather(data);
                } catch (err) {
                    console.error("Weather fetch failed", err);
                } finally {
                    setLoading(false);
                }
            },
            () => setLoading(false)
        );
    }, []);

    if (loading || !weather) return null;

    const temp = Math.round(weather.main?.temp);
    const condition = weather.weather?.[0]?.main;
    const rainChance = weather.rain ? "Rainy" : "Clear";

    return (
        <div className="absolute top-4 right-4 z-[2000] bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-xl border border-white/20 dark:border-slate-800 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-500">
            <div className="bg-blue-100 dark:bg-blue-900/50 p-2 rounded-xl">
                {condition === "Clear" ? (
                    <SunIcon className="w-6 h-6 text-orange-500" />
                ) : condition === "Rain" ? (
                    <BoltIcon className="w-6 h-6 text-blue-600" />
                ) : (
                    <CloudIcon className="w-6 h-6 text-slate-500" />
                )}
            </div>
            <div>
                <p className="text-xl font-black text-slate-800 dark:text-white leading-none">{temp}°C</p>
                <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-tighter mt-0.5">
                    {condition} • {rainChance}
                </p>
            </div>
        </div>
    );
}
