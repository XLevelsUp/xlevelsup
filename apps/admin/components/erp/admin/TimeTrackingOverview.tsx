'use client';

/**
 * Admin Time Tracking Overview Component
 * Shows real-time status of all employees' clock in/out
 */

import { useState } from 'react';
import type { EmployeeTimeStatus } from '@/lib/erp/time-tracking-admin';
import { formatDuration } from '@/lib/erp/utils';
import { Table, TableRow, TableCell } from '../Table';
import { StatusChips, FIELD_CLASS } from '../PageChrome';

interface TimeTrackingOverviewProps {
  employees: EmployeeTimeStatus[];
  /** Headline stat tiles, rendered beside the team bar in one grid. */
  tiles?: React.ReactNode;
}

/** A full working day — the "Completed" threshold used across this page. */
const FULL_DAY_HOURS = 9;

type DayState = 'working' | 'paused' | 'completed' | 'on_leave' | 'not_started';

/**
 * Where someone's day stands. One function, so the badge, the team bar and
 * the sort order can't disagree — same precedence the old badge used:
 * clocked in, then a full day done, then on leave, then partly worked.
 */
function dayStateOf(emp: EmployeeTimeStatus): DayState {
  if (emp.is_clocked_in) return 'working';
  if (emp.total_hours_today >= FULL_DAY_HOURS) return 'completed';
  if (emp.status === 'on_leave') return 'on_leave';
  if (emp.total_hours_today > 0) return 'paused';
  return 'not_started';
}

// Left-to-right order of the team bar, and each state's colours.
const DAY_STATES: { id: DayState; label: string; bar: string; badge: string; icon: string }[] = [
  { id: 'working', label: 'Working', bar: 'bg-green-500', badge: 'bg-green-500/20 text-green-400', icon: '🟢' },
  { id: 'paused', label: 'Paused', bar: 'bg-yellow-400', badge: 'bg-yellow-500/20 text-yellow-400', icon: '⏸️' },
  { id: 'completed', label: 'Completed', bar: 'bg-blue-500', badge: 'bg-blue-500/20 text-blue-400', icon: '✅' },
  { id: 'on_leave', label: 'On leave', bar: 'bg-orange-400', badge: 'bg-orange-500/20 text-orange-400', icon: '🏖️' },
  { id: 'not_started', label: 'Not started', bar: 'bg-gray-600', badge: 'bg-gray-500/20 text-gray-400', icon: '⚪' },
];

const formatClock = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

