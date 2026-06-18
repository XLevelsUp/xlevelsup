/**
 * Server Actions for Attendance Change Requests
 */

'use server';

import { z } from 'zod';
import {
  createAttendanceChangeRequest,
  reviewAttendanceChangeRequest,
  hasPendingRequestForDate,
} from '@/lib/erp/attendance-change-requests';
import type { AttendanceStatus } from '@/types/erp';

// Validation schema
const attendanceChangeRequestSchema = z
  .object({
    request_date: z.string().min(1, 'Date is required'),
    requested_status: z.enum([
      'present',
      'absent',
      'half-day',
      'paid-leave',
      'unpaid-leave',
      'holiday',
    ]),
    leave_type: z
      .enum([
        'sick',
        'casual',
        'floater',
        'earned',
        'unpaid',
        'maternity',
        'paternity',
        'other',
      ])
      .nullable()
      .optional(),
    clock_out_time: z
      .string()
      .regex(/^([0-9]{2}):([0-9]{2})(:[0-9]{2})?$/, 'Invalid clock-out time format')
      .nullable()
      .optional(),
    reason: z.string().min(5, 'Reason must be at least 5 characters'),
    current_status: z
      .enum([
        'present',
        'absent',
        'half-day',
        'paid-leave',
        'unpaid-leave',
        'holiday',
      ])
      .nullable()
      .optional(),
    attendance_id: z.number().nullable().optional(),
  })
  .refine(
    (data) => {
      // If requested_status is paid-leave, leave_type must be provided
      if (data.requested_status === 'paid-leave') {
        return data.leave_type !== null && data.leave_type !== undefined;
      }
      return true;
    },
    {
      message: 'Leave type is required when requesting paid leave',
      path: ['leave_type'],
    },
  );

const reviewSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  review_comments: z.string().optional(),
});

/**
 * Create attendance change request action (employee)
 */
export async function createAttendanceChangeRequestAction(
  employeeId: number,
  prevState: any,
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  try {
    const rawData = {
      request_date: formData.get('request_date') as string,
      requested_status: formData.get('requested_status') as string,
      leave_type: (formData.get('leave_type') as string) || null,
      clock_out_time: (formData.get('clock_out_time') as string) || null,
      reason: formData.get('reason') as string,
      current_status: (formData.get('current_status') as string) || null,
      attendance_id: formData.get('attendance_id')
        ? parseInt(formData.get('attendance_id') as string)
        : null,
    };

    const validated = attendanceChangeRequestSchema.parse(rawData);

    // Check if there's already a pending request for this date
    const hasPending = await hasPendingRequestForDate(
      employeeId,
      validated.request_date,
    );

    if (hasPending) {
      return {
        success: false,
        error: 'You already have a pending request for this date',
      };
    }

    await createAttendanceChangeRequest(employeeId, {
      request_date: validated.request_date,
      requested_status: validated.requested_status as AttendanceStatus,
      leave_type: validated.leave_type,
      clock_out_time: validated.clock_out_time,
      reason: validated.reason,
      current_status: validated.current_status as AttendanceStatus | null,
      attendance_id: validated.attendance_id,
    });

    return { success: true };
  } catch (error) {
    console.error('Create attendance change request error:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: 'Failed to create request' };
  }
}

/**
 * Review attendance change request action (admin)
 */
export async function reviewAttendanceChangeRequestAction(
  requestId: number,
  reviewerId: number,
  status: 'approved' | 'rejected',
  reviewComments?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const rawData = {
      status,
      review_comments: reviewComments || undefined,
    };

    const validated = reviewSchema.parse(rawData);

    await reviewAttendanceChangeRequest(
      requestId,
      reviewerId,
      validated.status,
      validated.review_comments,
    );

    return { success: true };
  } catch (error) {
    console.error('Review attendance change request error:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: 'Failed to review request' };
  }
}
