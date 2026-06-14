/**
 * Database functions for Attendance management
 */

import { supabaseServer as supabase } from '@/lib/supabase-server';
import type {
  Attendance,
  AttendanceFormData,
  AttendanceSummary,
} from '@/types/erp';

/**
 * Get all attendance records with optional filters
 */
export async function getAllAttendance(filters?: {
  employee_id?: number;
  date?: string;
  month?: string;
}): Promise<Attendance[]> {
  let query = supabase.from('attendance').select('*');

  if (filters?.employee_id) {
    query = query.eq('employee_id', filters.employee_id);
  }

  if (filters?.date) {
    query = query.eq('date', filters.date);
  }

  if (filters?.month) {
    // Filter by month using date range (YYYY-MM format)
    const startDate = `${filters.month}-01`;
    const nextMonth = new Date(filters.month + '-01');
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const nextMonthStr = nextMonth.toISOString().substring(0, 10);
    query = query.gte('date', startDate).lt('date', nextMonthStr);
  }

  query = query.order('date', { ascending: false }).order('employee_id');

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

/**
 * Get attendance for a specific employee and date
 */
export async function getAttendance(
  employeeId: number,
  date: string,
): Promise<Attendance | null> {
  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('date', date)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

/**
 * Create attendance record
 */
export async function createAttendance(
  data: AttendanceFormData,
  createdBy: number,
): Promise<Attendance> {
  const { data: attendance, error } = await supabase
    .from('attendance')
    .insert({
      employee_id: data.employee_id,
      date: data.date,
      status: data.status,
      overtime_hours: data.overtime_hours || null,
      notes: data.notes || null,
      created_by: createdBy,
    })
    .select()
    .single();

  if (error) throw error;
  return attendance;
}

/**
 * Update attendance record
 */
export async function updateAttendance(
  employeeId: number,
  date: string,
  data: AttendanceFormData,
): Promise<Attendance> {
  const { data: attendance, error } = await supabase
    .from('attendance')
    .update({
      status: data.status,
      overtime_hours:
        data.overtime_hours !== undefined ? data.overtime_hours : null,
      notes: data.notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq('employee_id', employeeId)
    .eq('date', date)
    .select()
    .single();

  if (error) throw error;
  return attendance;
}

/**
 * Delete attendance record
 */
export async function deleteAttendance(
  employeeId: number,
  date: string,
): Promise<void> {
  const { error } = await supabase
    .from('attendance')
    .delete()
    .eq('employee_id', employeeId)
    .eq('date', date);

  if (error) throw error;
}

/**
 * Get monthly attendance summary for an employee
 */
export async function getMonthlyAttendanceSummary(
  employeeId: number,
  month: string,
): Promise<AttendanceSummary | null> {
  // Get employee info
  const { data: employee, error: empError } = await supabase
    .from('employees')
    .select('id, name')
    .eq('id', employeeId)
    .single();

  if (empError || !employee) return null;

  // Get attendance for the month
  const startDate = `${month}-01`;
  const nextMonth = new Date(month + '-01');
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  const nextMonthStr = nextMonth.toISOString().substring(0, 10);

  const { data: attendanceRecords, error: attError } = await supabase
    .from('attendance')
    .select('status')
    .eq('employee_id', employeeId)
    .gte('date', startDate)
    .lt('date', nextMonthStr);

  // Calculate summary
  const records = attendanceRecords || [];
  const summary = {
    employee_id: employee.id,
    employee_name: employee.name,
    month,
    total_days: records.length,
    present_days: records.filter((r) => r.status === 'present').length,
    half_days: records.filter((r) => r.status === 'half-day').length,
    paid_leave_days: records.filter((r) => r.status === 'paid-leave').length,
    unpaid_leave_days: records.filter((r) => r.status === 'unpaid-leave')
      .length,
    absent_days: records.filter((r) => r.status === 'absent').length,
    holiday_days: records.filter((r) => r.status === 'holiday').length,
  };

  return summary;
}

/**
 * Get attendance for today for all active employees
 */
export async function getTodayAttendance(): Promise<
  Array<{
    employee_id: number;
    employee_name: string;
    status: string | null;
  }>
> {
  const today = new Date().toISOString().split('T')[0];

  // Get all active employees
  const { data: employees, error: empError } = await supabase
    .from('employees')
    .select('id, name')
    .eq('status', 'active')
    .order('name');

  if (empError) throw empError;

  // Get today's attendance
  const { data: attendance, error: attError } = await supabase
    .from('attendance')
    .select('employee_id, status')
    .eq('date', today);

  if (attError) throw attError;

  // Combine data
  const attendanceMap = new Map(
    (attendance || []).map((a) => [a.employee_id, a.status]),
  );

  return (employees || []).map((emp) => ({
    employee_id: emp.id,
    employee_name: emp.name,
    status: attendanceMap.get(emp.id) || null,
  }));
}
