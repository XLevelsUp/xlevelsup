/**
 * Database functions for Leave Request management
 */

import { supabaseServer as supabase } from '@/lib/supabase-server';
import type {
  LeaveRequest,
  LeaveRequestWithEmployee,
  LeaveRequestFormData,
  LeaveBalance,
} from '@/types/erp';
import { getHolidayDateSetInRange } from '@/lib/erp/holidays';

/**
 * Calculate total working days between two dates (inclusive).
 * Excludes weekends (Sat/Sun) and, optionally, a set of public holiday date strings.
 *
 * @param startDate   - YYYY-MM-DD start date
 * @param endDate     - YYYY-MM-DD end date
 * @param holidaySet  - Optional Set of YYYY-MM-DD holiday dates to also exclude
 */
export function calculateLeaveDays(
  startDate: string,
  endDate: string,
  holidaySet?: Set<string>,
): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  let days = 0;

  for (
    let date = new Date(start);
    date <= end;
    date.setDate(date.getDate() + 1)
  ) {
    const dayOfWeek = date.getDay();
    // Skip weekends (0 = Sunday, 6 = Saturday)
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;
    // Skip public holidays
    const dateStr = date.toISOString().split('T')[0];
    if (holidaySet && holidaySet.has(dateStr)) continue;
    days++;
  }

  return days;
}

/**
 * Async variant of calculateLeaveDays that fetches public holidays from the
 * database automatically. Use this in server actions / API routes.
 */
export async function calculateLeaveDaysWithHolidays(
  startDate: string,
  endDate: string,
): Promise<number> {
  const holidaySet = await getHolidayDateSetInRange(startDate, endDate);
  return calculateLeaveDays(startDate, endDate, holidaySet);
}

/**
 * Get WFH days count for an employee in a specific month (excludes weekends)
 */
