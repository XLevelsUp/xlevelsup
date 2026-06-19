'use client';

import { useState } from 'react';
import type { LeaveRequestWithEmployee } from '@/types/erp';

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

  return (
    <div className="glass rounded-lg p-6">
      {/* Calendar Header Control Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 border-b border-gray-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>📅</span>
            <span>{months[month]} {year}</span>
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Visual calendar of employee leaves and coverage
          </p>
        </div>
        
        <div className="flex items-center gap-2 bg-[#0c0c0e]/80 border border-gray-800 p-1.5 rounded-lg">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 rounded-md hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
            title="Previous Month"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <button
            onClick={handleToday}
            className="px-2.5 py-1 text-xs font-semibold rounded-md hover:bg-gray-850 hover:text-white text-gray-400 transition-colors"
          >
            Today
          </button>
          
          <button
            onClick={handleNextMonth}
            className="p-1.5 rounded-md hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
            title="Next Month"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Weekday Legend */}
      <div className="grid grid-cols-7 gap-1.5 mb-2 text-center text-xs font-bold text-gray-400 uppercase select-none tracking-wider">
        <div>Sun</div>
        <div>Mon</div>
        <div>Tue</div>
        <div>Wed</div>
        <div>Thu</div>
        <div>Fri</div>
        <div>Sat</div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1.5 min-h-[380px] bg-dark-900/20">
        {days.map((cell, idx) => {
          const dateReqs = getRequestsForDate(cell.date);
          const isToday = new Date().toDateString() === cell.date.toDateString();

          return (
            <div
              key={idx}
              className={`min-h-[75px] sm:min-h-[90px] p-1.5 rounded-lg border flex flex-col gap-1 transition-all ${
                cell.isCurrentMonth
                  ? 'bg-gray-900/10 border-gray-800/60'
                  : 'bg-gray-950/20 border-gray-900/40 opacity-40'
              } ${isToday ? 'border-cyan/50 ring-1 ring-cyan/35' : ''}`}
            >
              {/* Day Number */}
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-bold ${
                    isToday
                      ? 'bg-cyan text-black px-1.5 py-0.5 rounded-md text-[10px]'
                      : cell.isCurrentMonth
                      ? 'text-gray-300'
                      : 'text-gray-600'
                  }`}
                >
                  {cell.day}
                </span>
                {dateReqs.length > 0 && cell.isCurrentMonth && (
                  <span className="text-[10px] text-gray-500 font-medium">
                    {dateReqs.length} {dateReqs.length === 1 ? 'off' : 'off'}
                  </span>
                )}
              </div>

              {/* Day Leaves List */}
              <div className="flex-1 flex flex-col gap-1 overflow-y-auto max-h-[50px] sm:max-h-[65px] scrollbar-none mt-1">
                {dateReqs.slice(0, 3).map((req) => (
                  <div
                    key={req.id}
                    className={`text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-md font-medium truncate select-none border ${
                      req.status === 'approved'
                        ? 'bg-green-500/10 border-green-500/20 text-green-400'
                        : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                    }`}
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

      {/* Calendar Legend Info */}
      <div className="flex flex-wrap items-center justify-between gap-4 mt-6 pt-4 border-t border-gray-850 text-xs text-gray-500 select-none">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-md bg-green-500/20 border border-green-500/30"></span>
            <span>Approved Leave</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-md bg-yellow-500/20 border border-yellow-500/30"></span>
            <span>Pending Review</span>
          </div>
        </div>
        <div>
          <span>Tip: Hover or click leave tags to see full details.</span>
        </div>
      </div>
    </div>
  );
}
