/**
 * Server Actions for Time Logs (Clock In/Out)
 */

'use server';

import {
  clockIn as dbClockIn,
  clockOut as dbClockOut,
  getTimeLogSummary,
} from '@/lib/erp/time-logs';
import { revalidatePath } from 'next/cache';

export interface ActionResult {
  success: boolean;
  error?: string;
  data?: any;
}

/**
 * Clock In Action
 */
export async function clockInAction(
  employeeId: number,
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  },
): Promise<ActionResult> {
  try {
    const timeLog = await dbClockIn(employeeId, location);

    revalidatePath('/employee/dashboard');
    revalidatePath('/employee/attendance');

    return {
      success: true,
      data: timeLog,
    };
  } catch (error: any) {
    console.error('Clock in error:', error);
    return {
      success: false,
      error: error.message || 'Failed to clock in',
    };
  }
}

/**
 * Clock Out Action
 */
export async function clockOutAction(
  employeeId: number,
  notes?: string,
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  },
): Promise<ActionResult> {
  try {
    // Get summary to check if less than 8 hours
    const summary = await getTimeLogSummary(employeeId);

    const timeLog = await dbClockOut(employeeId, notes, location);

    revalidatePath('/employee/dashboard');
    revalidatePath('/employee/attendance');

    return {
      success: true,
      data: {
        timeLog,
        totalHoursToday: summary.total_hours_today,
      },
    };
  } catch (error: any) {
    console.error('Clock out error:', error);
    return {
      success: false,
      error: error.message || 'Failed to clock out',
    };
  }
}

/**
 * Get Time Log Summary Action
 */
export async function getTimeLogSummaryAction(
  employeeId: number,
): Promise<ActionResult> {
  try {
    const summary = await getTimeLogSummary(employeeId);

    return {
      success: true,
      data: summary,
    };
  } catch (error: any) {
    console.error('Get time log summary error:', error);
    return {
      success: false,
      error: error.message || 'Failed to get time log summary',
    };
  }
}
