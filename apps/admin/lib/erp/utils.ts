/**
 * Date and payroll calculation helpers for ERP system
 */

/**
 * True for a normal weekday, or the first Saturday of the month — which is
 * now a working day for attendance/clock-in/leave purposes (company policy
 * change). Employees are expected to be present, but it is deliberately
 * NOT a payroll working day: `getWorkingDayDatesInMonth` below must keep
 * excluding every Saturday and never call this function, so the day never
 * enters the salary calculation. A clock-in on it still creates an
 * attendance row, but payroll simply never walks that date. Nor is it an
 * off day, so working it earns no earned leave (see lib/erp/earned-leave.ts)
 * — how it is compensated is still to be decided.
 */
export function isAttendanceWorkingDay(date: Date): boolean {
  const dayOfWeek = date.getDay();
  if (dayOfWeek !== 0 && dayOfWeek !== 6) return true; // Mon-Fri
  if (dayOfWeek === 6 && date.getDate() <= 7) return true; // first Saturday
  return false;
}

/**
 * Get total working days in a month (excluding weekends and optionally public holidays).
 * @param year       - Year (e.g., 2026)
 * @param month      - Month (1-12)
 * @param holidaySet - Optional set of YYYY-MM-DD holiday dates to also exclude
 * @returns Number of working days
 */
export function getWorkingDaysInMonth(
  year: number,
  month: number,
  holidaySet?: Set<string>,
): number {
  return getWorkingDayDatesInMonth(year, month, holidaySet).length;
}

/**
 * The actual YYYY-MM-DD dates that count as working days in a month
 * (weekdays, minus any public holidays passed in). Every Saturday is
 * excluded, including the first — see isAttendanceWorkingDay.
 *
 * Payroll needs the dates themselves and not just the count, so it can line
 * attendance rows up against them: a clock-in on a Saturday is not a payable
 * day, and a working day with no attendance row at all still has to be
 * accounted for rather than silently dropped.
 */
export function getWorkingDayDatesInMonth(
  year: number,
  month: number,
  holidaySet?: Set<string>,
): string[] {
  const daysInMonth = new Date(year, month, 0).getDate();
  const dates: string[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const dayOfWeek = date.getDay();
    // 0 = Sunday, 6 = Saturday
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;
    // Skip public holidays
    const dateStr = formatLocalDate(date);
    if (holidaySet && holidaySet.has(dateStr)) continue;
    dates.push(dateStr);
  }

  return dates;
}

/**
 * Format a Date as YYYY-MM-DD from its *local* calendar fields.
 *
 * Not interchangeable with formatDate() below, which goes through
 * toISOString() and so converts to UTC first. For a Date built from local
 * parts (`new Date(y, m - 1, d)`) on a server running ahead of UTC — IST is
 * +5:30 — that conversion shifts the answer back a day, which would quietly
 * mis-match the holiday dates and attendance dates compared here.
 */
export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format date to YYYY-MM-DD
 */
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * "Today" in IST (Asia/Kolkata) as { year, month, day }, month/day 1-indexed.
 * The server's runtime timezone isn't guaranteed to be IST, so this must be
 * used (not `new Date().toISOString()`, which is UTC) anywhere "today"
 * needs to match what an India-based user considers today — e.g. matching
 * a birthday/anniversary date or today's festival.
 */
export function getTodayIST(): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return { year: get('year'), month: get('month'), day: get('day') };
}

/**
 * Get current month in YYYY-MM format
 */
export function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Get month name from YYYY-MM string
 */
