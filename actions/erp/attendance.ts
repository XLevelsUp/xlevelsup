'use server';

import { z } from 'zod';
import { requireRole, requireAuth } from '@/lib/auth';
import {
  getAllAttendance,
  getAttendance,
  createAttendance,
  updateAttendance,
  deleteAttendance,
  getMonthlyAttendanceSummary,
  getTodayAttendance,
} from '@/lib/erp/attendance';
import { revalidatePath } from 'next/cache';
import type { Attendance, AttendanceSummary } from '@/types/erp';

const attendanceSchema = z.object({
  employee_id: z.number().int().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum([
    'present',
    'absent',
    'half-day',
    'paid-leave',
    'unpaid-leave',
    'holiday',
  ]),
  overtime_hours: z.number().min(0).max(24).optional().nullable(),
  notes: z.string().optional(),
});

export interface AttendanceActionResult {
  success: boolean;
  error?: string;
  attendance?: Attendance;
}

/**
 * Get attendance records
 */
export async function getAttendanceAction(filters?: {
  employee_id?: number;
  date?: string;
  month?: string;
}): Promise<Attendance[]> {
  try {
    await requireAuth();
    return await getAllAttendance(filters);
  } catch (error) {
    console.error('Get attendance error:', error);
    return [];
  }
}

/**
 * Get today's attendance
 */
export async function getTodayAttendanceAction() {
  try {
    await requireAuth();
    return await getTodayAttendance();
  } catch (error) {
    console.error('Get today attendance error:', error);
    return [];
  }
}

/**
 * Create or update attendance
 */
export async function saveAttendanceAction(
  formData: FormData,
): Promise<AttendanceActionResult> {
  try {
    const session = await requireRole(['admin', 'hr']);

    const overtimeValue = formData.get('overtime_hours') as string;
    const rawData = {
      employee_id: parseInt(formData.get('employee_id') as string),
      date: formData.get('date') as string,
      status: formData.get('status') as string,
      overtime_hours: overtimeValue ? parseFloat(overtimeValue) : null,
      notes: formData.get('notes') as string,
    };

    const validatedData = attendanceSchema.parse(rawData);

    // Check if attendance already exists
    const existing = await getAttendance(
      validatedData.employee_id,
      validatedData.date,
    );

    let attendance;
    if (existing) {
      attendance = await updateAttendance(
        validatedData.employee_id,
        validatedData.date,
        validatedData,
      );
    } else {
      attendance = await createAttendance(validatedData, session.userId);
    }

    revalidatePath('/erp/attendance');
    return { success: true, attendance };
  } catch (error) {
    console.error('Save attendance error:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: 'Failed to save attendance' };
  }
}

/**
 * Delete attendance
 */
export async function deleteAttendanceAction(
  employeeId: number,
  date: string,
): Promise<AttendanceActionResult> {
  try {
    await requireRole(['admin', 'hr']);
    await deleteAttendance(employeeId, date);
    revalidatePath('/erp/attendance');
    return { success: true };
  } catch (error) {
    console.error('Delete attendance error:', error);
    return { success: false, error: 'Failed to delete attendance' };
  }
}

/**
 * Get monthly attendance summary
 */
export async function getMonthlyAttendanceSummaryAction(
  employeeId: number,
  month: string,
): Promise<AttendanceSummary | null> {
  try {
    await requireAuth();
    return await getMonthlyAttendanceSummary(employeeId, month);
  } catch (error) {
    console.error('Get attendance summary error:', error);
    return null;
  }
}