export default function TimeTrackingOverview({ employees, tiles }: TimeTrackingOverviewProps) {
  const [filter, setFilter] = useState<'all' | 'working' | 'completed' | 'not_started' | 'on_leave'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const stateCounts = Object.fromEntries(
    DAY_STATES.map((s) => [s.id, employees.filter((e) => dayStateOf(e) === s.id).length]),
  ) as Record<DayState, number>;

  // Filter employees
  const filteredEmployees = employees.filter((emp) => {
    const matchesFilter =
      filter === 'all' ||
      (filter === 'working' && emp.is_clocked_in) ||
      (filter === 'completed' && !emp.is_clocked_in && emp.total_hours_today >= FULL_DAY_HOURS) ||
      (filter === 'on_leave' && emp.status === 'on_leave') ||
      (filter === 'not_started' && emp.status === 'not_started');

    const matchesSearch =
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employee_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.department.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  // Sort: working first, then completed, then on_leave, then not_started, within each group by hours
  const sortedEmployees = [...filteredEmployees].sort((a, b) => {
    const priority = (e: EmployeeTimeStatus) => {
      if (e.is_clocked_in) return 0;
      if (e.status === 'completed') return 1;
      if (e.status === 'on_leave') return 2;
      return 3;
    };
    const pa = priority(a);
    const pb = priority(b);
    if (pa !== pb) return pa - pb;
    return b.total_hours_today - a.total_hours_today;
  });

  const getStatusBadge = (emp: EmployeeTimeStatus) => {
    const state = DAY_STATES.find((s) => s.id === dayStateOf(emp))!;
    const label =
      state.id === 'on_leave'
        ? `On ${emp.leave_type ? emp.leave_type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'Leave'}`
        : state.label;
    return (
      <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${state.badge}`}>
        <span aria-hidden='true'>{state.icon}</span> {label}
      </span>
    );
  };

  const getHoursColor = (hours: number) => {
    if (hours >= FULL_DAY_HOURS) return 'text-green-400';
    if (hours >= FULL_DAY_HOURS / 2) return 'text-yellow-400';
    return 'text-gray-400';
  };

  const renderHours = (emp: EmployeeTimeStatus) => (
    <div className='tabular-nums whitespace-nowrap'>
      <p className={`text-sm font-semibold ${getHoursColor(emp.total_hours_today)}`}>
        {formatDuration(emp.total_hours_today, true)}
      </p>
      {emp.total_hours_today < FULL_DAY_HOURS && (
        <p className='text-xs text-gray-500'>{formatDuration(FULL_DAY_HOURS - emp.total_hours_today, true)} to go</p>
      )}
    </div>
  );

  // 'Session in progress' / '2 done + 1 active' / '3 sessions' — the old
  // '0 + 1 active' read like arithmetic.
  const sessionsLabel = (emp: EmployeeTimeStatus) => {
    if (emp.is_clocked_in) {
      return emp.completed_sessions > 0 ? `${emp.completed_sessions} done + 1 active` : 'Session in progress';
    }
    return `${emp.completed_sessions} session${emp.completed_sessions === 1 ? '' : 's'}`;
  };

  return (
    <div className='space-y-6'>
      {/* Tiles + the team bar. Every person is exactly one of five states,
          so one bar split by state shows the whole team's day at a glance —
          the same "where does everyone stand" read Payroll's run bar gives. */}
      <div className='grid grid-cols-2 @3xl:grid-cols-4 gap-3 @xl:gap-4'>
        {tiles}
        <div className='glass p-4 @xl:p-5 rounded-lg col-span-2 min-w-0'>
          <div className='flex items-baseline justify-between gap-3'>
            <p className='text-[11px] @xl:text-xs font-semibold text-gray-500 uppercase tracking-wider truncate'>
              Team today
            </p>
            <p className='text-xs text-gray-400 tabular-nums whitespace-nowrap'>
              <span className='text-white font-semibold'>{stateCounts.completed}</span> of {employees.length} done a full day
            </p>
          </div>
          <div
            role='img'
            aria-label={DAY_STATES.map((s) => `${stateCounts[s.id]} ${s.label.toLowerCase()}`).join(', ')}
            className='mt-3 flex gap-0.5 h-2.5 rounded-full overflow-hidden bg-gray-800'
          >
            {DAY_STATES.map(
              (s) =>
                stateCounts[s.id] > 0 && (
                  <div key={s.id} className={`${s.bar} transition-all duration-500`} style={{ flexGrow: stateCounts[s.id] }} />
                ),
            )}
          </div>
          <ul className='mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400'>
            {DAY_STATES.map((s) => (
              <li key={s.id} className='flex items-center gap-1.5 whitespace-nowrap'>
                <span className={`w-2 h-2 rounded-full ${s.bar}`} aria-hidden='true' />
                <span className='text-white font-semibold tabular-nums'>{stateCounts[s.id]}</span> {s.label}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className='space-y-4'>
        {/* Search + status filter. The chips wrap onto further rows on a
            phone instead of running off the side of the screen. */}
        <div className='flex flex-col @3xl:flex-row @3xl:items-center gap-3'>
          <input
            type='search'
            aria-label='Search employees'
            placeholder='Search by name, ID or department…'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`${FIELD_CLASS} @3xl:max-w-xs`}
          />
          <StatusChips
            label='Filter by today’s status'
            value={filter}
            onChange={(v) => setFilter(v as typeof filter)}
            options={[
              { value: 'all', label: 'All', count: employees.length, tone: 'all' },
              { value: 'working', label: 'Working', count: employees.filter((e) => e.is_clocked_in).length, tone: 'approved' },
              {
                value: 'completed',
                label: 'Completed',
                count: employees.filter((e) => !e.is_clocked_in && e.total_hours_today >= FULL_DAY_HOURS).length,
                tone: 'info',
              },
              { value: 'not_started', label: 'Not started', count: employees.filter((e) => e.status === 'not_started').length, tone: 'cancelled' },
              { value: 'on_leave', label: 'On leave', count: employees.filter((e) => e.status === 'on_leave').length, tone: 'warning' },
            ]}
          />
        </div>

        <div className='glass rounded-lg overflow-hidden'>
          {sortedEmployees.length === 0 ? (
            <p className='px-4 py-14 text-center text-gray-400'>No one matches this search and filter.</p>
          ) : (
            <>
              {/* Wide containers: the table. */}
              <div className='hidden @min-[46rem]:block'>
                <Table compact headers={['Employee', 'Department', 'Status', 'Hours Today', 'Clocked In', 'Sessions']}>
                  {sortedEmployees.map((emp) => (
                    <TableRow key={emp.employee_id}>
                      <TableCell className='min-w-36'>
                        <p className='text-sm font-medium text-white'>{emp.name}</p>
                        <p className='text-xs text-gray-500'>{emp.employee_code}</p>
                      </TableCell>
                      <TableCell className='whitespace-nowrap text-gray-300'>{emp.department}</TableCell>
                      <TableCell>{getStatusBadge(emp)}</TableCell>
                      <TableCell>{renderHours(emp)}</TableCell>
                      <TableCell className='whitespace-nowrap text-gray-300 tabular-nums'>
                        {emp.clock_in_time ? formatClock(emp.clock_in_time) : <span className='text-gray-500'>—</span>}
                      </TableCell>
                      <TableCell className='whitespace-nowrap text-gray-300'>{sessionsLabel(emp)}</TableCell>
                    </TableRow>
                  ))}
                </Table>
              </div>

              {/* Narrow containers: one card per person. */}
              <ul className='@min-[46rem]:hidden grid grid-cols-1 @md:grid-cols-2 -mb-px'>
                {sortedEmployees.map((emp) => (
                  <li key={emp.employee_id} className='p-4 min-w-0 border-b border-gray-800/70 @md:odd:border-r'>
                    <div className='flex items-start justify-between gap-3'>
                      <div className='min-w-0'>
                        <p className='text-sm font-semibold text-white [overflow-wrap:anywhere]'>{emp.name}</p>
                        <p className='text-xs text-gray-500'>
                          {emp.employee_code} · {emp.department}
                        </p>
                      </div>
                      <div className='shrink-0'>{getStatusBadge(emp)}</div>
                    </div>
                    <div className='mt-3 flex items-end justify-between gap-3'>
                      {renderHours(emp)}
                      <p className='text-xs text-gray-500 text-right'>
                        {emp.clock_in_time ? <>In at {formatClock(emp.clock_in_time)}<br /></> : null}
                        {sessionsLabel(emp)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        {/* Summary Footer */}
        <div className='flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm text-gray-400 px-1'>
          <span>
            Showing {sortedEmployees.length} of {employees.length} people
          </span>
          <span>
            Hours shown:{' '}
            <span className='text-white font-semibold tabular-nums'>
              {formatDuration(
                sortedEmployees.reduce((sum, e) => sum + e.total_hours_today, 0),
                true,
              )}
            </span>
          </span>
        </div>
        <p className='text-xs text-gray-500 px-1'>
          Hours include every clock-in session today. People clock in and out from their own portal.
        </p>
      </div>
    </div>
  );
}
