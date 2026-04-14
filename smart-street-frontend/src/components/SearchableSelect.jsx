import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronUpDownIcon, CheckIcon } from '@heroicons/react/24/outline';
import { createPortal } from 'react-dom';

export default function SearchableSelect({
    options = [],
    value,
    onChange,
    placeholder = "Select...",
    className = ""
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");
    const containerRef = useRef(null);
    const inputRef = useRef(null);
    const dropdownRef = useRef(null);
    const [dropdownStyle, setDropdownStyle] = useState({});

    // Initialize query with selected label
    useEffect(() => {
        const selected = options.find(o => o.value === value);
        if (selected) {
            setQuery(selected.label);
        } else {
            // Only clear if the current query doesn't match a partial type (we don't want to clear while typing)
            // But here we rely on the user typing updating the query state directly.
            // This effect runs when 'value' changes externally.
            if (!isOpen) setQuery("");
        }
    }, [value, options, isOpen]);

    // Handle clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target) &&
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target)
            ) {
                setIsOpen(false);
                // Reset query to selected value on close if no match was made
                const selected = options.find(o => o.value === value);
                if (selected) setQuery(selected.label);
                else setQuery("");
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [value, options, query]);

    // Calculate dropdown position and update on scroll/resize
    useEffect(() => {
        const updatePosition = () => {
            if (isOpen && containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                setDropdownStyle({
                    position: 'fixed',
                    top: `${rect.bottom + 4}px`,
                    left: `${rect.left}px`,
                    width: `${rect.width}px`,
                    maxHeight: '300px', // Taller max height
                });
            }
        };

        updatePosition();
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true); // Capture scroll events from any parent

        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }, [isOpen]);

    // Filter options
    const filteredOptions = useMemo(() => {
        if (query === "") return options;
        // If the query matches the selected value exactly, show all (so we can change it)
        const selected = options.find(o => o.value === value);
        if (selected && selected.label === query) return options;

        return options.filter((option) =>
            option.label.toLowerCase().includes(query.toLowerCase())
        );
    }, [options, query, value]);

    const handleSelect = (option) => {
        onChange(option.value);
        setQuery(option.label);
        setIsOpen(false);
    };

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <div className="relative group">
                <input
                    ref={inputRef}
                    type="text"
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-3 pl-3 pr-10 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-lg shadow-sm text-slate-900 dark:text-white placeholder-slate-400 transition-shadow"
                    placeholder={placeholder}
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    onClick={() => setIsOpen(true)}
                />
                <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsOpen(!isOpen);
                        inputRef.current?.focus();
                    }}
                >
                    <ChevronUpDownIcon className="h-5 w-5" aria-hidden="true" />
                </button>
            </div>

            {/* Render dropdown in Portal to escape overflowing containers */}
            {isOpen && createPortal(
                <div
                    ref={dropdownRef}
                    className="z-[9999] bg-white dark:bg-slate-800 shadow-2xl rounded-lg py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm animate-fadeIn border border-slate-100 dark:border-slate-700"
                    style={dropdownStyle}
                >
                    {filteredOptions.length === 0 ? (
                        <div className="cursor-default select-none relative py-3 px-4 text-slate-500 italic text-center">
                            No results found.
                        </div>
                    ) : (
                        filteredOptions.map((option) => (
                            <div
                                key={option.value}
                                className={`cursor-pointer select-none relative py-3 pl-3 pr-9 border-b border-slate-50 dark:border-slate-800 last:border-0 transition-colors ${option.value === value
                                        ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-900 dark:text-blue-100'
                                        : 'text-slate-900 dark:text-gray-100 hover:bg-slate-100 dark:hover:bg-slate-700'
                                    }`}
                                onClick={() => handleSelect(option)}
                            >
                                <span className={`block truncate ${option.value === value ? 'font-semibold' : 'font-normal'}`}>
                                    {option.label}
                                </span>

                                {option.value === value ? (
                                    <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-blue-600 dark:text-blue-400">
                                        <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                    </span>
                                ) : null}
                            </div>
                        ))
                    )}
                </div>,
                document.body
            )}
        </div>
    );
}
