'use server';

/**
 * Server actions for updating earned leave balances based on overtime
 */

import { requireRole } from '@/lib/auth';
import {
  updateEarnedLeaveBalance,
  batchUpdateEarnedLeaveBalances,
} from '@/lib/erp/leave-requests';
import { revalidatePath } from 'next/cache';

export interface UpdateEarnedLeaveResult {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Update earned leave balance for a specific employee
 */
export async function updateEmployeeEarnedLeaveAction(
  employeeId: number,
  year?: number,
): Promise<UpdateEarnedLeaveResult> {
  try {
    await requireRole(['admin', 'hr']);

    await updateEarnedLeaveBalance(employeeId, year);

    revalidatePath('/erp/leave-requests');
    revalidatePath('/employee/dashboard');

    return {
      success: true,
      message: 'Earned leave balance updated successfully',
    };
  } catch (error) {
    console.error('Update earned leave error:', error);
    return {
      success: false,
      error: 'Failed to update earned leave balance',
    };
  }
}

/**
 * Batch update earned leave for all active employees
 * Should be run monthly or as needed
 */
export async function batchUpdateEarnedLeaveAction(
  year?: number,
): Promise<UpdateEarnedLeaveResult> {
  try {
    await requireRole(['admin']);

    await batchUpdateEarnedLeaveBalances(year);

    revalidatePath('/erp/leave-requests');
    revalidatePath('/erp/dashboard');

    return {
      success: true,
      message: 'Earned leave updated for all employees successfully',
    };
  } catch (error) {
    console.error('Batch update earned leave error:', error);
    return {
      success: false,
      error: 'Failed to batch update earned leave balances',
    };
  }
}
