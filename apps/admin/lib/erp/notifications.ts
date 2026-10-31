/**
 * Who gets told what. Two notifications exist, on purpose:
 *
 * - Admins who are clocked in hear when an attendance request is raised.
 * - Employees get a clock-in reminder at 10:30 and a clock-out reminder at
 *   18:00 IST, unless they're on leave. See the schedule in
 *   db/migrations/schedule-attendance-reminders.sql.
 */

import { supabaseServer as supabase } from '@/lib/supabase-server';
import { ADMIN_APPROVER_ROLES } from '@/lib/erp/approver';
import { getAllEmployees, getEmployeeById } from '@/lib/erp/employees';
import { getNonFloaterHolidayDateSetInRange } from '@/lib/erp/holidays';
import { sendPushToEmployees, type PushSendResult } from '@/lib/erp/push';
import { getClockedInEmployeeIds } from '@/lib/erp/time-logs';
import { formatDisplayDate, getTodayIST, isAttendanceWorkingDay } from '@/lib/erp/utils';

export type ReminderKind = 'clock-in' | 'clock-out';

const REMINDER_TEXT: Record<ReminderKind, { title: string; body: string }> = {
  'clock-in': {
    title: 'Time to clock in',
    body: "You haven't clocked in yet today.",
  },
  'clock-out': {
    title: 'Time to clock out',
    body: "You're still clocked in. Remember to clock out when you finish.",
  },
};

/** Attendance statuses that already mean "not working today". */
const OFF_ATTENDANCE_STATUSES = ['paid-leave', 'unpaid-leave', 'holiday'];

/** The employee records behind the logins allowed to approve requests. */
async function getAdminEmployeeIds(): Promise<number[]> {
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id')
    .in('role', ADMIN_APPROVER_ROLES);
  if (usersError) throw usersError;

  const { data: employees, error } = await supabase
    .from('employees')
    .select('id')
    .eq('status', 'active')
    .in('user_id', (users || []).map((user) => user.id));
  if (error) throw error;
  return (employees || []).map((employee) => employee.id);
}

/**
 * Tell the admins who are clocked in right now that an attendance request came
 * in — never the admin who raised it, who can't approve it anyway. Run it in
 * after(): it catches its own errors, and the person raising the request
 * shouldn't wait on it.
 */
export async function notifyAdminsOfAttendanceRequest(
  employeeId: number,
  requestDate: string,
): Promise<void> {
  try {
    const adminIds = (await getAdminEmployeeIds()).filter((id) => id !== employeeId);
    const clockedIn = await getClockedInEmployeeIds(adminIds);
    if (clockedIn.length === 0) return;

    const employee = await getEmployeeById(employeeId);
    await sendPushToEmployees(clockedIn, {
      title: 'New attendance request',
      body: `${employee?.name ?? 'An employee'} raised a request for ${formatDisplayDate(requestDate)}.`,
      url: '/erp/attendance-change-requests',
      tag: `attendance-request-${employeeId}-${requestDate}`,
    });
  } catch (error) {
    console.error('Attendance request notification failed:', error);
  }
}

/** Whether a leave covers the moment this reminder goes out. */
export function leaveCoversReminder(
  kind: ReminderKind,
  leave: { is_half_day: boolean; half_day_period?: string | null },
): boolean {
  if (!leave.is_half_day) return true;
  return leave.half_day_period === (kind === 'clock-in' ? 'first_half' : 'second_half');
}

/**
 * Who a reminder is for on a date (YYYY-MM-DD): on a working day, nobody on
 * leave, and only people it applies to — not yet clocked in at 10:30, still
 * clocked in at 18:00. Only employees with a device turned on actually get it.
 */
export async function getReminderAudience(kind: ReminderKind, date: string): Promise<number[]> {
  const [year, month, day] = date.split('-').map(Number);
  if (!isAttendanceWorkingDay(new Date(year, month - 1, day))) return [];

  const [holidays, employees, leaveResult, attendanceResult, logsResult] = await Promise.all([
    // Floater holidays stay in: the office is open, and anyone taking one has
    // an approved floater leave, which the leave check below catches.
    getNonFloaterHolidayDateSetInRange(date, date),
    getAllEmployees({ status: 'active' }),
    supabase
      .from('leave_requests')
      .select('employee_id, is_half_day, half_day_period')
      .eq('status', 'approved')
      // WFH is a work arrangement, not leave: they still clock in and out.
      .neq('leave_type', 'wfh')
      .lte('start_date', date)
      .gte('end_date', date),
    supabase
      .from('attendance')
      .select('employee_id')
      .eq('date', date)
      .in('status', OFF_ATTENDANCE_STATUSES),
    supabase.from('time_logs').select('employee_id, status').eq('date', date),
  ]);
  if (leaveResult.error) throw leaveResult.error;
  if (attendanceResult.error) throw attendanceResult.error;
  if (logsResult.error) throw logsResult.error;
  if (holidays.has(date)) return [];

  const off = new Set((attendanceResult.data || []).map((row) => row.employee_id));
  for (const leave of leaveResult.data || []) {
    if (leaveCoversReminder(kind, leave)) off.add(leave.employee_id);
  }

  const logs = logsResult.data || [];
  const clockedInToday = new Set(logs.map((log) => log.employee_id));
  const stillClockedIn = new Set(
    logs.filter((log) => log.status === 'active').map((log) => log.employee_id),
  );

  return employees
    .filter(
      (employee) =>
        (!employee.joining_date || employee.joining_date <= date) &&
        (!employee.end_date || employee.end_date >= date) &&
        !off.has(employee.id) &&
        (kind === 'clock-in' ? !clockedInToday.has(employee.id) : stillClockedIn.has(employee.id)),
    )
    .map((employee) => employee.id);
}

/** Send today's reminder, as the schedule calls for it. */
export async function sendAttendanceReminders(
  kind: ReminderKind,
): Promise<{ date: string; audience: number } & PushSendResult> {
  const { year, month, day } = getTodayIST();
  const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const audience = await getReminderAudience(kind, date);
  const result = await sendPushToEmployees(audience, {
    ...REMINDER_TEXT[kind],
    // Not the dashboard: freelancers only have the attendance page.
    url: '/employee/attendance',
    tag: `${kind}-${date}`,
  });

  return { date, audience: audience.length, ...result };
}
