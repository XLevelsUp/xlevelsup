'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Table, TableRow, TableCell } from './Table';
import Modal from '@/components/ui/Modal';
import AttendanceForm from './AttendanceForm';
import BulkAttendanceForm from './BulkAttendanceForm';
import { DeleteIcon } from './ActionIcons';
import MonthPicker from './MonthPicker';
import type { Employee, Attendance, LeaveBalance, LeaveRequestWithEmployee, TimeLog } from '@/types/erp';
import { formatDisplayDate, formatDateSpan, getMonthName, formatDuration } from '@/lib/erp/utils';
import toast from 'react-hot-toast';
import { deleteAttendanceAction } from '@/actions/erp/attendance';
import { getEmployeeLeaveBalanceAction } from '@/actions/erp/leave-requests';
import DeleteConfirmButton from './DeleteConfirmButton';
import Link from 'next/link';
import { StatTile } from './charts/FinanceCharts';
import {
  PageHeader,
  FilterField,
  FIELD_CLASS,
  FILTER_GRID_CLASS,
  PRIMARY_ACTION_CLASS,
  SECONDARY_ACTION_CLASS,
} from './PageChrome';

interface AttendanceManagerProps {
  employees: Employee[];
  attendance: Attendance[];
  leaveRequests: LeaveRequestWithEmployee[];
  timeLogs: TimeLog[];
  initialMonth: string;
  initialEmployeeId?: number;
  initialIsAllTime?: boolean;
}

