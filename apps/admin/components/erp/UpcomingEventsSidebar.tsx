'use client';

/**
 * Persistent right-hand calendar widget for the ERP dashboard — a compact
 * month grid (dots mark days with events) plus a list of what those events
 * are, merging birthdays, work anniversaries and company holidays.
 *
 * Distinct from UpcomingEventsPanel (the header's slide-over drawer, opened
 * on click): this is always visible rather than something you have to
 * remember to open. Both read the same actions/erp/events.ts data and share
 * the icon/color/date-label mapping in eventDisplayHelpers.ts, so a holiday
 * added there shows up identically in both places without extra wiring.
 *
 * The initial month is server-fetched (see app/erp/dashboard/page.tsx) so
 * the widget paints with real data on first load rather than an empty grid
 * that fills in a moment later; navigating to a different month fetches
 * client-side via the same getMonthEventsAction the drawer already uses.
 */

import { useEffect, useRef, useState } from 'react';
import { getMonthEventsAction, type UpcomingEvent } from '@/actions/erp/events';
import { EVENT_META, formatWhen, monthLabel } from './eventDisplayHelpers';

interface UpcomingEventsSidebarProps {
  initialEvents: UpcomingEvent[];
  year: number;
  month: number; // 1-12
}

function formatDateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function UpcomingEventsSidebar({
  initialEvents,
  year: initialYear,
  month: initialMonth,
}: UpcomingEventsSidebarProps) {
  const [cursor, setCursor] = useState({ year: initialYear, month: initialMonth });
  const [events, setEvents] = useState<UpcomingEvent[]>(initialEvents);
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // The initial month's data already arrived via initialEvents (server-
  // fetched — see app/erp/dashboard/page.tsx), so this effect must skip its
  // very first run and only fetch once the cursor actually changes.
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    // Resets the spinner/selection for the newly-picked month while the fetch
    // below is in flight — same reasoning and suppression as the identically
    // shaped effect in UpcomingEventsPanel.tsx.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setSelectedDay(null);
    getMonthEventsAction(cursor.year, cursor.month)
      .then(setEvents)
      .finally(() => setLoading(false));
  }, [cursor]);

  const shiftMonth = (delta: number) => {
    setCursor((prev) => {
      let month = prev.month + delta;
      let year = prev.year;
      if (month > 12) {
        month = 1;
        year += 1;
      } else if (month < 1) {
        month = 12;
        year -= 1;
      }
      return { year, month };
    });
  };

  const now = new Date();
  const todayKey = formatDateKey(now);
  const isCurrentMonth =
    cursor.year === now.getFullYear() && cursor.month === now.getMonth() + 1;

  // Group this month's events by date so the grid can mark each day with up
  // to 3 dots without scanning the whole array per cell.
  const eventsByDate = new Map<string, UpcomingEvent[]>();
  for (const event of events) {
    const list = eventsByDate.get(event.date);
    if (list) list.push(event);
    else eventsByDate.set(event.date, [event]);
  }

  // Standard 6-week (42-cell) grid, padded with the tail of the previous
  // month and the head of the next — same construction already used by
  // EmployeeHolidayCalendar.tsx / AttendanceManager.tsx for their calendars.
  const firstDayIndex = new Date(cursor.year, cursor.month - 1, 1).getDay();
  const totalDays = new Date(cursor.year, cursor.month, 0).getDate();
  const prevMonthTotalDays = new Date(cursor.year, cursor.month - 1, 0).getDate();

  const cells: { date: Date; inMonth: boolean }[] = [];
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    cells.push({ date: new Date(cursor.year, cursor.month - 2, prevMonthTotalDays - i), inMonth: false });
  }
  for (let d = 1; d <= totalDays; d++) {
    cells.push({ date: new Date(cursor.year, cursor.month - 1, d), inMonth: true });
  }
  while (cells.length < 42) {
    const last = cells[cells.length - 1].date;
    cells.push({ date: new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1), inMonth: false });
  }

  const visibleEvents = selectedDay
    ? events.filter((e) => e.date === selectedDay)
    : events;

  return (
    <aside className="glass rounded-lg p-4 xl:sticky xl:top-6 h-fit">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
          <span aria-hidden>📅</span> Calendar
        </h2>
        <div className="flex items-center gap-1">
          <button
            onClick={() => shiftMonth(-1)}
            className="p-1 rounded-md hover:bg-gray-850 text-gray-400 hover:text-white transition-colors"
            aria-label="Previous month"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => shiftMonth(1)}
            className="p-1 rounded-md hover:bg-gray-850 text-gray-400 hover:text-white transition-colors"
            aria-label="Next month"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-gray-300">
          {monthLabel(cursor.year, cursor.month)}
        </span>
        {!isCurrentMonth && (
          <button
            onClick={() => setCursor({ year: now.getFullYear(), month: now.getMonth() + 1 })}
            className="text-[10px] text-cyan hover:underline"
          >
            Today
          </button>
        )}
      </div>

      {/* Mini month grid — dots mark days with events, no labels (too narrow
          for that here); the native title attribute gives a hover summary. */}
      <div className="grid grid-cols-7 gap-y-1 text-center select-none">
        {WEEKDAYS.map((w, i) => (
          <div key={i} className="text-[9px] font-bold text-gray-500 uppercase">
            {w}
          </div>
        ))}
        {cells.map((cell, idx) => {
          const key = formatDateKey(cell.date);
          const dayEvents = eventsByDate.get(key) ?? [];
          const isToday = key === todayKey;
          const isSelected = selectedDay === key;
          const hasEvents = cell.inMonth && dayEvents.length > 0;

          return (
            <button
              key={idx}
              type="button"
              disabled={!hasEvents}
              onClick={() => setSelectedDay(isSelected ? null : key)}
              title={dayEvents.map((e) => e.title).join(', ') || undefined}
              className={`relative mx-auto flex h-7 w-7 flex-col items-center justify-center rounded-md text-[10px] transition-colors ${
                cell.inMonth ? 'text-gray-300' : 'text-gray-700'
              } ${isToday ? 'ring-1 ring-cyan/60 font-bold text-cyan' : ''} ${
                isSelected ? 'bg-cyan/20' : hasEvents ? 'hover:bg-gray-850/60 cursor-pointer' : 'cursor-default'
              }`}
            >
              {cell.date.getDate()}
              {dayEvents.length > 0 && (
                <span className="absolute bottom-0.5 flex gap-0.5">
                  {dayEvents.slice(0, 3).map((e, i) => (
                    <span key={i} className={`h-1 w-1 rounded-full ${EVENT_META[e.type].dot}`} />
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* List — the selected day's events if one is picked, otherwise every
          event in the month currently shown, chronological. */}
      <div className="mt-4 border-t border-gray-800/60 pt-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            {selectedDay
              ? selectedDay === todayKey
                ? 'Today'
                : new Date(`${selectedDay}T00:00:00Z`).toLocaleDateString('en-US', {
                    timeZone: 'UTC',
                    month: 'short',
                    day: 'numeric',
                  })
              : 'This Month'}
          </h3>
          {selectedDay && (
            <button onClick={() => setSelectedDay(null)} className="text-[10px] text-cyan hover:underline">
              Show all
            </button>
          )}
        </div>

        {loading ? (
          <p className="text-xs text-gray-500">Loading…</p>
        ) : visibleEvents.length === 0 ? (
          <p className="text-xs text-gray-500">
            {selectedDay ? 'Nothing on this day.' : 'Nothing on the calendar this month.'}
          </p>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {visibleEvents.map((event, idx) => {
              const meta = EVENT_META[event.type];
              const isPast = event.daysUntil < 0;
              return (
                <div
                  key={`${event.type}-${event.date}-${idx}`}
                  className="flex items-start gap-2.5 p-2 rounded-lg bg-gray-850/40 border border-gray-800/60"
                >
                  <span className={`text-base leading-none mt-0.5 ${isPast ? 'grayscale opacity-60' : ''}`}>
                    {meta.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium truncate ${isPast ? 'text-gray-500' : 'text-white'}`}>
                      {event.title}
                    </p>
                    {event.subtitle && (
                      <p className={`text-[10px] ${isPast ? 'text-gray-600' : 'text-gray-400'}`}>
                        {event.subtitle}
                      </p>
                    )}
                  </div>
                  <span
                    className={`shrink-0 text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${
                      isPast ? 'bg-gray-700/40 text-gray-500' : meta.badge
                    }`}
                  >
                    {formatWhen(event.daysUntil, event.date)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
