'use client';

/**
 * Admin Time Tracking Overview Component
 * Shows real-time status of all employees' clock in/out
 */

import { useState } from 'react';
import type { EmployeeTimeStatus } from '@/lib/erp/time-tracking-admin';

interface TimeTrackingOverviewProps {
  employees: EmployeeTimeStatus[];
}

export default function TimeTrackingOverview({
  employees,
}: TimeTrackingOverviewProps) {
  const [filter, setFilter] = useState<
    'all' | 'working' | 'completed' | 'not_started'
  >('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter employees
  const filteredEmployees = employees.filter((emp) => {
    const matchesFilter =
      filter === 'all' ||
      (filter === 'working' && emp.is_clocked_in) ||
      (filter === 'completed' &&
        !emp.is_clocked_in &&
        emp.total_hours_today >= 8) ||
      (filter === 'not_started' && emp.status === 'not_started');

    const matchesSearch =
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employee_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.department.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  // Sort by status priority (working first, then by hours)
  const sortedEmployees = [...filteredEmployees].sort((a, b) => {
    if (a.is_clocked_in && !b.is_clocked_in) return -1;
    if (!a.is_clocked_in && b.is_clocked_in) return 1;
    return b.total_hours_today - a.total_hours_today;
  });

  const getStatusBadge = (emp: EmployeeTimeStatus) => {
    if (emp.is_clocked_in) {
      return (
        <span className='px-2 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400'>
          🟢 Working
        </span>
      );
    } else if (emp.total_hours_today >= 8) {
      return (
        <span className='px-2 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400'>
          ✅ Completed
        </span>
      );
    } else if (emp.total_hours_today > 0) {
      return (
        <span className='px-2 py-1 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-400'>
          ⏸️ Paused
        </span>
      );
    } else {
      return (
        <span className='px-2 py-1 rounded-full text-xs font-semibold bg-gray-500/20 text-gray-400'>
          ⚪ Not Started
        </span>
      );
    }
  };

  const getHoursColor = (hours: number) => {
    if (hours >= 8) return 'text-green-400';
    if (hours >= 4) return 'text-yellow-400';
    return 'text-gray-400';
  };

  return (
    <div className='space-y-4'>
      {/* Filters and Search */}
      <div className='flex flex-col sm:flex-row gap-4'>
        {/* Search */}
        <div className='flex-1'>
          <input
            type='text'
            placeholder='Search by name, ID, or department...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className='w-full px-4 py-2 bg-[#1a1a1a] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan'
          />
        </div>

        {/* Status Filter */}
        <div className='flex gap-2'>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-cyan text-black'
                : 'bg-[#1a1a1a] text-gray-400 hover:text-white'
            }`}
          >
            All ({employees.length})
          </button>
          <button
            onClick={() => setFilter('working')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'working'
                ? 'bg-green-500 text-black'
                : 'bg-[#1a1a1a] text-gray-400 hover:text-white'
            }`}
          >
            Working ({employees.filter((e) => e.is_clocked_in).length})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'completed'
                ? 'bg-blue-500 text-black'
                : 'bg-[#1a1a1a] text-gray-400 hover:text-white'
            }`}
          >
            Completed (
            {
              employees.filter(
                (e) => !e.is_clocked_in && e.total_hours_today >= 8,
              ).length
            }
            )
          </button>
          <button
            onClick={() => setFilter('not_started')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'not_started'
                ? 'bg-gray-500 text-black'
                : 'bg-[#1a1a1a] text-gray-400 hover:text-white'
            }`}
          >
            Not Started (
            {employees.filter((e) => e.status === 'not_started').length})
          </button>
        </div>
      </div>

      {/* Employee List */}
      <div className='glass rounded-lg overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead className='bg-[#1a1a1a] border-b border-gray-800'>
              <tr>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider'>
                  Employee
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider'>
                  Department
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider'>
                  Status
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider'>
                  Hours Today
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider'>
                  Clock In Time
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider'>
                  Sessions
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-800'>
              {sortedEmployees.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className='px-6 py-8 text-center text-gray-400'
                  >
                    No employees found matching your filters.
                  </td>
                </tr>
              ) : (
                sortedEmployees.map((emp) => (
                  <tr
                    key={emp.employee_id}
                    className='hover:bg-[#1a1a1a] transition-colors'
                  >
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div>
                        <div className='text-sm font-medium text-white'>
                          {emp.name}
                        </div>
                        <div className='text-xs text-gray-500'>
                          {emp.employee_code}
                        </div>
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='text-sm text-gray-300'>
                        {emp.department}
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      {getStatusBadge(emp)}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div
                        className={`text-sm font-semibold ${getHoursColor(emp.total_hours_today)}`}
                      >
                        {emp.total_hours_today.toFixed(2)} hrs
                      </div>
                      {emp.total_hours_today < 8 && (
                        <div className='text-xs text-gray-500'>
                          Pending: {(8 - emp.total_hours_today).toFixed(2)} hrs
                        </div>
                      )}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      {emp.clock_in_time ? (
                        <div className='text-sm text-gray-300'>
                          {new Date(emp.clock_in_time).toLocaleTimeString(
                            'en-IN',
                            {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true,
                            },
                          )}
                        </div>
                      ) : (
                        <div className='text-sm text-gray-500'>-</div>
                      )}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='text-sm text-gray-300'>
                        {emp.completed_sessions}
                        {emp.is_clocked_in && ' + 1 active'}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Footer */}
      {sortedEmployees.length > 0 && (
        <div className='glass p-4 rounded-lg'>
          <div className='flex items-center justify-between text-sm'>
            <span className='text-gray-400'>
              Showing {sortedEmployees.length} of {employees.length} employees
            </span>
            <span className='text-gray-400'>
              Total Hours Today:{' '}
              <span className='text-white font-semibold'>
                {sortedEmployees
                  .reduce((sum, e) => sum + e.total_hours_today, 0)
                  .toFixed(2)}{' '}
                hrs
              </span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