export default function AttendanceManager({
  employees,
  attendance,
  leaveRequests,
  timeLogs,
  initialMonth,
  initialEmployeeId,
  initialIsAllTime,
}: AttendanceManagerProps) {
  const router = useRouter();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [month, setMonth] = useState(initialMonth);
  const [employeeId, setEmployeeId] = useState<number | undefined>(
    initialEmployeeId,
  );
  const [isAllTime, setIsAllTime] = useState(initialIsAllTime ?? false);
  const [viewMode, setViewMode] = useState<'table' | 'calendar' | 'leave-report'>('table');
  const [selectedDateStr, setSelectedDateStr] = useState('');
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [loadingLeaveBalances, setLoadingLeaveBalances] = useState(false);

  const applyFilters = (
    overrides?: Partial<{ month: string; employeeId: number | undefined; allTime: boolean }>,
  ) => {
    const next = { month, employeeId, allTime: isAllTime, ...overrides };
    const params = new URLSearchParams();
    params.set('month', next.allTime ? 'all' : next.month);
    if (next.employeeId) params.set('employee_id', next.employeeId.toString());

    router.push(`/erp/attendance?${params.toString()}`);
  };

  // Full History is scoped to one employee — flip it off if the employee
  // filter is cleared while it's active, so it never silently pulls every
  // employee's entire attendance/time-log history at once.
  const handleEmployeeChange = (next: number | undefined) => {
    setEmployeeId(next);
    loadLeaveBalances(next);
    if (!next && isAllTime) {
      setIsAllTime(false);
      if (viewMode === 'calendar') setViewMode('table');
      applyFilters({ employeeId: next, allTime: false });
    } else {
      applyFilters({ employeeId: next });
    }
  };

  const handleToggleAllTime = () => {
    if (!employeeId) return;
    const next = !isAllTime;
    setIsAllTime(next);
    if (next && viewMode === 'calendar') setViewMode('table');
    applyFilters({ allTime: next });
  };

  const loadLeaveBalances = async (empId: number | undefined) => {
    if (!empId) {
      setLeaveBalances([]);
      return;
    }
    setLoadingLeaveBalances(true);
    try {
      const balances = await getEmployeeLeaveBalanceAction(empId);
      setLeaveBalances(balances);
    } catch {
      toast.error('Failed to load leave balances');
      setLeaveBalances([]);
    } finally {
      setLoadingLeaveBalances(false);
    }
  };

  const handleDelete = async (record: Attendance) => {
    const result = await deleteAttendanceAction(
      record.employee_id,
      record.date,
    );
    if (result.success) {
      toast.success('Attendance record deleted.');
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to delete attendance');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-500/20 text-green-400';
      case 'in_progress':
        return 'bg-amber-500/20 text-amber-400';
      case 'absent':
        return 'bg-red-500/20 text-red-400';
      case 'half-day':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'paid-leave':
        return 'bg-blue-500/20 text-blue-400';
      case 'unpaid-leave':
        return 'bg-orange-500/20 text-orange-400';
      case 'holiday':
        return 'bg-purple-500/20 text-purple-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  useEffect(() => {
    loadLeaveBalances(initialEmployeeId);
  }, [initialEmployeeId]);

  const employeeMap = new Map(employees.map((e) => [e.id, e]));

  // Sum time-log hours per employee+date (an employee can have multiple
  // clock-in/out sessions in one day) for the "Hours Worked" column.
  const hoursWorkedByKey = new Map<string, number>();
  timeLogs.forEach((log) => {
    const key = `${log.employee_id}_${log.date}`;
    hoursWorkedByKey.set(key, (hoursWorkedByKey.get(key) || 0) + (log.total_hours || 0));
  });

  // Local YYYY-MM-DD key — never toISOString(), which shifts the date by a
  // day in timezones ahead of UTC (e.g. IST).
  const formatDateKey = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Group all (already month/employee-filtered) attendance records by date
  const attendanceByDate = new Map<string, Attendance[]>();
  attendance.forEach((record) => {
    const dateStr = record.date.split('T')[0];
    if (!attendanceByDate.has(dateStr)) attendanceByDate.set(dateStr, []);
    attendanceByDate.get(dateStr)!.push(record);
  });

  // Build a 42-cell (6-week) calendar grid for the selected month
  const getCalendarDays = () => {
    const [yearStr, monthStr] = month.split('-');
    const year = parseInt(yearStr, 10);
    const monthIdx = parseInt(monthStr, 10) - 1;

    const firstDayIndex = new Date(year, monthIdx, 1).getDay();
    const totalDays = new Date(year, monthIdx + 1, 0).getDate();
    const prevMonthTotalDays = new Date(year, monthIdx, 0).getDate();

    const days: { date: Date; isCurrentMonth: boolean; dayNum: number }[] = [];

    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, monthIdx - 1, prevMonthTotalDays - i),
        isCurrentMonth: false,
        dayNum: prevMonthTotalDays - i,
      });
    }
    for (let i = 1; i <= totalDays; i++) {
      days.push({ date: new Date(year, monthIdx, i), isCurrentMonth: true, dayNum: i });
    }
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ date: new Date(year, monthIdx + 1, i), isCurrentMonth: false, dayNum: i });
    }
    return days;
  };

  const STATUS_ORDER: Attendance['status'][] = [
    'present',
    'in_progress',
    'absent',
    'half-day',
    'paid-leave',
    'unpaid-leave',
    'holiday',
  ];
  const STATUS_SHORT: Record<string, string> = {
    present: 'P',
    in_progress: 'IP',
    absent: 'A',
    'half-day': 'H',
    'paid-leave': 'PL',
    'unpaid-leave': 'UL',
    holiday: 'HO',
  };

  const calendarDays = getCalendarDays();
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Solid twin of getStatusColor, for the calendar's narrow-screen dots.
  const STATUS_DOT: Record<string, string> = {
    present: 'bg-green-400',
    in_progress: 'bg-amber-400',
    absent: 'bg-red-400',
    'half-day': 'bg-yellow-400',
    'paid-leave': 'bg-blue-400',
    'unpaid-leave': 'bg-orange-400',
    holiday: 'bg-purple-400',
  };

  const statusLabel = (record: Attendance) =>
    `${record.status.replace(/[-_]/g, ' ')}${
      record.status === 'half-day' && record.half_day_period
        ? ` (${record.half_day_period === 'first_half' ? 'Morning' : 'Afternoon'})`
        : ''
    }`;

  const renderStatus = (record: Attendance) => (
    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap capitalize ${getStatusColor(record.status)}`}>
      {statusLabel(record)}
    </span>
  );

  const renderDelete = (record: Attendance) => (
    <DeleteConfirmButton
      onConfirm={() => handleDelete(record)}
      message='Delete this attendance record?'
      title='Delete'
      ariaLabel='Delete'
      className='p-1 text-red-400 hover:text-red-300 transition-colors'
    >
      <DeleteIcon />
    </DeleteConfirmButton>
  );

  const VIEW_OPTIONS: { id: typeof viewMode; label: string }[] = [
    { id: 'table', label: 'Records' },
    // Calendar is a single month; it's hidden while Full History is on.
    ...(isAllTime ? [] : [{ id: 'calendar' as const, label: 'Calendar' }]),
    { id: 'leave-report', label: 'Leave report' },
  ];

  return (
    <div className='@container pb-20'>
      <PageHeader
        title='Attendance'
        description='Daily attendance for everyone — record it, correct it, and see the month at a glance.'
        actions={
          <>
            <Link href='/erp/attendance/sessions' className={SECONDARY_ACTION_CLASS}>
              Sessions
            </Link>
            <button type='button' onClick={() => setShowBulkModal(true)} className={SECONDARY_ACTION_CLASS}>
              Bulk update
            </button>
            <button type='button' onClick={() => setShowAddModal(true)} className={PRIMARY_ACTION_CLASS}>
              {/* Shortened on a phone so the three buttons share one row. */}
              <span className='@md:hidden'>+ Add</span>
              <span className='hidden @md:inline'>+ Add attendance</span>
            </button>
          </>
        }
      />

      {/* Filters */}
      <div className='glass p-4 rounded-lg mb-6'>
        <div className={FILTER_GRID_CLASS}>
          <FilterField label='Month'>
            {isAllTime ? (
              <div className='w-full px-3 py-1.5 rounded-lg bg-dark-800/60 border border-dashed border-gray-700 text-gray-400 text-sm truncate'>
                Entire history — month filter off
              </div>
            ) : (
              <MonthPicker
                compact
                value={month}
                onChange={(next) => {
                  setMonth(next);
                  applyFilters({ month: next });
                }}
              />
            )}
          </FilterField>
          <FilterField label='Employee'>
            <select
              value={employeeId || ''}
              onChange={(e) => {
                const next = e.target.value ? parseInt(e.target.value) : undefined;
                handleEmployeeChange(next);
              }}
              className={FIELD_CLASS}
            >
              <option value=''>All Employees</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.employee_id})
                </option>
              ))}
            </select>
          </FilterField>
        </div>

        <div className='mt-4 pt-4 border-t border-gray-800 flex items-center justify-between gap-3 flex-wrap'>
          <p className='text-xs text-gray-500 min-w-0 flex-1 basis-60'>
            {employeeId
              ? 'See this employee’s whole attendance history since they joined, instead of one month at a time.'
              : 'Pick an employee to see their full history.'}
          </p>
          <button
            type='button'
            onClick={handleToggleAllTime}
            disabled={!employeeId}
            aria-pressed={isAllTime}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-all ${
              isAllTime
                ? 'bg-gradient-to-r from-cyan to-purple text-white shadow-md'
                : employeeId
                  ? 'border border-gray-700 text-gray-300 hover:border-cyan hover:text-cyan'
                  : 'border border-gray-800 text-gray-600 cursor-not-allowed'
            }`}
          >
            {isAllTime ? 'Back to month view' : 'Full history'}
          </button>
        </div>
      </div>

      {/* Leave Balances for selected employee */}
      {employeeId && (
        <div className='glass p-4 rounded-lg mb-6'>
          <h3 className='text-sm font-semibold text-white mb-3 [overflow-wrap:anywhere]'>
            Leave balance — {employeeMap.get(employeeId)?.name}
          </h3>
          {loadingLeaveBalances ? (
            <p className='text-xs text-gray-400'>Loading leave balances...</p>
          ) : leaveBalances.filter((b) => b.leave_type !== 'wfh').length === 0 ? (
            <p className='text-xs text-gray-500 italic'>
              No leave balances found for this employee.
            </p>
          ) : (
            <div className='grid grid-cols-2 @md:grid-cols-4 gap-3'>
              {leaveBalances
                .filter((balance) => balance.leave_type !== 'wfh')
                .map((balance) => (
                <div
                  key={balance.id}
                  className='bg-dark-800/40 border border-gray-800/60 rounded-lg px-3 py-2 min-w-0'
                >
                  <p className='text-[10px] uppercase tracking-wider text-gray-500 truncate'>
                    {balance.leave_type.replace(/[-_]/g, ' ')}
                  </p>
                  <p
                    className={`text-lg font-bold tabular-nums ${
                      balance.remaining_days > 5
                        ? 'text-green-400'
                        : balance.remaining_days > 0
                          ? 'text-yellow-400'
                          : 'text-red-400'
                    }`}
                  >
                    {balance.remaining_days}
                    <span className='text-xs text-gray-400 font-normal'>
                      {' '}
                      / {balance.total_allocated}
                    </span>
                  </p>
                  <p className='text-[10px] text-gray-500'>
                    Used: {balance.used_days}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div className='grid grid-cols-2 @3xl:grid-cols-4 gap-3 @xl:gap-4 mb-6'>
        <StatTile label='Records' value={attendance.length} />
        <StatTile
          label='Present'
          value={<span className='text-green-400'>{attendance.filter((a) => a.status === 'present').length}</span>}
        />
        <StatTile
          label='Absent'
          value={<span className='text-red-400'>{attendance.filter((a) => a.status === 'absent').length}</span>}
        />
        <StatTile
          label='Leave'
          value={
            <span className='text-blue-400'>
              {attendance.filter((a) => a.status === 'paid-leave' || a.status === 'unpaid-leave').length}
            </span>
          }
        />
      </div>

      {/* View Toggle */}
      <div role='group' aria-label='View' className='flex items-center gap-1 bg-[#0a0a0a] border border-gray-800 p-1 rounded-lg mb-4 w-fit max-w-full'>
        {VIEW_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type='button'
            onClick={() => setViewMode(opt.id)}
            aria-pressed={viewMode === opt.id}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap transition-all border focus-visible:outline-2 focus-visible:outline-[var(--cyan)] ${
              viewMode === opt.id ? 'bg-cyan/10 text-cyan border-cyan/25' : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Attendance Records */}
      {viewMode === 'table' && (
        <div className='glass rounded-lg overflow-hidden'>
          {attendance.length === 0 ? (
            <div className='text-center py-14 px-4'>
              <p className='text-gray-300 font-medium'>
                No attendance recorded{isAllTime ? '' : ` for ${getMonthName(month)}`}
              </p>
              <p className='text-sm text-gray-500 mt-1'>Add a day for one person, or use Bulk update for the whole team.</p>
              <button type='button' onClick={() => setShowAddModal(true)} className={`${PRIMARY_ACTION_CLASS} mt-5`}>
                + Add attendance
              </button>
            </div>
          ) : (
            <>
              {/* Wide containers: the table — department rides under the
                  employee's name, which keeps it to six columns. */}
              <div className='hidden @min-[48rem]:block'>
                <Table compact headers={['Date', 'Employee', 'Status', 'Hours Worked', 'Notes', '']}>
                  {attendance.map((record) => {
                    const employee = employeeMap.get(record.employee_id);
                    const hoursWorked = hoursWorkedByKey.get(`${record.employee_id}_${record.date.split('T')[0]}`);
                    return (
                      <TableRow key={`${record.employee_id}-${record.date}`}>
                        <TableCell className='whitespace-nowrap font-medium text-white'>
                          {formatDisplayDate(record.date)}
                        </TableCell>
                        <TableCell className='min-w-40'>
                          <p className='font-medium text-white'>{employee?.name}</p>
                          <p className='text-xs text-gray-500'>
                            {employee?.employee_id}
                            {employee?.department && <> · {employee.department}</>}
                          </p>
                        </TableCell>
                        <TableCell>{renderStatus(record)}</TableCell>
                        <TableCell className='whitespace-nowrap text-xs text-gray-300 tabular-nums'>
                          {hoursWorked ? formatDuration(hoursWorked, false) : '—'}
                        </TableCell>
                        <TableCell className='max-w-56 text-xs text-gray-400'>
                          <p className='truncate' title={record.notes || ''}>{record.notes || '—'}</p>
                        </TableCell>
                        <TableCell>{renderDelete(record)}</TableCell>
                      </TableRow>
                    );
                  })}
                </Table>
              </div>

              {/* Narrow containers: one card per record. */}
              <ul className='@min-[48rem]:hidden grid grid-cols-1 @md:grid-cols-2 -mb-px'>
                {attendance.map((record) => {
                  const employee = employeeMap.get(record.employee_id);
                  const hoursWorked = hoursWorkedByKey.get(`${record.employee_id}_${record.date.split('T')[0]}`);
                  return (
                    <li
                      key={`${record.employee_id}-${record.date}`}
                      className='p-4 min-w-0 border-b border-gray-800/70 @md:odd:border-r'
                    >
                      <div className='flex items-start justify-between gap-3'>
                        <div className='min-w-0'>
                          <p className='font-semibold text-white [overflow-wrap:anywhere]'>{employee?.name}</p>
                          <p className='text-xs text-gray-500'>
                            {formatDisplayDate(record.date)} · {employee?.employee_id}
                          </p>
                        </div>
                        <div className='shrink-0'>{renderStatus(record)}</div>
                      </div>
                      <div className='mt-3 flex items-center justify-between gap-3'>
                        <p className='text-xs text-gray-400 min-w-0'>
                          <span className='text-gray-200 tabular-nums'>
                            {hoursWorked ? formatDuration(hoursWorked, false) : 'No hours logged'}
                          </span>
                          {record.notes && <span className='block truncate text-gray-500'>{record.notes}</span>}
                        </p>
                        {renderDelete(record)}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      )}

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <div className='space-y-4'>
          <div className='bg-[#0a0a0a] border border-gray-800 rounded-lg p-3 @xl:p-4'>
            <p className='text-xs text-gray-500 mb-3'>
              {getMonthName(month)} for{' '}
              <span className='text-gray-300 font-medium'>
                {employeeId ? employeeMap.get(employeeId)?.name || 'selected employee' : 'all employees'}
              </span>
              . Pick a day to see who was in.
            </p>

            {/* Weekday headers */}
            <div className='grid grid-cols-7 gap-1 text-center font-bold text-[10px] @xl:text-xs text-gray-500 uppercase tracking-wider mb-2 border-b border-gray-800/40 pb-2'>
              {weekdays.map((day) => (
                <div key={day} className='py-1'>
                  {day}
                </div>
              ))}
            </div>

            {/* Days grid. Wide: a count chip per status. Narrow: one dot per
                status present — the chips ("P 5", "IP 2") wrapped past the
                bottom of a 40px-wide cell and over the next row. */}
            <div className='grid grid-cols-7 gap-1 @xl:gap-2'>
              {calendarDays.map((day, idx) => {
                const dateStr = formatDateKey(day.date);
                const dayRecords = attendanceByDate.get(dateStr) || [];
                const isToday = formatDateKey(new Date()) === dateStr;
                const isSelected = selectedDateStr === dateStr;

                const counts: Partial<Record<string, number>> = {};
                dayRecords.forEach((r) => {
                  counts[r.status] = (counts[r.status] || 0) + 1;
                });
                const presentStatuses = STATUS_ORDER.filter((s) => counts[s]);

                return (
                  <button
                    key={`${dateStr}-${idx}`}
                    onClick={() => day.isCurrentMonth && setSelectedDateStr(dateStr)}
                    disabled={!day.isCurrentMonth}
                    aria-pressed={isSelected}
                    aria-label={
                      day.isCurrentMonth
                        ? `${formatDisplayDate(dateStr)}: ${dayRecords.length} record${dayRecords.length === 1 ? '' : 's'}`
                        : undefined
                    }
                    className={`min-w-0 flex flex-col justify-between items-start p-1 @xl:p-2 h-14 @xl:h-24 border rounded-lg transition-all text-left overflow-hidden ${
                      day.isCurrentMonth
                        ? 'bg-[#111111]/30 hover:bg-[#1a1a1a]/60 border-gray-800/30 cursor-pointer'
                        : 'bg-transparent border-transparent opacity-20 pointer-events-none'
                    } ${isToday ? 'ring-2 ring-[var(--cyan)] ring-offset-2 ring-offset-black' : ''} ${
                      isSelected ? 'border-[var(--cyan)]' : ''
                    }`}
                  >
                    <div className='flex justify-between items-center w-full'>
                      <span
                        className={`text-xs font-bold tabular-nums ${
                          isToday ? 'text-[var(--cyan)]' : day.isCurrentMonth ? 'text-gray-300' : 'text-gray-600'
                        }`}
                      >
                        {day.dayNum}
                      </span>
                      {isToday && (
                        <span className='text-[8px] bg-[var(--cyan)]/20 text-[var(--cyan)] px-1 rounded-sm hidden @xl:inline'>
                          Today
                        </span>
                      )}
                    </div>

                    {dayRecords.length > 0 && (
                      <>
                        <div className='@xl:hidden flex flex-wrap gap-0.5 mt-auto' aria-hidden='true'>
                          {presentStatuses.map((s) => (
                            <span key={s} className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[s] || 'bg-gray-400'}`} />
                          ))}
                        </div>
                        <div className='hidden @xl:flex w-full flex-wrap gap-0.5 mt-auto'>
                          {presentStatuses.map((s) => (
                            <span
                              key={s}
                              className={`text-[8px] font-bold px-1 rounded leading-tight ${getStatusColor(s)}`}
                            >
                              {STATUS_SHORT[s]}&nbsp;{counts[s]}
                            </span>
                          ))}
                        </div>
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className='flex flex-wrap gap-x-4 gap-y-2 bg-[#0a0a0a] border border-gray-800 rounded-lg p-3 text-xs justify-center'>
            {STATUS_ORDER.map((s) => (
              <div key={s} className='flex items-center gap-1.5 whitespace-nowrap'>
                <span className={`h-2.5 w-2.5 rounded-full inline-block ${STATUS_DOT[s]}`}></span>
                <span className='text-gray-300 capitalize'>
                  <span className='hidden @xl:inline'>{STATUS_SHORT[s]} = </span>
                  {s.replace(/[-_]/g, ' ')}
                </span>
              </div>
            ))}
          </div>

          {/* Selected Date Breakdown */}
          {selectedDateStr && (
            <div className='bg-[#111111]/80 border border-gray-800 rounded-lg p-4 space-y-3'>
              <div className='flex items-center justify-between gap-3 border-b border-gray-800 pb-2'>
                <h3 className='text-sm font-semibold text-white'>
                  Attendance on {formatDisplayDate(selectedDateStr)}
                </h3>
                <button
                  type='button'
                  onClick={() => setSelectedDateStr('')}
                  className='text-xs text-gray-400 hover:text-white transition-colors whitespace-nowrap'
                >
                  Close ×
                </button>
              </div>

              {(() => {
                const dayRecords = attendanceByDate.get(selectedDateStr) || [];
                if (dayRecords.length === 0) {
                  return (
                    <p className='text-xs text-gray-500 italic'>
                      No attendance records for this date.
                    </p>
                  );
                }

                const recordedIds = new Set(dayRecords.map((r) => r.employee_id));
                const missingEmployees = employeeId
                  ? []
                  : employees.filter((e) => !recordedIds.has(e.id));

                return (
                  <>
                    <div className='grid grid-cols-1 @xl:grid-cols-2 gap-2'>
                      {dayRecords.map((record) => {
                        const employee = employeeMap.get(record.employee_id);
                        return (
                          <div
                            key={record.id}
                            className='flex items-center justify-between gap-3 bg-dark-800/40 border border-gray-800/60 rounded-lg px-3 py-2 text-xs min-w-0'
                          >
                            <div className='min-w-0'>
                              <div className='font-medium text-white truncate'>{employee?.name || 'Unknown'}</div>
                              <div className='text-gray-500 truncate'>
                                {employee?.employee_id} · {employee?.department}
                              </div>
                            </div>
                            <span
                              className={`shrink-0 px-2 py-1 rounded-full text-[10px] font-medium whitespace-nowrap capitalize ${getStatusColor(
                                record.status,
                              )}`}
                            >
                              {statusLabel(record)}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {missingEmployees.length > 0 && (
                      <div className='pt-2 border-t border-gray-800'>
                        <p className='text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5'>
                          No record for this date ({missingEmployees.length})
                        </p>
                        <div className='flex flex-wrap gap-1.5'>
                          {missingEmployees.map((e) => (
                            <span
                              key={e.id}
                              className='text-[10px] text-gray-400 bg-gray-800/60 px-2 py-1 rounded'
                            >
                              {e.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* Leave Report View */}
      {viewMode === 'leave-report' && (
        <div className='space-y-6'>
          {(() => {
            // WFH is a work arrangement, not leave — the employee still
            // worked that day, so it must not count toward "days used" or
            // appear in this leave report (leave balances already exclude
            // it the same way — see the leaveBalances filter above).
            const nonWfhLeaveRequests = leaveRequests.filter((req) => req.leave_type !== 'wfh');

            const totalsByEmployee = new Map<
              number,
              { name: string; employeeIdDisplay: string; department: string; totalDays: number; count: number }
            >();
            nonWfhLeaveRequests.forEach((req) => {
              const existing = totalsByEmployee.get(req.employee_id);
              if (existing) {
                existing.totalDays += Number(req.total_days);
                existing.count += 1;
              } else {
                totalsByEmployee.set(req.employee_id, {
                  name: req.employee_name,
                  employeeIdDisplay: req.employee_id_display,
                  department: req.employee_department,
                  totalDays: Number(req.total_days),
                  count: 1,
                });
              }
            });
            const summaryRows = Array.from(totalsByEmployee.values()).sort(
              (a, b) => b.totalDays - a.totalDays,
            );
            const sortedRequests = [...nonWfhLeaveRequests].sort(
              (a, b) => (a.start_date < b.start_date ? 1 : -1),
            );
            const grandTotalDays = summaryRows.reduce((sum, r) => sum + r.totalDays, 0);

            return (
              <>
                {/* Per-employee summary — three short columns (department
                    under the name), so it fits a phone without scrolling. */}
                <div className='glass rounded-lg overflow-hidden'>
                  <div className='px-4 pt-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1'>
                    <h3 className='text-sm font-semibold text-white'>
                      Leave used {employeeId ? `— ${employeeMap.get(employeeId)?.name}` : 'by employee'}
                    </h3>
                    <span className='text-xs text-gray-400'>
                      <span className='text-white font-medium tabular-nums'>{grandTotalDays}</span> days across{' '}
                      {nonWfhLeaveRequests.length} approved request{nonWfhLeaveRequests.length === 1 ? '' : 's'}
                    </span>
                  </div>
                  {summaryRows.length === 0 ? (
                    <p className='text-xs text-gray-500 italic px-4 py-6'>
                      No approved leave found{employeeId ? ' for this employee' : ''}.
                    </p>
                  ) : (
                    <div className='mt-3'>
                      <Table compact headers={['Employee', 'Requests', 'Days used']}>
                        {summaryRows.map((row) => (
                          <TableRow key={row.employeeIdDisplay}>
                            <TableCell>
                              <p className='font-medium text-white'>{row.name}</p>
                              <p className='text-xs text-gray-500'>
                                {row.employeeIdDisplay} · {row.department}
                              </p>
                            </TableCell>
                            <TableCell className='tabular-nums'>{row.count}</TableCell>
                            <TableCell>
                              <span className='font-semibold text-blue-400 tabular-nums'>{row.totalDays}</span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </Table>
                    </div>
                  )}
                </div>

                {/* Detailed leave dates — a list rather than a five-column
                    table: each entry is who, when and why, which reads
                    naturally at any width. */}
                <div className='glass rounded-lg overflow-hidden'>
                  <h3 className='text-sm font-semibold text-white px-4 pt-4'>Leave details</h3>
                  {sortedRequests.length === 0 ? (
                    <p className='text-xs text-gray-500 italic px-4 py-6'>
                      No approved leave records to show.
                    </p>
                  ) : (
                    <ul className='mt-3 divide-y divide-gray-800/70 border-t border-gray-800/70'>
                      {sortedRequests.map((req) => (
                        <li key={req.id} className='px-4 py-3 flex flex-col @xl:flex-row @xl:items-center gap-x-4 gap-y-1.5 min-w-0'>
                          <div className='@xl:w-48 shrink-0 min-w-0'>
                            <p className='text-sm font-medium text-white truncate'>{req.employee_name}</p>
                            <p className='text-xs text-gray-500'>{req.employee_id_display}</p>
                          </div>
                          <div className='flex flex-wrap items-center gap-2 @xl:w-64 shrink-0'>
                            <span className='px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 capitalize whitespace-nowrap'>
                              {req.leave_type}
                            </span>
                            <span className='text-sm text-gray-200 whitespace-nowrap'>
                              {formatDateSpan(req.start_date, req.end_date)}
                            </span>
                            <span className='text-xs text-gray-500 whitespace-nowrap'>
                              {req.is_half_day
                                ? `Half day${req.half_day_period ? `, ${req.half_day_period === 'first_half' ? 'morning' : 'afternoon'}` : ''}`
                                : `${req.total_days} day${Number(req.total_days) === 1 ? '' : 's'}`}
                            </span>
                          </div>
                          <p className='text-xs text-gray-400 min-w-0 flex-1 [overflow-wrap:anywhere]'>{req.reason || '—'}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* Add Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title='Add Attendance Record'
      >
        <AttendanceForm
          employees={employees}
          onSuccess={() => {
            setShowAddModal(false);
            router.refresh();
          }}
        />
      </Modal>

      {/* Bulk Update Modal */}
      <Modal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        title='Bulk Update Attendance'
      >
        <BulkAttendanceForm
          employees={employees}
          onSuccess={() => {
            setShowBulkModal(false);
            router.refresh();
          }}
        />
      </Modal>
    </div>
  );
}
