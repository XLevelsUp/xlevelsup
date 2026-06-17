'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Table, TableRow, TableCell } from './Table';
import Button from '@/components/ui/Button';
import type { Employee } from '@/types/erp';
import { formatDisplayDate } from '@/lib/erp/utils';
import Link from 'next/link';

interface SessionsManagerProps {
  employees: Employee[];
  initialTimeLogs: any[];
  initialMonth: string;
  initialEmployeeId?: number;
}

export default function SessionsManager({
  employees,
  initialTimeLogs,
  initialMonth,
  initialEmployeeId,
}: SessionsManagerProps) {
  const router = useRouter();
  const [month, setMonth] = useState(initialMonth);
  const [employeeId, setEmployeeId] = useState<number | undefined>(
    initialEmployeeId,
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const handleFilterChange = () => {
    const params = new URLSearchParams();
    params.set('month', month);
    if (employeeId) params.set('employee_id', employeeId.toString());

    router.push(`/erp/attendance/sessions?${params.toString()}`);
  };

  const toggleRow = (key: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Group logs by employee and date
  const groupedSessions: Record<string, {
    employee: any;
    date: string;
    sessions: any[];
    totalHours: number;
    hasActiveSession: boolean;
  }> = {};

  initialTimeLogs.forEach((log) => {
    const empId = log.employee_id;
    const date = log.date;
    const groupKey = `${empId}_${date}`;

    if (!groupedSessions[groupKey]) {
      groupedSessions[groupKey] = {
        employee: log.employee,
        date,
        sessions: [],
        totalHours: 0,
        hasActiveSession: false,
      };
    }

    groupedSessions[groupKey].sessions.push(log);
    
    if (log.status === 'active') {
      groupedSessions[groupKey].hasActiveSession = true;
    }
    
    groupedSessions[groupKey].totalHours += log.total_hours || 0;
  });

  // Convert to array and sort by date descending
  const groupedArray = Object.entries(groupedSessions).map(([key, value]) => ({
    key,
    ...value,
  })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Filter grouped results by search query locally
  const filteredGrouped = groupedArray.filter((group) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      group.employee?.name?.toLowerCase().includes(query) ||
      group.employee?.employee_id?.toLowerCase().includes(query) ||
      group.employee?.department?.toLowerCase().includes(query)
    );
  });

  const formatTime = (timeString: string) => {
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return timeString;
    }
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4'>
        <div>
          <h1 className='text-3xl font-bold gradient-text'>
            🕒 Detailed Sessions History
          </h1>
          <p className='text-gray-400 mt-2'>
            View log-in / log-out sessions and working hours for each employee
          </p>
        </div>
        <Link href='/erp/attendance'>
          <Button variant='secondary'>
            ← Back to Attendance
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className='glass p-4 rounded-lg'>
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
          <div>
            <label className='block text-sm font-medium mb-2'>Month</label>
            <input
              type='month'
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
            />
          </div>
          <div>
            <label className='block text-sm font-medium mb-2'>Employee</label>
            <select
              value={employeeId || ''}
              onChange={(e) =>
                setEmployeeId(
                  e.target.value ? parseInt(e.target.value) : undefined,
                )
              }
              className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
            >
              <option value=''>All Employees</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.employee_id})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className='block text-sm font-medium mb-2'>Local Search</label>
            <input
              type='text'
              placeholder='Search by name, ID or dept...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
            />
          </div>
          <div className='flex items-end'>
            <Button
              variant='primary'
              onClick={handleFilterChange}
              className='w-full'
            >
              Fetch Data
            </Button>
          </div>
        </div>
      </div>

      {/* Grouped Table */}
      <div className='glass rounded-lg overflow-hidden'>
        {filteredGrouped.length === 0 ? (
          <div className='text-center py-12 text-gray-400'>
            <p>No login/logout sessions found for the selected filters.</p>
          </div>
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full border-collapse'>
              <thead>
                <tr className='border-b border-gray-700'>
                  <th className='text-left px-4 py-3 text-sm font-semibold text-gray-300 uppercase'>Date</th>
                  <th className='text-left px-4 py-3 text-sm font-semibold text-gray-300 uppercase'>Employee</th>
                  <th className='text-left px-4 py-3 text-sm font-semibold text-gray-300 uppercase'>Department</th>
                  <th className='text-center px-4 py-3 text-sm font-semibold text-gray-300 uppercase'>Sessions</th>
                  <th className='text-right px-4 py-3 text-sm font-semibold text-gray-300 uppercase'>Total Hours</th>
                  <th className='text-center px-4 py-3 text-sm font-semibold text-gray-300 uppercase'>Status</th>
                  <th className='text-center px-4 py-3 text-sm font-semibold text-gray-300 uppercase'>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredGrouped.map((group) => {
                  const isExpanded = !!expandedRows[group.key];
                  return (
                    <>
                      <tr 
                        key={group.key} 
                        className={`border-b border-gray-800 hover:bg-dark-700 transition-colors cursor-pointer ${
                          isExpanded ? 'bg-dark-700/50' : ''
                        }`}
                        onClick={() => toggleRow(group.key)}
                      >
                        <td className='px-4 py-4 text-sm font-medium text-white'>
                          {formatDisplayDate(group.date)}
                        </td>
                        <td className='px-4 py-4'>
                          <div className='font-medium text-white'>{group.employee?.name}</div>
                          <div className='text-xs text-gray-500'>{group.employee?.employee_id}</div>
                        </td>
                        <td className='px-4 py-4 text-sm text-gray-300'>
                          {group.employee?.department}
                        </td>
                        <td className='px-4 py-4 text-center text-sm text-white font-medium'>
                          {group.sessions.length} session{group.sessions.length > 1 ? 's' : ''}
                        </td>
                        <td className='px-4 py-4 text-right text-sm text-cyan font-bold'>
                          {group.totalHours.toFixed(2)} hrs
                        </td>
                        <td className='px-4 py-4 text-center'>
                          {group.hasActiveSession ? (
                            <span className='px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-500/20 text-green-400'>
                              🔴 Clocked In
                            </span>
                          ) : (
                            <span className='px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-700 text-gray-300'>
                              Completed
                            </span>
                          )}
                        </td>
                        <td className='px-4 py-4 text-center'>
                          <button
                            className='text-xs font-semibold text-cyan hover:underline transition-colors'
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleRow(group.key);
                            }}
                          >
                            {isExpanded ? 'Hide Details ▲' : 'Show Sessions ▼'}
                          </button>
                        </td>
                      </tr>

                      {/* Expandable Details Container */}
                      {isExpanded && (
                        <tr className='bg-[#0a0a0a]/80 border-b border-gray-800'>
                          <td colSpan={7} className='px-6 py-4'>
                            <div className='space-y-3 pl-4 border-l-2 border-cyan/40'>
                              <p className='text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2'>
                                Session History Breakdown ({group.sessions.length} session{group.sessions.length > 1 ? 's' : ''}):
                              </p>
                              <div className='grid grid-cols-1 gap-2'>
                                {group.sessions.map((session, index) => (
                                  <div 
                                    key={session.id} 
                                    className='bg-dark-800/60 border border-gray-800/80 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-sm'
                                  >
                                    <div className='space-y-1'>
                                      <div className='flex items-center gap-2'>
                                        <span className='text-xs bg-cyan/10 text-cyan px-2 py-0.5 rounded border border-cyan/20'>
                                          Session {group.sessions.length - index}
                                        </span>
                                        <span className={`text-xs px-2 py-0.5 rounded ${
                                          session.status === 'active' 
                                            ? 'bg-green-500/20 text-green-400' 
                                            : 'bg-gray-800 text-gray-400'
                                        }`}>
                                          {session.status.toUpperCase()}
                                        </span>
                                      </div>
                                      <div className='text-xs text-gray-400 mt-1'>
                                        <strong>In:</strong> {formatTime(session.clock_in_time)}
                                        {session.clock_in_latitude && (
                                          <span className='text-gray-500 ml-1'>
                                            📍 ({session.clock_in_latitude.toFixed(4)}, {session.clock_in_longitude.toFixed(4)})
                                          </span>
                                        )}
                                      </div>
                                      <div className='text-xs text-gray-400'>
                                        <strong>Out:</strong> {session.clock_out_time ? formatTime(session.clock_out_time) : 'In Progress'}
                                        {session.clock_out_latitude && (
                                          <span className='text-gray-500 ml-1'>
                                            📍 ({session.clock_out_latitude.toFixed(4)}, {session.clock_out_longitude.toFixed(4)})
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <div className='text-right'>
                                      <div className='text-xs text-gray-500'>Duration</div>
                                      <div className='font-mono font-bold text-white text-base'>
                                        {session.total_hours ? `${session.total_hours.toFixed(2)} hrs` : 'Ongoing'}
                                      </div>
                                      {session.notes && (
                                        <p className='text-xs text-gray-400 italic max-w-xs truncate mt-1'>
                                          "{session.notes}"
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
