'use client';

/**
 * Attendance Records Table & Calendar Component
 * Displays employee's attendance records in a calendar or table format
 * with option to request changes
 */

import { useState } from 'react';
import type { AttendanceWithChangeRequest } from '@/types/erp';

interface AttendanceRecordsTableProps {
  records: AttendanceWithChangeRequest[];
  employeeId: number;
}

export default function AttendanceRecordsTable({
  records,
  employeeId,
}: AttendanceRecordsTableProps) {
  const [viewMode, setViewMode] = useState<'calendar' | 'table'>('calendar');
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [tableFilter, setTableFilter] = useState<string>('all');

  // Month navigation helpers
  const handlePrevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1),
    );
  };

  const handleNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1),
    );
  };

  // Format date helper for local YYYY-MM-DD
  const formatDateKey = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Build a lookup map for attendance records in local YYYY-MM-DD format
  const recordsMap = new Map<string, AttendanceWithChangeRequest>();
  records.forEach((record) => {
    if (record.date) {
      const dateStr = record.date.split('T')[0];
      recordsMap.set(dateStr, record);
    }
  });

  // Calendar grid generator (42 days / 6 weeks)
  const getCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun, 1 = Mon...
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevMonthTotalDays = new Date(year, month, 0).getDate();

    const days = [];

    // Prev month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayDate = new Date(year, month - 1, prevMonthTotalDays - i);
      days.push({
        date: dayDate,
        isCurrentMonth: false,
        dayNum: prevMonthTotalDays - i,
      });
    }

    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      const dayDate = new Date(year, month, i);
      days.push({
        date: dayDate,
        isCurrentMonth: true,
        dayNum: i,
      });
    }

    // Next month padding
    const remainingCells = 42 - days.length;
    for (let i = 1; i <= remainingCells; i++) {
      const dayDate = new Date(year, month + 1, i);
      days.push({
        date: dayDate,
        isCurrentMonth: false,
        dayNum: i,
      });
    }

    return days;
  };

  // Handle cell selection
  const handleDaySelect = (dayDate: Date, hasRecord: boolean, record?: AttendanceWithChangeRequest) => {
    const dateStr = formatDateKey(dayDate);
    const form = document.getElementById('change-request-form');
    
    if (form) {
      // Set input values in the Sidebar form
      const reqDateInput = document.getElementById('request_date') as HTMLInputElement;
      if (reqDateInput) reqDateInput.value = dateStr;

      const currStatusInput = document.getElementById('current_status') as HTMLInputElement;
      if (currStatusInput) currStatusInput.value = record ? record.status : '';

      const attIdInput = document.getElementById('attendance_id') as HTMLInputElement;
      if (attIdInput) attIdInput.value = record ? String(record.id) : '';

      // Scroll smoothly to form
      form.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  };

  // Attendance Styling Maps
  const statusStyles: Record<string, { bg: string; border: string; text: string; label: string }> = {
    present: { bg: 'bg-green-500/10 hover:bg-green-500/20', border: 'border-green-500/30', text: 'text-green-400', label: 'Present' },
    absent: { bg: 'bg-red-500/10 hover:bg-red-500/20', border: 'border-red-500/30', text: 'text-red-400', label: 'Absent' },
    'half-day': { bg: 'bg-yellow-500/10 hover:bg-yellow-500/20', border: 'border-yellow-500/30', text: 'text-yellow-400', label: 'Half-Day' },
    'paid-leave': { bg: 'bg-blue-500/10 hover:bg-blue-500/20', border: 'border-blue-500/30', text: 'text-blue-400', label: 'Paid Leave' },
    'unpaid-leave': { bg: 'bg-purple-500/10 hover:bg-purple-500/20', border: 'border-purple-500/30', text: 'text-purple-400', label: 'Unpaid Leave' },
    holiday: { bg: 'bg-cyan-500/10 hover:bg-cyan-500/20', border: 'border-cyan-500/30', text: 'text-cyan-400', label: 'Holiday' },
  };

  const getStatusBadge = (status: string) => {
    const style = statusStyles[status] || statusStyles.present;
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${style.bg} ${style.text}`}>
        {style.label.toUpperCase()}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      weekday: 'short',
    });
  };

  // Table filtering logic
  const filteredRecords = records.filter((record) => {
    if (tableFilter === 'all') return true;
    return record.status === tableFilter;
  });

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const calendarDays = getCalendarDays();

  return (
    <div className='space-y-4' data-employee-id={employeeId}>
      {/* Toggle View Mode & Controls */}
      <div className='flex items-center justify-between border-b border-gray-800 pb-3 flex-wrap gap-2'>
        <div className='flex items-center gap-1 bg-[#0a0a0a] border border-gray-800 p-1 rounded-lg'>
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              viewMode === 'calendar'
                ? 'bg-gradient-to-r from-cyan to-purple text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            📅 Calendar View
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              viewMode === 'table'
                ? 'bg-gradient-to-r from-cyan to-purple text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            📋 Table View
          </button>
        </div>

        {/* Calendar Navigation */}
        {viewMode === 'calendar' && (
          <div className='flex items-center gap-3 bg-[#0a0a0a] border border-gray-800 px-3 py-1 rounded-lg'>
            <button
              onClick={handlePrevMonth}
              className='text-gray-400 hover:text-white transition-colors text-sm font-bold px-1'
            >
              &larr;
            </button>
            <span className='text-xs font-semibold text-white min-w-[90px] text-center'>
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </span>
            <button
              onClick={handleNextMonth}
              className='text-gray-400 hover:text-white transition-colors text-sm font-bold px-1'
            >
              &rarr;
            </button>
          </div>
        )}
      </div>

      {/* --- CALENDAR VIEW --- */}
      {viewMode === 'calendar' && (
        <div className='space-y-4'>
          {/* Calendar Grid */}
          <div className='bg-[#0a0a0a] border border-gray-800 rounded-lg p-3 sm:p-4'>
            {/* Weekday headers */}
            <div className='grid grid-cols-7 gap-1 text-center font-bold text-[10px] sm:text-xs text-gray-500 uppercase tracking-wider mb-2 border-b border-gray-800/40 pb-2'>
              {weekdays.map((day) => (
                <div key={day} className='py-1'>
                  {day}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className='grid grid-cols-7 gap-1 sm:gap-2'>
              {calendarDays.map((day, idx) => {
                const dateStr = formatDateKey(day.date);
                const record = recordsMap.get(dateStr);
                const hasRecord = !!record;
                const isToday = formatDateKey(new Date()) === dateStr;

                // Pick style based on status
                let style = {
                  bg: 'bg-[#111111]/30 hover:bg-[#1a1a1a]/50 text-gray-400',
                  border: 'border-gray-800/30',
                  text: 'text-gray-500',
                  label: '',
                };

                if (hasRecord && record) {
                  style = statusStyles[record.status] || style;
                }

                return (
                  <button
                    key={`${dateStr}-${idx}`}
                    onClick={() => handleDaySelect(day.date, hasRecord, record)}
                    disabled={!day.isCurrentMonth}
                    className={`flex flex-col justify-between items-start p-1 sm:p-2 h-14 sm:h-20 border rounded-lg transition-all text-left ${
                      day.isCurrentMonth
                        ? `${style.bg} ${style.border} cursor-pointer`
                        : 'bg-transparent border-transparent opacity-20 pointer-events-none'
                    } ${isToday ? 'ring-2 ring-[var(--cyan)] ring-offset-2 ring-offset-black' : ''}`}
                  >
                    {/* Day number */}
                    <div className='flex justify-between items-center w-full'>
                      <span
                        className={`text-xs font-bold ${
                          isToday
                            ? 'text-[var(--cyan)]'
                            : day.isCurrentMonth
                              ? hasRecord
                                ? style.text
                                : 'text-gray-300'
                              : 'text-gray-600'
                        }`}
                      >
                        {day.dayNum}
                      </span>

                      {/* Small Today Tag */}
                      {isToday && (
                        <span className='text-[8px] bg-[var(--cyan)]/20 text-[var(--cyan)] px-1 rounded-sm hidden sm:inline'>
                          Today
                        </span>
                      )}
                    </div>

                    {/* Status Text & Pending Indicator */}
                    <div className='w-full space-y-0.5 mt-auto'>
                      {hasRecord && style.label && (
                        <div className={`text-[8px] font-bold truncate leading-none ${style.text}`}>
                          {style.label}
                        </div>
                      )}

                      {/* Pending correction request dot */}
                      {record?.has_pending_request && (
                        <div className='flex items-center gap-1 text-[8px] text-yellow-400 font-medium leading-none'>
                          <span className='h-1.5 w-1.5 rounded-full bg-yellow-400 inline-block animate-pulse'></span>
                          <span className='hidden sm:inline'>Pending</span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color Legend */}
          <div className='flex flex-wrap gap-x-4 gap-y-2 bg-[#0a0a0a] border border-gray-800 rounded-lg p-3 text-xs justify-center'>
            <div className='flex items-center gap-1.5'>
              <span className='h-3 w-3 rounded-md bg-green-500/20 border border-green-500/30 inline-block'></span>
              <span className='text-gray-300'>Present</span>
            </div>
            <div className='flex items-center gap-1.5'>
              <span className='h-3 w-3 rounded-md bg-red-500/20 border border-red-500/30 inline-block'></span>
              <span className='text-gray-300'>Absent</span>
            </div>
            <div className='flex items-center gap-1.5'>
              <span className='h-3 w-3 rounded-md bg-yellow-500/20 border border-yellow-500/30 inline-block'></span>
              <span className='text-gray-300'>Half-Day</span>
            </div>
            <div className='flex items-center gap-1.5'>
              <span className='h-3 w-3 rounded-md bg-blue-500/20 border border-blue-500/30 inline-block'></span>
              <span className='text-gray-300'>Paid Leave</span>
            </div>
            <div className='flex items-center gap-1.5'>
              <span className='h-3 w-3 rounded-md bg-purple-500/20 border border-purple-500/30 inline-block'></span>
              <span className='text-gray-300'>Unpaid Leave</span>
            </div>
            <div className='flex items-center gap-1.5'>
              <span className='h-3 w-3 rounded-md bg-cyan-500/20 border border-cyan-500/30 inline-block'></span>
              <span className='text-gray-300'>Holiday</span>
            </div>
            <div className='flex items-center gap-1.5 border-l border-gray-800 pl-4'>
              <span className='h-2.5 w-2.5 rounded-full bg-yellow-400 inline-block animate-pulse'></span>
              <span className='text-gray-300'>Pending Request</span>
            </div>
          </div>
        </div>
      )}

      {/* --- TABLE VIEW --- */}
      {viewMode === 'table' && (
        <div className='space-y-4'>
          {/* Filter Buttons */}
          <div className='flex flex-wrap gap-2'>
            <button
              onClick={() => setTableFilter('all')}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                tableFilter === 'all'
                  ? 'bg-[var(--cyan)] text-black font-semibold'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              All ({records.length})
            </button>
            <button
              onClick={() => setTableFilter('present')}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                tableFilter === 'present'
                  ? 'bg-green-600 text-white font-semibold'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              Present ({records.filter((r) => r.status === 'present').length})
            </button>
            <button
              onClick={() => setTableFilter('absent')}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                tableFilter === 'absent'
                  ? 'bg-red-600 text-white font-semibold'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              Absent ({records.filter((r) => r.status === 'absent').length})
            </button>
            <button
              onClick={() => setTableFilter('paid-leave')}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                tableFilter === 'paid-leave'
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              Paid Leave ({records.filter((r) => r.status === 'paid-leave').length})
            </button>
          </div>

          {/* Table */}
          <div className='overflow-x-auto'>
            {filteredRecords.length === 0 ? (
              <div className='text-center py-12 text-gray-400'>
                <p>No attendance records found</p>
                <p className='text-sm mt-2'>
                  {tableFilter !== 'all' && 'Try changing the filter'}
                </p>
              </div>
            ) : (
              <table className='w-full text-sm'>
                <thead>
                  <tr className='border-b border-gray-800 text-gray-400'>
                    <th className='text-left py-3 px-2 font-medium'>Date</th>
                    <th className='text-left py-3 px-2 font-medium'>Status</th>
                    <th className='text-left py-3 px-2 font-medium'>Notes</th>
                    <th className='text-center py-3 px-2 font-medium'>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((record) => (
                    <tr
                      key={record.id}
                      className='border-b border-gray-800/50 hover:bg-gray-900/30 transition-colors'
                    >
                      <td className='py-3 px-2'>{formatDate(record.date)}</td>
                      <td className='py-3 px-2'>{getStatusBadge(record.status)}</td>
                      <td className='py-3 px-2 text-gray-400 text-xs max-w-xs truncate'>
                        {record.notes || '-'}
                      </td>
                      <td className='py-3 px-2 text-center'>
                        {record.has_pending_request ? (
                          <span className='text-xs text-yellow-400 font-medium'>
                            Pending Request
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              // Re-use logic to scroll and fill the form
                              const dayDate = new Date(record.date);
                              handleDaySelect(dayDate, true, record);
                            }}
                            className='text-xs text-[var(--cyan)] hover:underline font-semibold'
                          >
                            Request Change
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Summary Stats (Displayed beneath both views) */}
      <div className='pt-6 border-t border-gray-800 bg-[#0a0a0a]/20 p-4 rounded-lg'>
        <div className='grid grid-cols-2 sm:grid-cols-4 gap-4 text-center'>
          <div className='bg-[#111]/30 p-2 rounded border border-gray-800/30'>
            <p className='text-xl sm:text-2xl font-bold text-green-400'>
              {records.filter((r) => r.status === 'present').length}
            </p>
            <p className='text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider font-semibold mt-1'>Present</p>
          </div>
          <div className='bg-[#111]/30 p-2 rounded border border-gray-800/30'>
            <p className='text-xl sm:text-2xl font-bold text-red-400'>
              {records.filter((r) => r.status === 'absent').length}
            </p>
            <p className='text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider font-semibold mt-1'>Absent</p>
          </div>
          <div className='bg-[#111]/30 p-2 rounded border border-gray-800/30'>
            <p className='text-xl sm:text-2xl font-bold text-blue-400'>
              {records.filter((r) => r.status === 'paid-leave').length}
            </p>
            <p className='text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider font-semibold mt-1'>Paid Leave</p>
          </div>
          <div className='bg-[#111]/30 p-2 rounded border border-gray-800/30'>
            <p className='text-xl sm:text-2xl font-bold text-yellow-500'>
              {records.filter((r) => r.status === 'half-day').length}
            </p>
            <p className='text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider font-semibold mt-1'>Half-Day</p>
          </div>
        </div>
      </div>
    </div>
  );
}
