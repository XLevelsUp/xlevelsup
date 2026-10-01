'use server';

import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { requireApprover } from '@/lib/erp/approver';
import {
  getAllPayroll,
  getPayrollById,
  getPayrollByEmployeeMonth,
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
import { getEffectiveSalaryStructure, getDefaultSalaryTemplate } from '@/lib/erp/salary-structure';
import { getFullTimeConversionDate } from '@/lib/erp/employee-career';
import { getAllEmployees } from '@/lib/erp/employees';
import { getPayslipSignedUrl } from '@/lib/erp/payslips';
import { getMonthlyAttendanceByEmployeeDate } from '@/lib/erp/attendance';
import { getHolidayDateSetInRange } from '@/lib/erp/holidays';
import { getApprovedLeaveStatusByEmployeeDate } from '@/lib/erp/leave-requests';
import { getOffDayWork } from '@/lib/erp/earned-leave';
import {
  getWorkingDayDatesInMonth,
  calculatePayroll,
  getMonthDateRange,
  splitGrossByTemplate,
  type PayrollAttendanceStatus,
} from '@/lib/erp/utils';
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
  /** Why a generate run was refused — see MissingAttendance. */
  missingAttendance?: MissingAttendance[];
}

/** One employee's attendance gaps that block a payroll run. */
export interface MissingAttendance {
  employee: string;
  /** Working days with no attendance row (and no approved leave). */
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

    // Get all active employees — or only the ones picked in the Generate
    // dialog, when a selection was sent.
    const selectedIds = new Set(
      formData.getAll('employee_ids').map((v) => Number(v)).filter((v) => Number.isInteger(v) && v > 0),
    );
    const employees = (await getAllEmployees({ status: 'active' })).filter(
      (e) => selectedIds.size === 0 || selectedIds.has(e.id),
    );

    if (employees.length === 0) {
      return { success: false, error: 'No active employees found' };
    }

    const [year, monthNum] = month.split('-').map(Number);

    // Public holidays are not working days: counting them would understate
    // per-day salary and dock anyone who correctly did not work that day.
    const { startDate, endDate } = getMonthDateRange(month);
    const holidaySet = await getHolidayDateSetInRange(startDate, endDate);
    const workingDayDates = getWorkingDayDatesInMonth(
      year,
      monthNum,
      holidaySet,
    );

    // One query for the whole run, rather than one per employee.
    const attendanceByEmployee = await getMonthlyAttendanceByEmployeeDate(month);
    const leaveByEmployee = await getApprovedLeaveStatusByEmployeeDate(workingDayDates);
    const defaultTemplate = await getDefaultSalaryTemplate();

    // Weekend/holiday work that was never clocked out or has no hours logged.
    // It isn't paid, but it can't be priced for earned leave either, so it
    // has to be fixed before the month's payroll runs.
    const unrecordedOffDays = new Map<number, string[]>();
    for (const work of await getOffDayWork(startDate, endDate)) {
      if (work.recorded) continue;
      unrecordedOffDays.set(work.employee_id, [
        ...(unrecordedOffDays.get(work.employee_id) || []),
        work.date,
      ]);
    }

