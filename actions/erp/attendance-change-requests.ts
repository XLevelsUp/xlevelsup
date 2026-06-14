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
const attendanceChangeRequestSchema = z.object({
  request_date: z.string().min(1, 'Date is required'),
  requested_status: z.enum([
    'present',
    'absent',
    'half-day',
    'paid-leave',
    'unpaid-leave',
    'holiday',
  ]),
  reason: z.string().min(20, 'Reason must be at least 20 characters'),
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
});

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
  prevState: any,
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  try {
    const rawData = {
      status: formData.get('status') as string,
      review_comments: formData.get('review_comments') as string,
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
