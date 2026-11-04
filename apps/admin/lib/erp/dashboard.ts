/**
 * Database functions for Dashboard statistics
 */

import { supabaseServer as supabase } from '@/lib/supabase-server';
import type { DashboardStats } from '@/types/erp';
import { EMPLOYMENT_TYPES_BY_GROUP } from './utils';

/**
 * Get dashboard statistics
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const today = new Date().toISOString().split('T')[0];
  const currentMonth = today.substring(0, 7); // YYYY-MM

  // Active team members only — temporary staff and freelancers aren't part of
  // the headcount or the attendance rate.
  const { data: employees, error: employeeError } = await supabase
    .from('employees')
    .select('id, employment_type')
    .eq('status', 'active')
    .in('employment_type', EMPLOYMENT_TYPES_BY_GROUP.team.map((type) => type.value));

  if (employeeError) throw employeeError;
  const employeeCount = employees?.length || 0;
  const teamIds = new Set((employees || []).map((e) => e.id));

  // Today's attendance
  const { data: todayAttendance, error: attendanceError } = await supabase
    .from('attendance')
    .select('*')
    .eq('date', today);

  if (attendanceError) throw attendanceError;

  const todayAttendanceRecords = todayAttendance || [];
  // Counted against the same team as the headcount, so a freelancer or
  // temporary clock-in can't push the rate up (or past 100%).
  const presentCount = todayAttendanceRecords.filter(
    (a) =>
      teamIds.has(a.employee_id) &&
      (a.status === 'present' || a.status === 'half-day' || a.status === 'in_progress'),
  ).length;

  const attendancePercentage =
    employeeCount > 0 ? (presentCount / employeeCount) * 100 : 0;

  // Current month payroll total
  const { data: payrollRecords, error: payrollError } = await supabase
    .from('payroll')
    .select('*')
    .eq('month', currentMonth);

  if (payrollError) throw payrollError;

  const payrollTotal = (payrollRecords || []).reduce(
    (sum, p) => sum + (p.net_salary || 0),
    0,
  );

  // Current month expenses
  const nextMonth = new Date(currentMonth + '-01');
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  const nextMonthStr = nextMonth.toISOString().substring(0, 7);

  const { data: expenseRecords, error: expenseError } = await supabase
    .from('expenses')
    .select('*')
    .gte('date', `${currentMonth}-01`)
    .lt('date', `${nextMonthStr}-01`);

  if (expenseError) throw expenseError;

  const expensesTotal = (expenseRecords || []).reduce(
    (sum, e) => sum + (e.amount || 0),
    0,
  );

  // Pending expenses
  const { data: pendingExpensesRecords, error: pendingExpensesError } =
    await supabase.from('expenses').select('*').eq('status', 'pending');

  if (pendingExpensesError) throw pendingExpensesError;

  const pendingExpenses = pendingExpensesRecords || [];
  const pendingExpensesCount = pendingExpenses.length;
  const pendingExpensesTotal = pendingExpenses.reduce(
    (sum, e) => sum + (e.amount || 0),
    0,
  );

  // Unpaid payroll
  const { data: unpaidPayrollRecords, error: unpaidPayrollError } =
    await supabase
      .from('payroll')
      .select('*')
      .in('status', ['draft', 'approved'])
      .eq('month', currentMonth);

  if (unpaidPayrollError) throw unpaidPayrollError;

  const unpaidPayrollCount = unpaidPayrollRecords?.length || 0;

  // Pending leave requests
  const { count: pendingLeaveCount, error: pendingLeaveError } = await supabase
    .from('leave_requests')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  if (pendingLeaveError) throw pendingLeaveError;

  // Pending attendance change requests
  const {
    count: pendingAttendanceChangeCount,
    error: pendingAttendanceChangeError,
  } = await supabase
    .from('attendance_change_requests')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  if (pendingAttendanceChangeError) throw pendingAttendanceChangeError;

  return {
    total_active_employees: employeeCount,
    today_attendance_count: presentCount,
    today_attendance_percentage: Math.round(attendancePercentage),
    current_month_payroll_total: payrollTotal,
    current_month_expenses_total: expensesTotal,
    pending_expenses_count: pendingExpensesCount,
    pending_expenses_total: pendingExpensesTotal,
    unpaid_payroll_count: unpaidPayrollCount,
    pending_leave_requests_count: pendingLeaveCount || 0,
    pending_attendance_change_requests_count: pendingAttendanceChangeCount || 0,
  };
}
