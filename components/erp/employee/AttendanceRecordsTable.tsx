'use client';

/**
 * Attendance Records Table Component
 * Displays employee's attendance records with option to request changes
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
  const [filter, setFilter] = useState<string>('all');

  const filteredRecords = records.filter((record) => {
    if (filter === 'all') return true;
    return record.status === filter;
  });

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string }> = {
      present: { bg: 'bg-green-500/20', text: 'text-green-400' },
      absent: { bg: 'bg-red-500/20', text: 'text-red-400' },
      'half-day': { bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
      'paid-leave': { bg: 'bg-blue-500/20', text: 'text-blue-400' },
      'unpaid-leave': { bg: 'bg-purple-500/20', text: 'text-purple-400' },
      holiday: { bg: 'bg-cyan-500/20', text: 'text-cyan-400' },
    };

    const badge = badges[status] || badges.present;

    return (
      <span
        className={`px-2 py-1 rounded text-xs font-medium ${badge.bg} ${badge.text}`}
      >
        {status.replace('-', ' ').toUpperCase()}
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

  return (
    <div className='space-y-4'>
      {/* Filter Buttons */}
      <div className='flex flex-wrap gap-2'>
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1 text-xs rounded ${
            filter === 'all'
              ? 'bg-[var(--cyan)] text-black'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          All ({records.length})
        </button>
        <button
          onClick={() => setFilter('present')}
          className={`px-3 py-1 text-xs rounded ${
            filter === 'present'
              ? 'bg-green-500 text-white'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          Present ({records.filter((r) => r.status === 'present').length})
        </button>
        <button
          onClick={() => setFilter('absent')}
          className={`px-3 py-1 text-xs rounded ${
            filter === 'absent'
              ? 'bg-red-500 text-white'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          Absent ({records.filter((r) => r.status === 'absent').length})
        </button>
        <button
          onClick={() => setFilter('paid-leave')}
          className={`px-3 py-1 text-xs rounded ${
            filter === 'paid-leave'
              ? 'bg-blue-500 text-white'
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
              {filter !== 'all' && 'Try changing the filter'}
            </p>
          </div>
        ) : (
          <table className='w-full text-sm'>
            <thead>
              <tr className='border-b border-gray-800'>
                <th className='text-left py-3 px-2 font-medium text-gray-400'>
                  Date
                </th>
                <th className='text-left py-3 px-2 font-medium text-gray-400'>
                  Status
                </th>
                <th className='text-left py-3 px-2 font-medium text-gray-400'>
                  Notes
                </th>
                <th className='text-center py-3 px-2 font-medium text-gray-400'>
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record) => (
                <tr
                  key={record.id}
                  className='border-b border-gray-800/50 hover:bg-gray-900/30'
                >
                  <td className='py-3 px-2'>{formatDate(record.date)}</td>
                  <td className='py-3 px-2'>{getStatusBadge(record.status)}</td>
                  <td className='py-3 px-2 text-gray-400 text-xs max-w-xs truncate'>
                    {record.notes || '-'}
                  </td>
                  <td className='py-3 px-2 text-center'>
                    {record.has_pending_request ? (
                      <span className='text-xs text-yellow-400'>
                        Pending Request
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          // Scroll to form and populate it
                          const form = document.getElementById(
                            'change-request-form',
                          );
                          if (form) {
                            // Set form values
                            (
                              document.getElementById(
                                'request_date',
                              ) as HTMLInputElement
                            ).value = record.date;
                            (
                              document.getElementById(
                                'current_status',
                              ) as HTMLInputElement
                            ).value = record.status;
                            (
                              document.getElementById(
                                'attendance_id',
                              ) as HTMLInputElement
                            ).value = String(record.id);

                            // Scroll to form
                            form.scrollIntoView({
                              behavior: 'smooth',
                              block: 'center',
                            });
                          }
                        }}
                        className='text-xs text-[var(--cyan)] hover:underline'
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

      {/* Summary */}
      <div className='pt-4 border-t border-gray-800'>
        <div className='grid grid-cols-3 gap-4 text-center'>
          <div>
            <p className='text-2xl font-bold text-green-400'>
              {records.filter((r) => r.status === 'present').length}
            </p>
            <p className='text-xs text-gray-400'>Present</p>
          </div>
          <div>
            <p className='text-2xl font-bold text-red-400'>
              {records.filter((r) => r.status === 'absent').length}
            </p>
            <p className='text-xs text-gray-400'>Absent</p>
          </div>
          <div>
            <p className='text-2xl font-bold text-blue-400'>
              {records.filter((r) => r.status === 'paid-leave').length}
            </p>
            <p className='text-xs text-gray-400'>Paid Leave</p>
          </div>
        </div>
      </div>
    </div>
  );
}