    let generatedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];
    const planned: Omit<Payroll, 'id' | 'created_at' | 'updated_at'>[] = [];
    const missingAttendance: MissingAttendance[] = [];

    for (const employee of employees) {
      // Interns and freelancers never get a payslip through this system —
      // interns are on a stipend (not a salary), and freelancers are paid
      // through the hourly flow. This holds even if one of them happens to
      // have a monthly_salary value set.
      if (employee.employment_type === 'intern' || employee.employment_type === 'freelancer') {
        skippedCount++;
        continue;
      }

      // Check if payroll already exists
      const existing = await getPayrollByEmployeeMonth(employee.id, month);
      if (existing) {
        skippedCount++;
        continue;
      }

      // Full-time employees may have a structured salary configured — if so,
      // its gross_salary and Basic/HRA/Special/Other breakdown are used and
      // snapshotted onto the payroll row instead of the flat monthly_salary.
      // Falls back to today's flat behavior when none exists yet (e.g. every
      // full-time employee before this feature was configured for them).
      const structure =
        employee.employment_type === 'full-time'
          ? await getEffectiveSalaryStructure(employee.id, endDate)
          : null;
      const effectiveGrossSalary = structure?.gross_salary ?? employee.monthly_salary;

      // A full-time employee with no structure of their own yet still gets
      // the standard Basic/HRA/Special/Other components on their payslip:
      // their flat gross split by the default template, snapshotted onto the
      // row like a real structure's would be (salary_structure_id stays null).
      const components =
        structure ??
        (employee.employment_type === 'full-time' && defaultTemplate && effectiveGrossSalary
          ? splitGrossByTemplate(effectiveGrossSalary, defaultTemplate)
          : null);

      // No monthly salary (or structure) configured — anyone whose pay
      // hasn't been set up yet. A zero row can't be approved or paid, so it
      // would only be noise on the payroll screen.
      if (!effectiveGrossSalary) {
        skippedCount++;
        continue;
      }

      // Approved leave fills only the days attendance has no row for — a
      // recorded attendance row always wins.
      const attendanceByDate = new Map<string, PayrollAttendanceStatus>([
        ...(leaveByEmployee.get(employee.id) || []),
        ...(attendanceByEmployee.get(employee.id) || []),
      ]);

      // A converted intern is only salaried from the conversion date — the
      // days before it were internship (stipend), so they're outside the
      // salaried window: prorated out of the conversion month, and a month
      // wholly before it gets no salary payslip at all (skipped below).
      const conversionDate =
        employee.employment_type === 'full-time' ? await getFullTimeConversionDate(employee.id) : null;
      const salariedFrom =
        conversionDate && (!employee.joining_date || conversionDate > employee.joining_date)
          ? conversionDate
          : employee.joining_date;

      // Calculate payroll
      const calculation = calculatePayroll(
        effectiveGrossSalary,
        workingDayDates,
        attendanceByDate,
        { from: salariedFrom, to: employee.end_date },
      );

      // Not employed for a single working day of this month — someone hired
      // after it, or who left before it. No payslip is owed, and generating a
      // zero row would just be noise on the screen.
      if (calculation.not_employed_days === calculation.total_working_days) {
        skippedCount++;
        continue;
      }

      const offDayDates = (unrecordedOffDays.get(employee.id) || []).sort();
      if (calculation.unrecorded_dates.length > 0 || offDayDates.length > 0) {
        missingAttendance.push({
          employee: `${employee.name} (${employee.employee_id})`,
          dates: calculation.unrecorded_dates,
          offDayDates,
        });
        continue;
      }

      planned.push({
        employee_id: employee.id,
        month,
        total_working_days: calculation.total_working_days,
        present_days: calculation.present_days,
        paid_leave_days: calculation.paid_leave_days,
        unpaid_leave_days: calculation.unpaid_leave_days,
        absent_days: calculation.absent_days,
        half_days: calculation.half_days,
        payable_days: calculation.payable_days,
        per_day_salary: calculation.per_day_salary,
        gross_salary: calculation.gross_salary,
        bonus: 0,
        deduction: 0,
        // gross_salary is the contracted monthly pay; net is what's left
        // after loss of pay for unpaid days. The two differ whenever
        // payable_days < total_working_days.
        net_salary: calculation.net_salary,
        status: 'draft',
        notes: null,
        generated_by: session.userId,
        generated_at: new Date().toISOString(),
        approved_by: null,
        approved_at: null,
        paid_by: null,
        paid_at: null,
        salary_structure_id: structure?.id ?? null,
        basic_salary: components?.basic_salary ?? null,
        hra: components?.hra ?? null,
        special_allowance: components?.special_allowance ?? null,
        other_allowance: components?.other_allowance ?? null,
        pf_deduction: 0,
        esi_deduction: 0,
        professional_tax_deduction: 0,
        tds_deduction: 0,
        other_structured_deduction: 0,
      });
    }

    // Every working day must be accounted for before anyone is paid for the
    // month. Refuse the whole run — not just the affected employees — so a
    // month is never left half-generated while the gaps get fixed.
    if (missingAttendance.length > 0) {
      const days = missingAttendance.reduce((n, m) => n + m.dates.length + m.offDayDates.length, 0);
      return {
        success: false,
        error: `Attendance not recorded for ${days} working day(s) across ${missingAttendance.length} employee(s). Record it (or deselect them) and try again.`,
        payroll: { missingAttendance },
      };
    }

    for (const row of planned) {
      try {
        await createPayroll(row);
        generatedCount++;
      } catch (error) {
        const name = employees.find((e) => e.id === row.employee_id)?.name;
        errors.push(`Failed for ${name}: ${error}`);
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
 * an admin must explicitly enter an amount. Blocked once the record is paid
 * (see updatePayrollDeductions).
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
 */
export async function updatePayrollStatusAction(
  id: number,
  status: 'draft' | 'approved',
): Promise<PayrollActionResult<Payroll>> {
  try {
    const session = await requireApprover();

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
 * ledger entry as part of the same operation (see markPayrollPaid).
 */
export async function markPayrollPaidAction(
  id: number,
  referenceNumber: string,
): Promise<PayrollActionResult<Payroll>> {
  try {
    const session = await requireApprover();

    const validated = markPaidSchema.parse({ reference_number: referenceNumber });

    const existing = await getPayrollById(id);
    if (!existing) {
      return { success: false, error: 'Payroll record not found' };
    }

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
 * Delete all payroll records for a month (so it can be regenerated from scratch)
 */
export async function deletePayrollForMonthAction(
  month: string,
): Promise<PayrollActionResult<PayrollBulkSummary>> {
  try {
    await requireRole(['admin', 'hr']);

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return { success: false, error: 'Invalid month format' };
    }

    const { deleted, keptPaid } = await deletePayrollByMonth(month);

    revalidatePath('/erp/payroll');
    return { success: true, payroll: { deletedCount: deleted, keptPaidCount: keptPaid } };
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
