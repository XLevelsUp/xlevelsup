'use server';

import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { requireAdminApprover, assertNotOwn } from '@/lib/erp/approver';
import {
  getAllPayroll,
  getPayrollById,
  createPayroll,
  updatePayrollAdjustments,
  updatePayrollDeductions,
  updatePayrollStatus,
  markPayrollPaid,
  deletePayroll,
  deletePayrollByMonth,
  getEmployeePayrollHistory,
  getPayrollPayslipPath,
  renderPayslipForPayroll,
  regeneratePaidPayslip,
  type EmployeePayrollHistoryRow,
} from '@/lib/erp/payroll';
import { buildPayrollPlan } from '@/lib/erp/payroll-plan';
import { getPayslipSignedUrl } from '@/lib/erp/payslips';
import { revalidatePath } from 'next/cache';
import type { Payroll, PayrollWithEmployee } from '@/types/erp';

/**
 * What a bulk payroll operation reports back — generate fills
 * generated/skipped/errors, delete-month fills deletedCount. Distinct from a
 * Payroll row, which is what the single-record actions return.
 */
export interface PayrollBulkSummary {
  generated?: number;
  skipped?: number;
  errors?: string[];
  deletedCount?: number;
  /** Paid (finalized) records a month delete left in place. */
  keptPaidCount?: number;
  /** Approved (locked) records a month delete left in place. */
  keptApprovedCount?: number;
  /** Why a generate run was refused — see MissingAttendance. */
  missingAttendance?: MissingAttendance[];
}

/** One employee's attendance gaps that block a payroll run. */
export interface MissingAttendance {
  employee: string;
  /** Working days with no attendance row (and no approved full-day leave). */
  dates: string[];
  /** Weekend/holiday days worked but never clocked out, or with no hours logged. */
  offDayDates: string[];
}

/**
 * `payroll` carries a different payload depending on the action, so the type
 * parameter lets each one declare which it is rather than every caller having
 * to narrow a union.
 */
export interface PayrollActionResult<T = Payroll | PayrollBulkSummary> {
  success: boolean;
  error?: string;
  payroll?: T;
}

/**
 * Get all payroll records
 */
export async function getPayrollAction(filters?: {
  month?: string;
  status?: string;
  employee_id?: number;
}): Promise<PayrollWithEmployee[]> {
  try {
    await requireRole(['admin', 'hr']);
    return await getAllPayroll(filters);
  } catch (error) {
    console.error('Get payroll error:', error);
    return [];
  }
}

/**
 * Generate payroll for a specific month
 */
export async function generatePayrollAction(
  formData: FormData,
): Promise<PayrollActionResult<PayrollBulkSummary>> {
  try {
    const session = await requireRole(['admin', 'hr']);

    const month = formData.get('month') as string;

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return { success: false, error: 'Invalid month format' };
    }

    // Everyone active — or only the ones picked in the Generate dialog, when a
    // selection was sent.
    const selectedIds = new Set(
      formData.getAll('employee_ids').map((v) => Number(v)).filter((v) => Number.isInteger(v) && v > 0),
    );
    const { rows } = await buildPayrollPlan(month, selectedIds);

    if (rows.length === 0) {
      return { success: false, error: 'No active employees found' };
    }

    // Every working day must be accounted for before anyone is paid for the
    // month. Refuse the whole run — not just the affected employees — so a
    // month is never left half-generated while the gaps get fixed.
    const missingAttendance: MissingAttendance[] = rows.flatMap((row) =>
      row.outcome === 'blocked'
        ? [
            {
              employee: `${row.employee.name} (${row.employee.employee_id})`,
              dates: row.calculation.unrecorded_dates,
              offDayDates: row.offDayDates,
            },
          ]
        : [],
    );

    if (missingAttendance.length > 0) {
      const days = missingAttendance.reduce((n, m) => n + m.dates.length + m.offDayDates.length, 0);
      return {
        success: false,
        error: `Attendance not recorded for ${days} working day(s) across ${missingAttendance.length} employee(s). Record it (or deselect them) and try again.`,
        payroll: { missingAttendance },
      };
    }

    let generatedCount = 0;
    const skippedCount = rows.filter((row) => row.outcome !== 'ready').length;
    const errors: string[] = [];

    for (const row of rows) {
      if (row.outcome !== 'ready') continue;
      try {
        await createPayroll({
          ...row.payroll,
          generated_by: session.userId,
          generated_at: new Date().toISOString(),
        });
        generatedCount++;
      } catch (error) {
        errors.push(`Failed for ${row.employee.name}: ${error}`);
      }
    }

    revalidatePath('/erp/payroll');

    return {
      success: true,
      payroll: {
        generated: generatedCount,
        skipped: skippedCount,
        errors,
      },
    };
  } catch (error) {
    console.error('Generate payroll error:', error);
    return { success: false, error: 'Failed to generate payroll' };
  }
}

