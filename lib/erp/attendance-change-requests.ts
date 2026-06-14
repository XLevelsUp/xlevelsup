/**
 * Attendance Change Request Operations
 */

import { supabaseServer as supabase } from '@/lib/supabase-server';
import type {
  AttendanceChangeRequest,
  AttendanceChangeRequestWithEmployee,
  AttendanceStatus,
} from '@/types/erp';

/**
 * Get all attendance change requests (admin view)
 */
export async function getAllAttendanceChangeRequests(filters?: {
  status?: 'pending' | 'approved' | 'rejected';
  employeeId?: number;
}): Promise<AttendanceChangeRequestWithEmployee[]> {
  let query = supabase
    .from('attendance_change_requests')
    .select(
      `
      *,
      employees:employee_id (
        name,
        email,
        employee_id
      )
    `,
    )
    .order('created_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.employeeId) {
    query = query.eq('employee_id', filters.employeeId);
  }

  const { data, error } = await query;

  if (error) throw error;

  return (data || []).map((request: any) => ({
    ...request,
    employee_name: request.employees?.name || 'Unknown',
    employee_email: request.employees?.email || '',
    employee_employee_id: request.employees?.employee_id || '',
  }));
}

/**
 * Get employee's own attendance change requests
 */
export async function getEmployeeAttendanceChangeRequests(
  employeeId: number,
): Promise<AttendanceChangeRequest[]> {
  const { data, error } = await supabase
    .from('attendance_change_requests')
    .select('*')
    .eq('employee_id', employeeId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Create attendance change request
 */
export async function createAttendanceChangeRequest(
  employeeId: number,
  requestData: {
    request_date: string;
    current_status?: AttendanceStatus | null;
    requested_status: AttendanceStatus;
    reason: string;
    attendance_id?: number | null;
  },
): Promise<AttendanceChangeRequest> {
  const { data, error } = await supabase
    .from('attendance_change_requests')
    .insert({
      employee_id: employeeId,
      request_date: requestData.request_date,
      current_status: requestData.current_status,
      requested_status: requestData.requested_status,
      reason: requestData.reason,
      attendance_id: requestData.attendance_id,
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Review attendance change request (approve/reject)
 */
export async function reviewAttendanceChangeRequest(
  requestId: number,
  reviewerId: number,
  status: 'approved' | 'rejected',
  reviewComments?: string,
): Promise<void> {
  // Get the request details first
  const { data: request, error: fetchError } = await supabase
    .from('attendance_change_requests')
    .select('*')
    .eq('id', requestId)
    .single();

  if (fetchError) throw fetchError;
  if (!request) throw new Error('Request not found');

  // Update the request status
  const { error: updateError } = await supabase
    .from('attendance_change_requests')
    .update({
      status,
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
      review_comments: reviewComments,
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId);

  if (updateError) throw updateError;

  // If approved, update or create the attendance record
  if (status === 'approved') {
    if (request.attendance_id) {
      // Update existing attendance record
      const { error: attendanceError } = await supabase
        .from('attendance')
        .update({
          status: request.requested_status,
          notes: `Updated via change request #${requestId}. ${request.reason}`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', request.attendance_id);

      if (attendanceError) throw attendanceError;
    } else {
      // Create new attendance record
      const { error: attendanceError } = await supabase
        .from('attendance')
        .insert({
          employee_id: request.employee_id,
          date: request.request_date,
          status: request.requested_status,
          notes: `Created via change request #${requestId}. ${request.reason}`,
          created_by: reviewerId,
        });

      if (attendanceError) throw attendanceError;
    }
  }
}

/**
 * Get employee attendance with pending change request info
 */
export async function getEmployeeAttendanceWithRequests(
  employeeId: number,
  startDate?: string,
  endDate?: string,
): Promise<any[]> {
  let query = supabase
    .from('attendance')
    .select(
      `
      *,
      change_requests:attendance_change_requests!attendance_id (
        id,
        status,
        requested_status,
        reason,
        created_at
      )
    `,
    )
    .eq('employee_id', employeeId)
    .order('date', { ascending: false });

  if (startDate) {
    query = query.gte('date', startDate);
  }

  if (endDate) {
    query = query.lte('date', endDate);
  }

  const { data, error } = await query;

  if (error) throw error;

  return (data || []).map((attendance: any) => ({
    ...attendance,
    has_pending_request:
      attendance.change_requests?.some(
        (req: any) => req.status === 'pending',
      ) || false,
    change_request_id:
      attendance.change_requests?.find((req: any) => req.status === 'pending')
        ?.id || null,
  }));
}

/**
 * Get count of pending attendance change requests
 */
export async function getPendingAttendanceChangeRequestsCount(): Promise<number> {
  const { count, error } = await supabase
    .from('attendance_change_requests')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  if (error) throw error;
  return count || 0;
}

/**
 * Check if employee has pending request for a specific date
 */
export async function hasPendingRequestForDate(
  employeeId: number,
  date: string,
): Promise<boolean> {
  const { count, error } = await supabase
    .from('attendance_change_requests')
    .select('*', { count: 'exact', head: true })
    .eq('employee_id', employeeId)
    .eq('request_date', date)
    .eq('status', 'pending');

  if (error) throw error;
  return (count || 0) > 0;
}
