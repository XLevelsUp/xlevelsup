/**
 * Once payroll has been generated for an employee's month, the attendance it
 * was priced from is frozen — and so is the approved leave payroll reads
 * alongside it (see resolvePayrollDay in lib/erp/utils.ts). Otherwise the
 * payroll row would silently stop matching attendance, and a paid month
 * could never be reconciled.
 *
 * The lock is per employee and month, and lasts as long as any payroll row
 * (draft, approved or paid) exists for it. To correct a month: delete the
 * draft row (an approved one must first be moved back to Draft by an
 * admin), fix attendance, then generate again. Paid months stay frozen.
 */

import { supabaseServer as supabase } from '@/lib/supabase-server';
import { getMonthName } from '@/lib/erp/utils';

/** The distinct YYYY-MM months a set of YYYY-MM-DD dates fall in. */
export function monthsOf(dates: string[]): string[] {
  return [...new Set(dates.map((d) => d.slice(0, 7)))];
}

/** Every YYYY-MM month from `startDate` to `endDate` inclusive (YYYY-MM-DD each). */
export function monthsInRange(startDate: string, endDate: string): string[] {
  const months: string[] = [];
  let [year, month] = startDate.slice(0, 7).split('-').map(Number);
  const last = endDate.slice(0, 7);
  for (;;) {
    const key = `${year}-${String(month).padStart(2, '0')}`;
    months.push(key);
    if (key >= last) break;
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  return months;
}

/**
 * Thrown when a change hits a payroll-locked month. Its own class so actions
 * that otherwise hide error details behind a generic message can still show
 * this one — it's written for the person, not a database error.
 */
export class PayrollLockedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PayrollLockedError';
  }
}

interface LockedPayrollRow {
  month: string;
  status: 'draft' | 'approved' | 'paid';
  employees: { name: string } | null;
}

/**
 * Throw if payroll is already generated for any of these employees in any of
 * these months. `what` names the thing being changed, for the message
 * ("attendance", "leave").
 */
export async function assertPayrollNotGenerated(
  employeeIds: number[],
  months: string[],
  what = 'attendance',
): Promise<void> {
  const ids = [...new Set(employeeIds)];
  const uniqueMonths = [...new Set(months)];
  if (ids.length === 0 || uniqueMonths.length === 0) return;

  const { data, error } = await supabase
    .from('payroll')
    .select('month, status, employees!inner(name)')
    .in('employee_id', ids)
    .in('month', uniqueMonths)
    .order('month', { ascending: true });
  if (error) throw error;

  // Same to-one embed cast as lib/erp/payroll.ts: without generated types
  // postgrest-js can't tell `employees` is a single object.
  const rows = (data || []) as unknown as LockedPayrollRow[];
  if (rows.length === 0) return;

  const shown = rows
    .slice(0, 3)
    .map((r) => `${r.employees?.name ?? 'an employee'} (${getMonthName(r.month)}, ${r.status})`)
    .join(', ');
  const more = rows.length > 3 ? ` and ${rows.length - 3} more` : '';
  const anyPaid = rows.some((r) => r.status === 'paid');

  throw new PayrollLockedError(
    `Payroll is already generated for ${shown}${more}, so ${what} for that month can't be changed. ` +
      (anyPaid
        ? 'Paid months are final.'
        : 'To correct it, delete the draft payroll record first (an approved one must be moved back to Draft by an admin), then generate payroll again.'),
  );
}