/**
 * Update payroll adjustments
 */
export async function updatePayrollAdjustmentsAction(
  id: number,
  formData: FormData,
): Promise<PayrollActionResult<Payroll>> {
  try {
    await requireRole(['admin', 'hr']);

    const bonus = parseFloat(formData.get('bonus') as string) || 0;
    const deduction = parseFloat(formData.get('deduction') as string) || 0;
    const notes = formData.get('notes') as string;

    const payroll = await updatePayrollAdjustments(id, bonus, deduction, notes);

    revalidatePath('/erp/payroll');
    return { success: true, payroll };
  } catch (error) {
    console.error('Update payroll adjustments error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update payroll',
    };
  }
}

const deductionsSchema = z.object({
  pf_deduction: z.number().min(0).default(0),
  esi_deduction: z.number().min(0).default(0),
  professional_tax_deduction: z.number().min(0).default(0),
  tds_deduction: z.number().min(0).default(0),
  other_structured_deduction: z.number().min(0).default(0),
});

/**
 * Update the structured deductions (PF/ESI/Professional Tax/TDS/Other) on a
 * payroll row. Every field defaults to 0 — nothing here is ever auto-applied;
 * an admin must explicitly enter an amount. Draft rows only — approved and
 * paid figures are locked (see updatePayrollDeductions).
 */
export async function updatePayrollDeductionsAction(
  id: number,
  formData: FormData,
): Promise<PayrollActionResult<Payroll>> {
  try {
    await requireRole(['admin', 'hr']);

    const validated = deductionsSchema.parse({
      pf_deduction: parseFloat(formData.get('pf_deduction') as string) || 0,
      esi_deduction: parseFloat(formData.get('esi_deduction') as string) || 0,
      professional_tax_deduction: parseFloat(formData.get('professional_tax_deduction') as string) || 0,
      tds_deduction: parseFloat(formData.get('tds_deduction') as string) || 0,
      other_structured_deduction: parseFloat(formData.get('other_structured_deduction') as string) || 0,
    });

    const payroll = await updatePayrollDeductions(id, validated);

    revalidatePath('/erp/payroll');
    return { success: true, payroll };
  } catch (error) {
    console.error('Update payroll deductions error:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update deductions',
    };
  }
}

/**
 * Update payroll status between draft and approved. Marking a record as
 * paid always goes through markPayrollPaidAction instead — it requires a
 * bank transfer reference ID and creates the matching ledger entry, and
 * that requirement must not be bypassable from this generic setter.
 *
 * Any admin may, but not approve their own payroll record. Moving one back
 * to draft stays open to them.
 */
export async function updatePayrollStatusAction(
  id: number,
  status: 'draft' | 'approved',
): Promise<PayrollActionResult<Payroll>> {
  try {
    const session = await requireAdminApprover();

    if (status === 'approved') {
      const existing = await getPayrollById(id);
      if (!existing) {
        return { success: false, error: 'Payroll record not found' };
      }
      await assertNotOwn(session, 'payroll', { forEmployeeId: existing.employee_id });
    }

    const payroll = await updatePayrollStatus(id, status, session.userId);

    revalidatePath('/erp/payroll');
    return { success: true, payroll };
  } catch (error) {
    console.error('Update payroll status error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update payroll status',
    };
  }
}

const markPaidSchema = z.object({
  reference_number: z.string().trim().min(1, 'A bank transfer reference ID is required to mark payroll as paid'),
});

/**
 * Mark payroll as paid via bank transfer. Requires a reference ID — this is
 * enforced here, not just in the UI, and creates the matching financial
 * ledger entry as part of the same operation (see markPayrollPaid). Any
 * admin may, but not for their own payroll record.
 */
