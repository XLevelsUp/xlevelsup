'use server';

/**
 * Server actions for recomputing earned leave balances from off-day work
 * (see lib/erp/earned-leave.ts)
 */

import { requireRole } from '@/lib/auth';
import { syncEarnedLeaveBalance, syncAllEarnedLeaveBalances } from '@/lib/erp/earned-leave';
import { revalidatePath } from 'next/cache';

export interface UpdateEarnedLeaveResult {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Recompute earned leave balance for a specific employee
 */
export async function updateEmployeeEarnedLeaveAction(
  employeeId: number,
  year?: number,
): Promise<UpdateEarnedLeaveResult> {
  try {
    await requireRole(['admin', 'hr']);

    await syncEarnedLeaveBalance(employeeId, year || new Date().getFullYear());

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
 * Recompute earned leave for every employee across their whole attendance
 * history. Balances also refresh on their own whenever one is viewed or a
 * leave request is checked against it — this is for a full recalculation.
 */
export async function batchUpdateEarnedLeaveAction(): Promise<UpdateEarnedLeaveResult> {
  try {
    await requireRole(['admin']);

    const { employees, years } = await syncAllEarnedLeaveBalances();

    revalidatePath('/erp/leave-requests');
    revalidatePath('/erp/dashboard');

    return {
      success: true,
      message: `Earned leave recalculated for ${employees} employees (${years[0]}–${years[years.length - 1]})`,
    };
  } catch (error) {
    console.error('Batch update earned leave error:', error);
    return {
      success: false,
      error: 'Failed to recalculate earned leave balances',
    };
  }
}
