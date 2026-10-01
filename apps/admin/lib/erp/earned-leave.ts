/**
 * Earned leave — one day for every off day an employee works at least
 * EARNED_LEAVE_MIN_HOURS on.
 *
 * An off day is any Saturday except the first of the month, every Sunday,
 * and every non-floater company holiday (a floater is an opt-in day the
 * office stays open on, so working it is ordinary work). The first Saturday
 * is a working day for attendance but not for payroll, and earns nothing
 * here either. Hours are what the employee's time logs say, not anything
 * typed into attendance.
 *
 * Earned leave never adds to pay. Off days aren't payroll working days, so
 * the work itself is not salaried, and payroll never reads this balance —
 * it is only spent by taking leave on a working day (an approved earned
 * leave request, or a paid-leave change request), which payroll prices as
 * an ordinary paid-leave day.
 *
 * The balance is derived from that history rather than accrued by a
 * separate step: syncEarnedLeaveBalance recomputes total_allocated from
 * scratch, and runs whenever a balance is read or checked (see
 * lib/erp/leave-requests.ts), so an approved weekend regularisation shows up
 * as earned leave the next time anyone looks.
 */

import { supabaseServer as supabase } from '@/lib/supabase-server';
import { getNonFloaterHolidayDateSetInRange } from '@/lib/erp/holidays';
import { isAttendanceWorkingDay } from '@/lib/erp/utils';

export const EARNED_LEAVE_MIN_HOURS = 6;

/** Attendance statuses that mean the employee turned up to work that day. */
const WORKED_STATUSES = ['present', 'half-day', 'in_progress'];

/** PostgREST caps a response at 1,000 rows; full-history reads page past it. */
const PAGE_SIZE = 1000;

export interface OffDayWork {
  employee_id: number;
  date: string;
  status: string;
  hours: number;
  /**
   * Every session was clocked out and some hours were logged. A day that
   * isn't recorded can't be priced for earned leave, and blocks payroll for
   * its month until it is fixed (see generatePayrollAction).
   */
  recorded: boolean;
  earns_leave: boolean;
}

function isOffDay(date: string, holidays: Set<string>): boolean {
  const [y, m, d] = date.split('-').map(Number);
  return holidays.has(date) || !isAttendanceWorkingDay(new Date(y, m - 1, d));
}

/**
 * Every off day in [startDate, endDate] that has a worked attendance row,
 * with the hours its time logs add up to. Pass employeeId for one employee,
 * or omit it for everyone.
 */
export async function getOffDayWork(
  startDate: string,
  endDate: string,
  employeeId?: number,
): Promise<OffDayWork[]> {
  const holidays = await getNonFloaterHolidayDateSetInRange(startDate, endDate);

  const offDayRows: { employee_id: number; date: string; status: string }[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    let query = supabase
      .from('attendance')
      .select('employee_id, date, status')
      .in('status', WORKED_STATUSES)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('id')
      .range(from, from + PAGE_SIZE - 1);
    if (employeeId) query = query.eq('employee_id', employeeId);
    const { data, error } = await query;
    if (error) throw error;
    for (const row of data || []) {
      const date = String(row.date).substring(0, 10);
      if (isOffDay(date, holidays)) offDayRows.push({ ...row, date });
    }
    if (!data || data.length < PAGE_SIZE) break;
  }
  if (offDayRows.length === 0) return [];

  const { data: logs, error: logError } = await supabase
    .from('time_logs')
    .select('employee_id, date, total_hours, status')
    .in('employee_id', [...new Set(offDayRows.map((r) => r.employee_id))])
    .in('date', [...new Set(offDayRows.map((r) => r.date))]);
  if (logError) throw logError;

  const logsByKey = new Map<string, { hours: number; open: boolean }>();
  for (const log of logs || []) {
    const key = `${log.employee_id}|${String(log.date).substring(0, 10)}`;
    const entry = logsByKey.get(key) || { hours: 0, open: false };
    entry.hours += Number(log.total_hours) || 0;
    if (log.status === 'active') entry.open = true;
    logsByKey.set(key, entry);
  }

  return offDayRows.map((row) => {
    const logged = logsByKey.get(`${row.employee_id}|${row.date}`) || { hours: 0, open: false };
    const hours = Math.round(logged.hours * 100) / 100;
    const recorded = row.status !== 'in_progress' && !logged.open && hours > 0;
    return {
      ...row,
      hours,
      recorded,
      earns_leave: recorded && hours >= EARNED_LEAVE_MIN_HOURS,
    };
  });
}

/**
 * Recompute one employee's earned leave allocation for a year from their
 * off-day work, and store it. Only total_allocated is ever written —
 * used_days belongs to approved leave and is left alone. Returns the
 * allocation.
 */
export async function syncEarnedLeaveBalance(
  employeeId: number,
  year: number,
): Promise<number> {
  const work = await getOffDayWork(`${year}-01-01`, `${year}-12-31`, employeeId);
  const earned = work.filter((w) => w.earns_leave).length;

  const { data: existing, error } = await supabase
    .from('leave_balances')
    .select('id, total_allocated')
    .eq('employee_id', employeeId)
    .eq('year', year)
    .eq('leave_type', 'earned')
    .maybeSingle();
  if (error) throw error;

  if (existing) {
    if (Number(existing.total_allocated) !== earned) {
      const { error: updateError } = await supabase
        .from('leave_balances')
        .update({ total_allocated: earned, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
      if (updateError) throw updateError;
    }
  } else if (earned > 0) {
    const { error: insertError } = await supabase.from('leave_balances').insert({
      employee_id: employeeId,
      year,
      leave_type: 'earned',
      total_allocated: earned,
      used_days: 0,
    });
    if (insertError) throw insertError;
  }

  return earned;
}

/**
 * Recompute earned leave for every non-temporary employee (active or not)
 * across every year that has attendance — the whole history, not just the
 * current year.
 */
export async function syncAllEarnedLeaveBalances(): Promise<{ employees: number; years: number[] }> {
  const { data: first, error: firstError } = await supabase
    .from('attendance')
    .select('date')
    .order('date', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (firstError) throw firstError;

  const currentYear = new Date().getFullYear();
  const firstYear = first ? Number(String(first.date).substring(0, 4)) : currentYear;
  const years: number[] = [];
  for (let y = firstYear; y <= currentYear; y++) years.push(y);

  const { data: employees, error } = await supabase
    .from('employees')
    .select('id')
    .neq('employment_type', 'temporary');
  if (error) throw error;

  for (const employee of employees || []) {
    for (const year of years) {
      await syncEarnedLeaveBalance(employee.id, year);
    }
  }

  return { employees: (employees || []).length, years };
}
