import { useEffect, useRef, useState } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

// Free search with autocomplete using Photon (OSM-based, no API key needed).
// Fetches suggestions as you type; selecting flies to the location.
export default function MapSearchControl({
  placeholder = "Search places",
  onSelect, // optional callback (lat, lng)
  className = "",
  externalQuery = ""
}) {
  const map = useMap();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const debounceRef = useRef(null);
  const isSelected = useRef(false);

  useEffect(() => {
    if (externalQuery) setQuery(externalQuery);
  }, [externalQuery]);

  // Fetch suggestions with debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (isSelected.current) {
      isSelected.current = false;
      return;
    }
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      setError(null);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=geojson&q=${encodeURIComponent(query)}&limit=5`;
        const res = await fetch(url, { headers: { "Accept-Language": "en" } });
        const data = await res.json();
        const feats = data?.features || [];
        const mapped = feats.map(f => {
          const [lon, lat] = f.geometry?.coordinates || [];
          const props = f.properties || {};
          const label = props.display_name || props.name || "Unknown Location";
          return { lat, lon, label };
        }).filter(s => s.lat != null && s.lon != null && s.label);
        setSuggestions(mapped);
        if (mapped.length === 0) setError("No results");
      } catch (err) {
        setError("Search failed");
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const flyTo = (lat, lon, label) => {
    const latNum = Number(lat);
    const lonNum = Number(lon);
    map.flyTo([latNum, lonNum], 16, { duration: 0.8 });
    if (onSelect) onSelect(latNum, lonNum);
    isSelected.current = true;
    setQuery(label || query);
    setSuggestions([]);
  };

  const handleSubmit = e => {
    e.preventDefault();
    if (suggestions.length > 0) {
      const best = suggestions[0];
      flyTo(best.lat, best.lon, best.label);
    }
  };

  // Prevent clicks from propagating to map (Leaflet native method)
  const containerRef = useRef(null);
  useEffect(() => {
    if (containerRef.current) {
      L.DomEvent.disableClickPropagation(containerRef.current);
      L.DomEvent.disableScrollPropagation(containerRef.current);
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className={`z-[1000] ${className.includes('w-') ? '' : 'w-[280px] md:w-[400px]'} ${className}`}
    >
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl shadow-xl px-4 py-3"
      >
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full text-base font-medium px-2 py-1 bg-transparent dark:text-white focus:outline-none placeholder:text-slate-400"
        />
        <button
          type="submit"
          disabled={loading || !query}
          className="px-4 py-1.5 text-sm font-bold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-slate-300 shadow-sm transition-colors"
        >
          {loading ? "…" : "Go"}
        </button>
      </form>

      {suggestions.length > 0 && (
        <div className="mt-1 max-h-64 overflow-auto rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow">
          {suggestions.map((s, idx) => (
            <button
              key={`${s.label}-${idx}`}
              onClick={() => flyTo(s.lat, s.lon, s.label)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200"
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      {error && (
        <div className="mt-1 text-[11px] text-red-700 bg-red-50 border border-red-200 rounded px-2 py-1 shadow-sm">
          {error}
        </div>
      )}
    </div>
  );
}