export async function getWfhDaysCountInMonth(
  employeeId: number,
  monthStr: string, // YYYY-MM
  excludeRequestId?: number,
): Promise<number> {
  const startDate = `${monthStr}-01`;
  const [year, month] = monthStr.split('-').map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${monthStr}-${String(lastDay).padStart(2, '0')}`;

  let query = supabase
    .from('leave_requests')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('leave_type', 'wfh')
    .in('status', ['approved', 'pending'])
    .or(`start_date.gte.${startDate},end_date.gte.${startDate}`);

  if (excludeRequestId) {
    query = query.neq('id', excludeRequestId);
  }

  const { data, error } = await query;
  if (error) throw error;

  let totalWfhDays = 0;
  const targetMonthStart = new Date(startDate);
  const targetMonthEnd = new Date(endDate);

  for (const req of data || []) {
    const reqStart = new Date(req.start_date);
    const reqEnd = new Date(req.end_date);

    const overlapStart = reqStart < targetMonthStart ? targetMonthStart : reqStart;
    const overlapEnd = reqEnd > targetMonthEnd ? targetMonthEnd : reqEnd;

    if (overlapStart <= overlapEnd) {
      for (let d = new Date(overlapStart); d <= overlapEnd; d.setDate(d.getDate() + 1)) {
        const dayOfWeek = d.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          totalWfhDays++;
        }
      }
    }
  }

  return totalWfhDays;
}

/**
 * Get all leave requests with employee details (for admin)
 */
export async function getAllLeaveRequests(filters?: {
  status?: string;
  employee_id?: number;
  start_date?: string;
  end_date?: string;
}): Promise<LeaveRequestWithEmployee[]> {
  let query = supabase
    .from('leave_requests')
    .select(
      `
      *,
      employee:employees!employee_id(id, employee_id, name, department),
      reviewer:employees!reviewed_by(name)
    `,
    )
    .order('created_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.employee_id) {
    query = query.eq('employee_id', filters.employee_id);
  }

  if (filters?.start_date) {
    query = query.gte('start_date', filters.start_date);
  }

  if (filters?.end_date) {
    query = query.lte('end_date', filters.end_date);
  }

  const { data, error } = await query;

  if (error) throw error;

  // Transform the data to match LeaveRequestWithEmployee interface
  return (
    data?.map((item: any) => ({
      ...item,
      employee_name: item.employee?.name || 'Unknown',
      employee_id_display: item.employee?.employee_id || '',
      employee_department: item.employee?.department || '',
      reviewer_name: item.reviewer?.name || null,
    })) || []
  );
}

/**
 * Get leave requests for specific employee
 */
export async function getEmployeeLeaveRequests(
  employeeId: number,
): Promise<LeaveRequest[]> {
  const { data, error } = await supabase
    .from('leave_requests')
    .select('*')
    .eq('employee_id', employeeId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Get leave request by ID
 */
export async function getLeaveRequestById(
  id: number,
): Promise<LeaveRequest | null> {
  const { data, error } = await supabase
    .from('leave_requests')
    .select('*')
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

/**
 * Create leave request
 */
export async function createLeaveRequest(
  employeeId: number,
  data: LeaveRequestFormData,
): Promise<LeaveRequest> {
  // Half-day requests are always 0.5 day (for a single working day);
  // otherwise count working days across the range as before.
  const totalDays = data.is_half_day
    ? calculateLeaveDays(data.start_date, data.start_date) > 0 ? 0.5 : 0
    : calculateLeaveDays(data.start_date, data.end_date);

  const { data: leaveRequest, error } = await supabase
    .from('leave_requests')
    .insert({
      employee_id: employeeId,
      leave_type: data.leave_type,
      start_date: data.start_date,
      end_date: data.end_date,
      total_days: totalDays,
      is_half_day: !!data.is_half_day,
      half_day_period: data.is_half_day ? data.half_day_period : null,
      reason: data.reason,
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw error;
  return leaveRequest;
}

/**
 * Update leave request (employee can only update pending requests)
 */
export async function updateLeaveRequest(
  id: number,
  employeeId: number,
  data: LeaveRequestFormData,
): Promise<LeaveRequest> {
  // Half-day requests are always 0.5 day (for a single working day);
  // otherwise count working days across the range as before.
  const totalDays = data.is_half_day
    ? calculateLeaveDays(data.start_date, data.start_date) > 0 ? 0.5 : 0
    : calculateLeaveDays(data.start_date, data.end_date);

  const { data: leaveRequest, error } = await supabase
    .from('leave_requests')
    .update({
      leave_type: data.leave_type,
      start_date: data.start_date,
      end_date: data.end_date,
      total_days: totalDays,
      is_half_day: !!data.is_half_day,
      half_day_period: data.is_half_day ? data.half_day_period : null,
      reason: data.reason,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('employee_id', employeeId)
    .eq('status', 'pending') // Can only update pending requests
    .select()
    .single();

  if (error) throw error;
  return leaveRequest;
}

/**
 * Cancel leave request (employee can cancel pending or approved requests)
 */
export async function cancelLeaveRequest(
  id: number,
  employeeId: number,
): Promise<void> {
  // First, get the leave request details to check if it was approved
  const { data: existingRequest, error: fetchError } = await supabase
    .from('leave_requests')
    .select('*')
    .eq('id', id)
    .eq('employee_id', employeeId)
    .in('status', ['pending', 'approved'])
    .single();

  if (fetchError) throw fetchError;
  if (!existingRequest)
    throw new Error('Leave request not found or cannot be cancelled');

  const wasApproved = existingRequest.status === 'approved';

  // Update the leave request status to cancelled
  const { error } = await supabase
    .from('leave_requests')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('employee_id', employeeId)
    .in('status', ['pending', 'approved']);

  if (error) throw error;

  // If the leave was approved, restore the leave balance (except for WFH)
  if (wasApproved && existingRequest.leave_type !== 'wfh') {
    const year = new Date(existingRequest.start_date).getFullYear();

    // Get the current leave balance
    const { data: currentBalance, error: balanceFetchError } = await supabase
      .from('leave_balances')
      .select('used_days')
      .eq('employee_id', existingRequest.employee_id)
      .eq('year', year)
      .eq('leave_type', existingRequest.leave_type)
      .single();

    if (balanceFetchError) {
      console.error('Failed to fetch leave balance:', balanceFetchError);
    } else if (currentBalance) {
      // Restore the leave balance - decrement used_days
      const newUsedDays = Math.max(
        0,
        Number(currentBalance.used_days) - Number(existingRequest.total_days),
      );

      const { error: balanceError } = await supabase
        .from('leave_balances')
        .update({
          used_days: newUsedDays,
          updated_at: new Date().toISOString(),
        })
        .eq('employee_id', existingRequest.employee_id)
        .eq('year', year)
        .eq('leave_type', existingRequest.leave_type);

      if (balanceError) {
        console.error('Failed to restore leave balance:', balanceError);
      }
    }
  }
}

/**
 * Review leave request (approve/reject by admin/manager)
 */
export async function reviewLeaveRequest(
  id: number,
  reviewerId: number,
  status: 'approved' | 'rejected',
  comments?: string,
): Promise<LeaveRequest> {
  // First, get the leave request details
  const { data: existingRequest, error: fetchError } = await supabase
    .from('leave_requests')
    .select('*')
    .eq('id', id)
    .eq('status', 'pending')
    .single();

  if (fetchError) throw fetchError;
  if (!existingRequest)
    throw new Error('Leave request not found or already reviewed');

  // Update the leave request status
  const { data: leaveRequest, error } = await supabase
    .from('leave_requests')
    .update({
      status,
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
      review_comments: comments || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('status', 'pending') // Can only review pending requests
    .select()
    .single();

  if (error) throw error;

  // If approved, deduct from leave balance (except for WFH)
  if (status === 'approved' && existingRequest.leave_type !== 'wfh') {
    const year = new Date(existingRequest.start_date).getFullYear();

    // First, get the current leave balance
    const { data: currentBalance, error: balanceFetchError } = await supabase
      .from('leave_balances')
      .select('used_days')
      .eq('employee_id', existingRequest.employee_id)
      .eq('year', year)
      .eq('leave_type', existingRequest.leave_type)
      .single();

    if (balanceFetchError) {
      console.error('Failed to fetch leave balance:', balanceFetchError);
    } else if (currentBalance) {
      // Update the leave balance - increment used_days
      const newUsedDays =
        Number(currentBalance.used_days) + Number(existingRequest.total_days);

      const { error: balanceError } = await supabase
        .from('leave_balances')
        .update({
          used_days: newUsedDays,
          updated_at: new Date().toISOString(),
        })
        .eq('employee_id', existingRequest.employee_id)
        .eq('year', year)
        .eq('leave_type', existingRequest.leave_type);

      if (balanceError) {
        console.error('Failed to update leave balance:', balanceError);
        // Note: We don't throw here to avoid rolling back the approval
        // The admin can manually adjust the balance if needed
      }
    }
  }

  return leaveRequest;
}

/**
 * Get leave balance for employee
 */
export async function getEmployeeLeaveBalance(
  employeeId: number,
  year?: number,
): Promise<LeaveBalance[]> {
  const currentYear = year || new Date().getFullYear();

  const { data, error } = await supabase
    .from('leave_balances')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('year', currentYear);

  if (error) throw error;
  return data || [];
}

/**
 * Calculate prorated leave allocation based on joining date and department
 */
function calculateProratedLeaves(
  joiningDate: Date,
  year: number,
  department?: string,
) {
  const joiningYear = joiningDate.getFullYear();
  const joiningMonth = joiningDate.getMonth(); // 0-11

  // Internship employees only get casual leave (1.5 days/month)
  const isInternship = department?.toLowerCase() === 'internship';

  // If joined before current year, give full allocation
  if (joiningYear < year) {
    if (isInternship) {
      return {
        casual: 18,
        floater: 0,
        sick: 0,
        earned: 0,
      };
    }
    return {
      casual: 18,
      floater: 2,
      sick: 5,
      earned: 0,
    };
  }

  // If joined in current year, calculate months remaining (including joining month)
  const monthsInYear = 12;
  const monthsRemaining = monthsInYear - joiningMonth; // e.g., joined in June (5) = 12-5 = 7 months

  // Calculate prorated leaves
  const casual = monthsRemaining * 1.5; // 1.5 days per month

  if (isInternship) {
    return {
      casual,
      floater: 0,
      sick: 0,
      earned: 0,
    };
  }

  const floater = Math.round((monthsRemaining / monthsInYear) * 2); // Prorated floater
  const sick = Math.round((monthsRemaining / monthsInYear) * 5); // Prorated sick leave
  const earned = 0; // Always starts at 0

  return {
    casual,
    floater,
    sick,
    earned,
  };
}

/**
 * Initialize leave balance for new employee
 * New Policy:
 * - Regular Employees:
 *   - Casual Leave: 18 days/year (1.5 days/month) - prorated based on joining date
 *   - Floater Leave: 2 days/year - prorated based on joining date
 *   - Sick Leave: 5 days/year - prorated based on joining date
 *   - Earned Leave: 0 initially, earned based on OT hours
 * - Internship Employees:
 *   - Casual Leave: 1.5 days/month only (no floater, sick, or earned leave)
 */
export async function initializeLeaveBalance(
  employeeId: number,
  joiningDate: Date | string,
  department?: string,
): Promise<void> {
  const currentYear = new Date().getFullYear();
  const joining =
    typeof joiningDate === 'string' ? new Date(joiningDate) : joiningDate;

  // Calculate prorated leave allocation based on joining date and department
  const allocation = calculateProratedLeaves(joining, currentYear, department);

  // Filter out leave types with 0 allocation (for internships)
  const leaveAllocations = [
    { leave_type: 'casual', total_allocated: allocation.casual },
    { leave_type: 'floater', total_allocated: allocation.floater },
    { leave_type: 'sick', total_allocated: allocation.sick },
    { leave_type: 'earned', total_allocated: allocation.earned },
  ].filter(
    (leave) => leave.total_allocated > 0 || leave.leave_type === 'earned',
  );

  // Insert all leave balances
  const { error } = await supabase.from('leave_balances').insert(
    leaveAllocations.map((leave) => ({
      employee_id: employeeId,
      year: currentYear,
      ...leave,
      used_days: 0,
    })),
  );

  // Ignore conflict errors (balance already exists)
  if (error && error.code !== '23505') throw error;
}

/**
 * Get pending leave requests count
 */
export async function getPendingLeaveRequestsCount(): Promise<number> {
  const { count, error } = await supabase
    .from('leave_requests')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  if (error) throw error;
  return count || 0;
}

/**
 * Calculate earned leave days from overtime hours
 * Policy: 8 hours of OT = 1 day of earned leave
 */
export function calculateEarnedLeaveFromOT(overtimeHours: number): number {
  const HOURS_PER_EARNED_DAY = 8;
  return Math.floor(overtimeHours / HOURS_PER_EARNED_DAY);
}

/**
 * Update earned leave balance based on total OT hours for employee
 * This should be called periodically (e.g., monthly) or when OT is recorded
 */
export async function updateEarnedLeaveBalance(
  employeeId: number,
  year?: number,
): Promise<void> {
  const currentYear = year || new Date().getFullYear();

  // Get total overtime hours for the year
  const startDate = `${currentYear}-01-01`;
  const endDate = `${currentYear}-12-31`;

  const { data: attendanceRecords, error: attendanceError } = await supabase
    .from('attendance')
    .select('overtime_hours')
    .eq('employee_id', employeeId)
    .gte('date', startDate)
    .lte('date', endDate);

  if (attendanceError) throw attendanceError;

  // Calculate total OT hours
  const totalOTHours =
    attendanceRecords?.reduce(
      (sum, record) => sum + (record.overtime_hours || 0),
      0,
    ) || 0;

  // Calculate earned leave days
  const earnedDays = calculateEarnedLeaveFromOT(totalOTHours);

  // Update or insert earned leave balance
  const { error: upsertError } = await supabase
    .from('leave_balances')
    .upsert(
      {
        employee_id: employeeId,
        year: currentYear,
        leave_type: 'earned',
        total_allocated: earnedDays,
        used_days: 0, // Only update total_allocated, keep used_days as is
      },
      {
        onConflict: 'employee_id,year,leave_type',
        ignoreDuplicates: false,
      },
    )
    .select()
    .single();

  if (upsertError) {
    // If record exists, just update total_allocated
    const { error: updateError } = await supabase
      .from('leave_balances')
      .update({ total_allocated: earnedDays })
      .eq('employee_id', employeeId)
      .eq('year', currentYear)
      .eq('leave_type', 'earned');

    if (updateError) throw updateError;
  }
}

/**
 * Batch update earned leave for all employees
 * Should be run periodically (e.g., monthly cron job)
 */
export async function batchUpdateEarnedLeaveBalances(
  year?: number,
): Promise<void> {
  const currentYear = year || new Date().getFullYear();

  // Get all active employees except temporary employees
  const { data: employees, error: employeesError } = await supabase
    .from('employees')
    .select('id, employment_type')
    .eq('status', 'active')
    .neq('employment_type', 'temporary');

  if (employeesError) throw employeesError;

  // Update earned leave for each employee
  if (employees) {
    await Promise.all(
      employees.map((emp) => updateEarnedLeaveBalance(emp.id, currentYear)),
    );
  }
}