export function getMonthName(monthString: string): string {
  const [year, month] = monthString.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/**
 * Calculate payroll based on attendance
 */
export interface PayrollCalculation {
  total_working_days: number;
  present_days: number;
  paid_leave_days: number;
  unpaid_leave_days: number;
  absent_days: number;
  half_days: number;
  payable_days: number;
  lop_days: number;
  /** Working days the employee wasn't employed for (joined late / left early). */
  not_employed_days: number;
  /** In-employment working days with no attendance row at all — unpaid. */
  unrecorded_dates: string[];
  per_day_salary: number;
  /** The employee's contracted monthly salary, before any attendance loss. */
  gross_salary: number;
  /** Loss-of-pay for unpaid days: per_day_salary * lop_days. */
  lop_deduction: number;
  /** gross_salary - lop_deduction (+ bonus - deduction, applied later). */
  net_salary: number;
  /** What each working day counted as, in date order — the figures above summed up. */
  days: PayrollCalculationDay[];
}

/** One working day as calculatePayroll counted it. */
export interface PayrollCalculationDay {
  date: string;
  /** Outside the employment window (joined later / left earlier). */
  employed: boolean;
  /** Null when the day isn't counted: not employed, or nothing recorded. */
  share: PayrollDayShare | null;
}

/** Attendance statuses payroll knows how to price. */
export type PayrollAttendanceStatus =
  | 'present'
  | 'absent'
  | 'half-day'
  | 'paid-leave'
  | 'unpaid-leave'
  | 'holiday'
  | 'in_progress';

/** A day's attendance row as payroll reads it. */
export interface PayrollAttendanceEntry {
  status: PayrollAttendanceStatus;
  /** When the row last changed (updated_at, else created_at) — see resolvePayrollDay. */
  changed_at: string | null;
}

/**
 * Approved leave covering one working day. `paid` + `unpaid` is the share of
 * the day on leave: 1 for a full day, 0.5 for a half-day request (two
 * half-day requests on the same date add up to a full day).
 */
export interface PayrollLeaveEntry {
  paid: number;
  unpaid: number;
  /** When the (latest) leave covering this day was approved. */
  approved_at: string | null;
}

/** Everything payroll knows about one working day. */
export interface PayrollDayRecord {
  attendance?: PayrollAttendanceEntry;
  leave?: PayrollLeaveEntry;
}

/** How one working day splits across the payroll day counters. Sums to 1. */
export interface PayrollDayShare {
  present: number;
  half: number;
  paidLeave: number;
  unpaidLeave: number;
  absent: number;
  payable: number;
}

const EMPTY_SHARE: PayrollDayShare = { present: 0, half: 0, paidLeave: 0, unpaidLeave: 0, absent: 0, payable: 0 };

/** The share of a day (1 = whole day, 0.5 = the half not on leave) an attendance status accounts for. */
function attendanceShare(status: PayrollAttendanceStatus, portion: number): PayrollDayShare {
  switch (status) {
    case 'paid-leave':
      return { ...EMPTY_SHARE, paidLeave: portion, payable: portion };
    case 'unpaid-leave':
      return { ...EMPTY_SHARE, unpaidLeave: portion };
    case 'absent':
      return { ...EMPTY_SHARE, absent: portion };
    case 'half-day':
      // A whole-day half-day row: half worked, half unpaid. When half the day
      // is already on leave, the half-day row is just the worked half.
      return portion === 1
        ? { ...EMPTY_SHARE, half: 1, payable: 0.5 }
        : { ...EMPTY_SHARE, present: portion, payable: portion };
    // 'present', 'in_progress' (clocked in, not yet out), and 'holiday'
    // logged against a working day.
    default:
      return { ...EMPTY_SHARE, present: portion, payable: portion };
  }
}

/**
 * Decide what one working day counts as, from its attendance row and any
 * approved leave. Returns null when the day isn't accounted for.
 *
 *  - Full-day leave and an attendance row: whichever changed most recently
 *    wins. Leave approved after the day was marked absent pays it as leave
 *    (the balance was used for it); attendance re-recorded after the leave
 *    was approved overrides the leave. Without timestamps to compare, the
 *    attendance row wins.
 *  - Half-day leave: the leave covers its half — paid, or deducted if it was
 *    unpaid leave — and the attendance row says what happened in the other
 *    half. With no attendance row the other half is unaccounted for.
 */
export function resolvePayrollDay(day: PayrollDayRecord | undefined): PayrollDayShare | null {
  const attendance = day?.attendance;
  const leave = day?.leave;
  const leaveDays = leave ? Math.min(1, leave.paid + leave.unpaid) : 0;

  if (!leave || leaveDays <= 0) {
    return attendance ? attendanceShare(attendance.status, 1) : null;
  }

  // Scale to the day, so overlapping requests can never count more than one.
  const paid = leave.paid * (leaveDays / (leave.paid + leave.unpaid));
  const unpaid = leaveDays - paid;
  const leaveShare: PayrollDayShare = { ...EMPTY_SHARE, paidLeave: paid, unpaidLeave: unpaid, payable: paid };

  if (leaveDays >= 1) {
    if (!attendance) return leaveShare;
    const leaveIsNewer =
      !!leave.approved_at &&
      !!attendance.changed_at &&
      Date.parse(leave.approved_at) > Date.parse(attendance.changed_at);
    return leaveIsNewer ? leaveShare : attendanceShare(attendance.status, 1);
  }

  if (!attendance) return null;
  const rest = attendanceShare(attendance.status, 1 - leaveDays);
  return {
    present: rest.present,
    half: rest.half,
    paidLeave: leaveShare.paidLeave + rest.paidLeave,
    unpaidLeave: leaveShare.unpaidLeave + rest.unpaidLeave,
    absent: rest.absent,
    payable: leaveShare.payable + rest.payable,
  };
}

/** Round a money amount to paise, so stored totals don't drift on float error. */
export function roundMoney(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

export interface SalaryComponents {
  basic_salary: number;
  hra: number;
  special_allowance: number;
  other_allowance: number;
}

/**
 * Split a monthly gross into Basic/HRA/Special/Other using a salary
 * template's proportions (e.g. the ₹35,000 standard template → 50% / 20% /
 * 28.57% / 1.43%). Basic, HRA and Other are rounded to whole rupees and
 * Special Allowance absorbs the remainder, so the parts always add up to
 * exactly `gross`.
 */
export function splitGrossByTemplate(gross: number, template: SalaryComponents & { gross_salary: number }): SalaryComponents {
  const ratio = template.gross_salary > 0 ? gross / template.gross_salary : 0;
  const basic = Math.round(template.basic_salary * ratio);
  const hra = Math.round(template.hra * ratio);
  const other = Math.round(template.other_allowance * ratio);
  return {
    basic_salary: basic,
    hra,
    special_allowance: Math.max(0, roundMoney(gross - basic - hra - other)),
    other_allowance: other,
  };
}

/**
 * Price one month of attendance against an employee's contracted salary.
 *
 * Driven by the month's working-day *dates* rather than a raw count of
 * attendance rows, which is what keeps two things honest:
 *
 *  - Payable days can never exceed working days. Only dates in
 *    `workingDayDates` are ever walked, so a weekend or public-holiday
 *    clock-in cannot push someone above their monthly salary (it used to:
 *    22 or 23 payable days in a 21-day month). Weekend and holiday work is
 *    never paid — it earns earned leave instead (lib/erp/earned-leave.ts).
 *  - A working day nobody accounted for — no attendance row and no
 *    approved full-day leave, or a half-day leave whose other half has no
 *    attendance row — is NOT paid (see resolvePayrollDay). Pay is only
 *    ever earned by a recorded day, so a gap can never quietly pay someone
 *    for a day nobody accounted for. These days are returned in
 *    `unrecorded_dates`, and generatePayrollAction refuses to run while any
 *    exist — the gap has to be fixed in attendance first, so in practice a
 *    generated payroll row never contains one.
 *
 * `gross_salary` is the contracted monthly salary as configured on the
 * employee. Attendance loss is *not* folded into it — it comes out as an
 * explicit `lop_deduction` on the way to `net_salary` — so the payslip shows
 * what was promised and what was actually paid as two separate numbers.
 */
export function calculatePayroll(
  monthSalary: number,
  workingDayDates: string[],
  daysByDate: Map<string, PayrollDayRecord>,
  employment?: { from?: string | null; to?: string | null },
): PayrollCalculation {
  const totalWorkingDays = workingDayDates.length;

  let payableDays = 0;
  let presentDays = 0;
  let halfDays = 0;
  let paidLeaveDays = 0;
  let unpaidLeaveDays = 0;
  let absentDays = 0;
  let notEmployedDays = 0;
  const unrecordedDates: string[] = [];
  const days: PayrollCalculationDay[] = [];

  for (const date of workingDayDates) {
    // Days outside the employment window are not payable, and must never be
    // assumed worked. Without this a
    // mid-month joiner (or anyone hired after the payroll month) would be
    // paid a full salary for time they weren't employed. Both bounds are
    // YYYY-MM-DD, so a lexicographic compare is a date compare.
    if (
      (employment?.from && date < employment.from) ||
      (employment?.to && date > employment.to)
    ) {
      notEmployedDays++;
      days.push({ date, employed: false, share: null });
      continue;
    }

    const share = resolvePayrollDay(daysByDate.get(date));
    days.push({ date, employed: true, share });
    // Not accounted for — unpaid, per the rule above.
    if (!share) {
      unrecordedDates.push(date);
      continue;
    }
    presentDays += share.present;
    halfDays += share.half;
    paidLeaveDays += share.paidLeave;
    unpaidLeaveDays += share.unpaidLeave;
    absentDays += share.absent;
    payableDays += share.payable;
  }

  const perDaySalary = totalWorkingDays > 0 ? monthSalary / totalWorkingDays : 0;
  const lopDays = Math.max(0, totalWorkingDays - payableDays);
  const lopDeduction = roundMoney(perDaySalary * lopDays);
  const grossSalary = roundMoney(monthSalary);

  return {
    total_working_days: totalWorkingDays,
    present_days: presentDays,
    paid_leave_days: paidLeaveDays,
    unpaid_leave_days: unpaidLeaveDays,
    absent_days: absentDays,
    half_days: halfDays,
    payable_days: payableDays,
    lop_days: lopDays,
    not_employed_days: notEmployedDays,
    unrecorded_dates: unrecordedDates,
    per_day_salary: roundMoney(perDaySalary),
    gross_salary: grossSalary,
    lop_deduction: lopDeduction,
    net_salary: roundMoney(grossSalary - lopDeduction),
    days,
  };
}

/**
 * Recompute net pay from a stored payroll row.
 *
 * The payroll table has no lop_deduction column, so loss of pay is derived
 * back out of the day counts that *are* stored. Anything that edits bonus or
 * deduction after generation has to go through here — recomputing net as a
 * plain `gross + bonus - deduction` would drop the attendance loss entirely
 * and pay an absent employee their full salary.
 */
export function computeNetSalary(row: {
  total_working_days: number;
  payable_days: number;
  per_day_salary: number;
  gross_salary: number;
  bonus?: number | null;
  deduction?: number | null;
  // Structured deductions (PF/ESI/Professional Tax/TDS/Other). All default
  // to 0 — omitting them reproduces the exact pre-existing formula, so every
  // caller that predates the salary-structure feature is unaffected.
  pf_deduction?: number | null;
  esi_deduction?: number | null;
  professional_tax_deduction?: number | null;
  tds_deduction?: number | null;
  other_structured_deduction?: number | null;
}): { lop_days: number; lop_deduction: number; net_salary: number } {
  const lopDays = Math.max(0, row.total_working_days - row.payable_days);
  // Priced from the exact per-day rate (gross / working days), exactly like
  // calculatePayroll — the stored per_day_salary is rounded to paise, and
  // multiplying the rounded rate drifts net by a few paise from what
  // generation produced (e.g. 35,000 / 22 * 11 = 17,500, but 1,590.91 * 11
  // = 17,500.01).
  const lopDeduction =
    row.total_working_days > 0
      ? roundMoney((row.gross_salary / row.total_working_days) * lopDays)
      : roundMoney(row.per_day_salary * lopDays);
  const structuredDeductions =
    (row.pf_deduction || 0) +
    (row.esi_deduction || 0) +
    (row.professional_tax_deduction || 0) +
    (row.tds_deduction || 0) +
    (row.other_structured_deduction || 0);
  const netSalary = roundMoney(
    row.gross_salary -
      lopDeduction -
      structuredDeductions +
      (row.bonus || 0) -
      (row.deduction || 0),
  );

  return { lop_days: lopDays, lop_deduction: lopDeduction, net_salary: netSalary };
}

/**
 * Format currency (Indian Rupees)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format date for display
 */
export function formatDisplayDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * A date range as one short span, dropping whatever the two ends share:
 * "1 Oct 2026", "12–14 Oct 2026", "29 Sep – 2 Oct 2026",
 * "30 Dec 2026 – 2 Jan 2027". For calendar-day ranges such as leave.
 */
export function formatDateSpan(start: string, end?: string | null): string {
  // Calendar days ('YYYY-MM-DD'), read in UTC so the day can't shift with
  // the viewer's timezone.
  const s = new Date(`${start.slice(0, 10)}T00:00:00Z`);
  const e = new Date(`${(end || start).slice(0, 10)}T00:00:00Z`);
  const fmt = (d: Date, opts: Intl.DateTimeFormatOptions) =>
    d.toLocaleDateString('en-GB', { timeZone: 'UTC', ...opts });
  const full = (d: Date) => fmt(d, { day: 'numeric', month: 'short', year: 'numeric' });
  const sameYear = s.getUTCFullYear() === e.getUTCFullYear();
  const sameMonth = sameYear && s.getUTCMonth() === e.getUTCMonth();
  if (sameMonth && s.getUTCDate() === e.getUTCDate()) return full(s);
  if (sameMonth) return `${s.getUTCDate()}–${full(e)}`;
  if (sameYear) return `${fmt(s, { day: 'numeric', month: 'short' })} – ${full(e)}`;
  return `${full(s)} – ${full(e)}`;
}

/**
 * Get date range for a specific month
 */
export function getMonthDateRange(monthString: string): {
  startDate: string;
  endDate: string;
} {
  const [year, month] = monthString.split('-').map(Number);
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  return {
    // Local fields, not formatDate's UTC — in IST that would shift both
    // bounds back a day (see formatLocalDate).
    startDate: formatLocalDate(startDate),
    endDate: formatLocalDate(endDate),
  };
}

/**
 * Format decimal hours into a readable string showing hours and/or minutes.
 * If less than 1 hour, shows only minutes (e.g., "45m" or "45 mins").
 * Otherwise, shows hours and minutes (e.g., "8h 30m" or "8 hrs 30 mins").
 *
 * @param hours - The duration in decimal hours (e.g., 8.5)
 * @param short - Whether to use compact format (e.g., "8h 30m" vs "8 hrs 30 mins")
 */
export function formatDuration(hours: number, short = true): string {
  if (hours <= 0 || isNaN(hours)) {
    return short ? '0m' : '0 mins';
  }

  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;

  if (short) {
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  } else {
    if (h === 0) return `${m} min${m !== 1 ? 's' : ''}`;
    if (m === 0) return `${h} hr${h !== 1 ? 's' : ''}`;
    return `${h} hr${h !== 1 ? 's' : ''} ${m} min${m !== 1 ? 's' : ''}`;
  }
}