export async function markPayrollPaidAction(
  id: number,
  referenceNumber: string,
): Promise<PayrollActionResult<Payroll>> {
  try {
    const session = await requireAdminApprover();

    const validated = markPaidSchema.parse({ reference_number: referenceNumber });

    const existing = await getPayrollById(id);
    if (!existing) {
      return { success: false, error: 'Payroll record not found' };
    }
    await assertNotOwn(session, 'payroll', { forEmployeeId: existing.employee_id });

    const payroll = await markPayrollPaid(id, validated.reference_number, session.userId);

    revalidatePath('/erp/payroll');
    revalidatePath('/erp/finances');

    return { success: true, payroll };
  } catch (error) {
    console.error('Mark payroll paid error:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to mark payroll as paid',
    };
  }
}

/**
 * Delete payroll
 */
export async function deletePayrollAction(
  id: number,
): Promise<PayrollActionResult> {
  try {
    await requireRole(['admin', 'hr']);
    await deletePayroll(id);
    revalidatePath('/erp/payroll');
    return { success: true };
  } catch (error) {
    console.error('Delete payroll error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete payroll',
    };
  }
}

/**
 * Delete all draft payroll records for a month (so it can be regenerated
 * from scratch). Approved and paid records are kept.
 */
export async function deletePayrollForMonthAction(
  month: string,
): Promise<PayrollActionResult<PayrollBulkSummary>> {
  try {
    await requireRole(['admin', 'hr']);

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return { success: false, error: 'Invalid month format' };
    }

    const { deleted, keptPaid, keptApproved } = await deletePayrollByMonth(month);

    revalidatePath('/erp/payroll');
    return {
      success: true,
      payroll: { deletedCount: deleted, keptPaidCount: keptPaid, keptApprovedCount: keptApproved },
    };
  } catch (error) {
    console.error('Delete payroll for month error:', error);
    return { success: false, error: 'Failed to delete payroll for month' };
  }
}

/**
 * One employee's full payroll history (every month, any status) for the
 * admin payslip list on the Employees page.
 */
export async function getEmployeePayrollHistoryAction(
  employeeId: number,
): Promise<EmployeePayrollHistoryRow[]> {
  try {
    await requireRole(['admin', 'hr']);
    return await getEmployeePayrollHistory(employeeId);
  } catch (error) {
    console.error('Get employee payroll history error:', error);
    return [];
  }
}

/**
 * Open a payroll row's payslip. A paid month returns a signed URL to the
 * finalized PDF stored at payment time; any other month is rendered on the
 * fly from its current figures as a watermarked PREVIEW (returned as base64,
 * never stored), so it can be checked before it is approved and paid.
 */
export async function getPayslipForPayrollAction(payrollId: number): Promise<{
  success: boolean;
  error?: string;
  url?: string;
  previewBase64?: string;
  fileName?: string;
}> {
  try {
    await requireRole(['admin', 'hr']);

    const record = await getPayrollById(payrollId);
    if (!record) return { success: false, error: 'Payroll record not found' };

    if (record.status === 'paid') {
      const path = await getPayrollPayslipPath(payrollId);
      if (!path) {
        return {
          success: false,
          error: 'No payslip PDF was stored for this paid month. Use "Regenerate PDF" to create it.',
        };
      }
      const url = await getPayslipSignedUrl(path);
      return url ? { success: true, url } : { success: false, error: 'Could not open payslip' };
    }

    const rendered = await renderPayslipForPayroll(record, { preview: true });
    if (!rendered) return { success: false, error: 'Employee record not found' };
    return {
      success: true,
      previewBase64: Buffer.from(rendered.pdf).toString('base64'),
      fileName: `Payslip-Preview-${rendered.employeeIdDisplay}-${record.month}.pdf`,
    };
  } catch (error) {
    console.error('Get payslip for payroll error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to open payslip' };
  }
}

/**
 * Re-render a paid month's payslip PDF from its frozen snapshot, original
 * payment date and reference — the figures cannot change.
 */
export async function regeneratePayslipAction(payrollId: number): Promise<{ success: boolean; error?: string }> {
  try {
    await requireRole(['admin', 'hr']);
    await regeneratePaidPayslip(payrollId);
    revalidatePath('/erp/payroll');
    revalidatePath('/erp/finances');
    return { success: true };
  } catch (error) {
    console.error('Regenerate payslip error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to regenerate payslip' };
  }
}
