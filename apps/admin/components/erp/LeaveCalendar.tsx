'use client';

import { useState } from 'react';
import type { LeaveRequestWithEmployee } from '@/types/erp';
import { formatDateSpan } from '@/lib/erp/utils';

interface LeaveCalendarProps {
  requests: LeaveRequestWithEmployee[];
}

export default function LeaveCalendar({ requests }: LeaveCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Calendar calculations
  const firstDayIndex = new Date(year, month, 1).getDay(); // Day of week (0 = Sunday)
  const totalDays = new Date(year, month + 1, 0).getDate();
  const prevMonthTotalDays = new Date(year, month, 0).getDate();

  const days = [];

  // Previous month dates to pad grid
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    days.push({
      day: prevMonthTotalDays - i,
      isCurrentMonth: false,
      date: new Date(year, month - 1, prevMonthTotalDays - i),
    });
  }

  // Current month dates
  for (let i = 1; i <= totalDays; i++) {
    days.push({
      day: i,
      isCurrentMonth: true,
      date: new Date(year, month, i),
    });
  }

  // Next month dates to fill out the remaining grid slots (usually to 35 or 42 total items)
  const remainingCells = days.length % 7 === 0 ? 0 : 7 - (days.length % 7);
  for (let i = 1; i <= remainingCells; i++) {
    days.push({
      day: i,
      isCurrentMonth: false,
      date: new Date(year, month + 1, i),
    });
  }

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Helper to check if a request overlaps with a specific date
  const getRequestsForDate = (date: Date) => {
    // Clear time parts for comparison
    const targetTime = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

    return requests.filter((req) => {
      if (req.status === 'cancelled' || req.status === 'rejected') return false;
      
      const start = new Date(req.start_date);
      const startTime = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
      
      const end = new Date(req.end_date);
      const endTime = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();
      
      return targetTime >= startTime && targetTime <= endTime;
    });
  };

  const getLeaveTypeShortLabel = (type: string) => {
    const labels: Record<string, string> = {
      sick: 'Sick',
      casual: 'Casual',
      floater: 'Floater',
      earned: 'Earned',
      unpaid: 'Unpaid',
      maternity: 'Maternity',
      paternity: 'Paternity',
      wfh: 'WFH',
      other: 'Other',
    };
    return labels[type] || type;
  };

  // Leave that touches the visible month — listed under the grid on narrow
  // containers, where each day cell is ~40px and can only show dots.
  const monthStart = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const monthEnd = `${year}-${String(month + 1).padStart(2, '0')}-${String(totalDays).padStart(2, '0')}`;
  const monthRequests = requests
    .filter(
      (req) =>
        req.status !== 'cancelled' &&
        req.status !== 'rejected' &&
        req.start_date.slice(0, 10) <= monthEnd &&
        (req.end_date || req.start_date).slice(0, 10) >= monthStart,
    )
    .sort((a, b) => a.start_date.localeCompare(b.start_date));

  const chipTone = (status: string) =>
    status === 'approved'
      ? 'bg-green-500/10 border-green-500/20 text-green-400'
      : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400';
  const dotTone = (status: string) => (status === 'approved' ? 'bg-green-400' : 'bg-yellow-400');

  return (
    <div className="glass rounded-lg p-4 @xl:p-6">
      {/* Calendar Header Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 @xl:mb-6 border-b border-gray-800 pb-4">
        <div className="min-w-0">
          <h2 className="text-lg @xl:text-xl font-bold text-white">
            {months[month]} {year}
          </h2>
          <p className="text-xs text-gray-400 mt-1">Who’s on leave each day</p>
        </div>

        <div className="flex items-center gap-2 bg-[#0c0c0e]/80 border border-gray-800 p-1.5 rounded-lg">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1.5 rounded-md hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
            title="Previous month"
            aria-label="Previous month"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            type="button"
            onClick={handleToday}
            className="px-2.5 py-1 text-xs font-semibold rounded-md hover:bg-gray-850 hover:text-white text-gray-400 transition-colors"
          >
            Today
          </button>

          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1.5 rounded-md hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
            title="Next month"
            aria-label="Next month"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Weekday Legend */}
      <div className="grid grid-cols-7 gap-1 @xl:gap-1.5 mb-2 text-center text-[10px] @xl:text-xs font-bold text-gray-400 uppercase select-none tracking-wider">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      {/* Calendar Grid. Wide: name chips per day. Narrow: one dot per
          person (approved green, pending yellow) — the names are in the
          list below the grid instead of truncated to a letter or two. */}
      <div className="grid grid-cols-7 gap-1 @xl:gap-1.5">
        {days.map((cell, idx) => {
          const dateReqs = getRequestsForDate(cell.date);
          const isToday = new Date().toDateString() === cell.date.toDateString();

          return (
            <div
              key={idx}
              className={`min-w-0 min-h-[3.25rem] @xl:min-h-[90px] p-1 @xl:p-1.5 rounded-lg border flex flex-col gap-1 transition-all ${
                cell.isCurrentMonth
                  ? 'bg-gray-900/10 border-gray-800/60'
                  : 'bg-gray-950/20 border-gray-900/40 opacity-40'
              } ${isToday ? 'border-[var(--cyan)]/50 ring-1 ring-[var(--cyan)]/35' : ''}`}
            >
              {/* Day Number */}
              <div className="flex items-center justify-between gap-1">
                <span
                  className={`text-xs font-bold tabular-nums ${
                    isToday
                      ? 'bg-[var(--cyan)] text-black px-1.5 py-0.5 rounded-md text-[10px]'
                      : cell.isCurrentMonth
                      ? 'text-gray-300'
                      : 'text-gray-600'
                  }`}
                >
                  {cell.day}
                </span>
                {dateReqs.length > 0 && cell.isCurrentMonth && (
                  <span className="hidden @xl:inline text-[10px] text-gray-500 font-medium">
                    {dateReqs.length} off
                  </span>
                )}
              </div>

              {/* Narrow: dots */}
              {dateReqs.length > 0 && (
                <div className="@xl:hidden flex flex-wrap gap-0.5" aria-label={`${dateReqs.length} on leave`}>
                  {dateReqs.slice(0, 4).map((req) => (
                    <span key={req.id} className={`w-1.5 h-1.5 rounded-full ${dotTone(req.status)}`} />
                  ))}
                  {dateReqs.length > 4 && <span className="text-[8px] leading-none text-gray-500">+</span>}
                </div>
              )}

              {/* Wide: name chips */}
              <div className="hidden @xl:flex flex-1 flex-col gap-1 overflow-y-auto max-h-[65px] scrollbar-none mt-1">
                {dateReqs.slice(0, 3).map((req) => (
                  <div
                    key={req.id}
                    className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium truncate select-none border ${chipTone(req.status)}`}
                    title={`${req.employee_name} (${getLeaveTypeShortLabel(req.leave_type)}): ${req.reason}`}
                  >
                    <span className="font-bold mr-0.5">
                      {req.employee_name.split(' ')[0]}
                    </span>
                    <span className="opacity-75">
                      ({getLeaveTypeShortLabel(req.leave_type).substring(0, 2)})
                    </span>
                  </div>
                ))}
                {dateReqs.length > 3 && (
                  <div className="text-[9px] text-gray-500 font-semibold text-center py-0.5 bg-gray-800/20 rounded">
                    + {dateReqs.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Narrow containers: the month's leave as a list. */}
      <div className="@xl:hidden mt-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-2">
          On leave in {months[month]}
        </p>
        {monthRequests.length === 0 ? (
          <p className="text-sm text-gray-500">No approved or pending leave this month.</p>
        ) : (
          <ul className="divide-y divide-gray-800/70">
            {monthRequests.map((req) => (
              <li key={req.id} className="py-2 flex items-center gap-3 min-w-0">
                <span className={`w-2 h-2 rounded-full shrink-0 ${dotTone(req.status)}`} aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-white truncate">{req.employee_name}</p>
                  <p className="text-xs text-gray-500">
                    {formatDateSpan(req.start_date, req.end_date)} · {getLeaveTypeShortLabel(req.leave_type)}
                  </p>
                </div>
                <span className="text-[10px] uppercase font-semibold text-gray-500 shrink-0">{req.status}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Calendar Legend Info */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 mt-4 @xl:mt-6 pt-4 border-t border-gray-850 text-xs text-gray-500 select-none">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-md bg-green-500/20 border border-green-500/30"></span>
            <span>Approved</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-md bg-yellow-500/20 border border-yellow-500/30"></span>
            <span>Pending review</span>
          </div>
        </div>
        <span className="hidden @xl:inline">Hover a name for the leave type and reason.</span>
      </div>
    </div>
  );
}
