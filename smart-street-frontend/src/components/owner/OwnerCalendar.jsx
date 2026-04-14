import React, { useState, useMemo } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

export default function OwnerCalendar({ requests, onEventClick }) {
    const [currentDate, setCurrentDate] = useState(new Date());

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sunday

    const monthName = currentDate.toLocaleString('default', { month: 'long' });

    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

    // Map requests to days
    const eventsByDay = useMemo(() => {
        const map = {};
        requests.forEach(req => {
            if (req.status !== 'APPROVED') return;
            const start = new Date(req.start_time);
            const end = new Date(req.end_time);

            // Simple check: if request overlaps with the day
            // Iterate through days of the month
            for (let d = 1; d <= daysInMonth; d++) {
                const dayStart = new Date(year, month, d, 0, 0, 0);
                const dayEnd = new Date(year, month, d, 23, 59, 59);

                if (start <= dayEnd && end >= dayStart) {
                    if (!map[d]) map[d] = [];
                    map[d].push(req);
                }
            }
        });
        return map;
    }, [requests, year, month, daysInMonth]);

    const renderCalendarDays = () => {
        const days = [];

        // Empty slots for prev month
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push(<div key={`empty-${i}`} className="h-24 sm:h-32 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800"></div>);
        }

        // Days of current month
        for (let d = 1; d <= daysInMonth; d++) {
            const events = eventsByDay[d] || [];
            const isToday = new Date().toDateString() === new Date(year, month, d).toDateString();

            days.push(
                <div key={d} className={`h-24 sm:h-32 border border-slate-100 dark:border-slate-800 p-2 relative hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${isToday ? 'bg-blue-50/30' : 'bg-white dark:bg-slate-900'}`}>
                    <span className={`text-sm font-semibold ${isToday ? 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 w-6 h-6 rounded-full flex items-center justify-center' : 'text-slate-700 dark:text-slate-400'}`}>
                        {d}
                    </span>
                    <div className="mt-1 space-y-1 overflow-y-auto max-h-[calc(100%-1.5rem)] scrollbar-hide">
                        {events.map((ev, idx) => (
                            <div
                                key={ev.request_id}
                                onClick={() => onEventClick && onEventClick(ev.request_id)}
                                className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-1 py-0.5 rounded truncate cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                                title={`${ev.vendor_name} - ${ev.space_name}`}
                            >
                                {ev.vendor_name}
                            </div>
                        ))}
                    </div>
                </div>
            );
        }
        return days;
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    {monthName} {year}
                </h2>
                <div className="flex items-center gap-2">
                    <button onClick={prevMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                        <ChevronLeftIcon className="w-5 h-5 text-slate-500" />
                    </button>
                    <button onClick={() => setCurrentDate(new Date())} className="text-sm font-medium text-blue-600">
                        Today
                    </button>
                    <button onClick={nextMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                        <ChevronRightIcon className="w-5 h-5 text-slate-500" />
                    </button>
                </div>
            </div>

            {/* Days Header */}
            <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="py-2 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7">
                {renderCalendarDays()}
            </div>
        </div>
    );
}
