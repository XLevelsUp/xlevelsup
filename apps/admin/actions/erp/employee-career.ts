'use server';

/**
 * Server Actions for Employee Career & Promotion Management
 */

import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { requireApprover, isApprover } from '@/lib/erp/approver';
import {
  insertEmployeeCareerHistory,
  fetchEmployeeCareerHistory,
  fetchAllCareerHistory,
  fetchPendingEffectiveChanges,
  applyCareerChangeById,
  cancelCareerChangeById,
  hasPendingCareerChange,
} from '@/lib/erp/employee-career';
import { getEmployeeById } from '@/lib/erp/employees';
import { revalidatePath } from 'next/cache';
import type {
  EmployeeCareerHistory,
  EmployeeCareerHistoryWithNames,
  EmployeeCareerChangeType,
  CareerChangeFormData,
} from '@/types/erp';

// ─────────────────────────────────────────────────────────────────────────────
// Validation Schemas
// ─────────────────────────────────────────────────────────────────────────────

const careerChangeSchema = z
  .object({
    employee_id: z.number().min(1, 'Employee ID is required'),
    change_type: z.enum([
      'intern_conversion',
      'promotion',
      'designation_change',
      'department_change',
      'salary_revision',
      'employment_type_change',
    ]),
    current_employment_type: z.string().optional(),
    current_designation: z.string().optional(),
    current_department: z.string().optional(),
    current_salary_type: z.string().optional(),
    current_salary: z.number().nullable().optional(),

    new_employment_type: z.string().optional(),
    new_designation: z.string().optional(),
    new_department: z.string().optional(),
    new_salary_type: z.string().optional(),
    new_salary: z.number().min(0).nullable().optional(),

    // Structured breakdown — only meaningful when the resulting employment
    // type is full-time (see CareerChangeModal.tsx). All four or none.
    new_basic_salary: z.number().min(0).optional(),
    new_hra: z.number().min(0).optional(),
    new_special_allowance: z.number().min(0).optional(),
    new_other_allowance: z.number().min(0).optional(),

    effective_date: z.string().min(1, 'Effective date is required'),
    reason: z.string().min(5, 'Reason must be at least 5 characters'),
    notes: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    // Intern conversion: must move away from intern
    if (data.change_type === 'intern_conversion') {
      if (!data.new_employment_type || data.new_employment_type === 'intern') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'New employment type is required and must not be "intern"',
          path: ['new_employment_type'],
        });
      }
    }

    // Promotion / designation_change: new designation required
    if (
      data.change_type === 'promotion' ||
      data.change_type === 'designation_change'
    ) {
      if (!data.new_designation || data.new_designation.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'New designation is required',
          path: ['new_designation'],
        });
      }
    }

    // Department change: new department required
    if (data.change_type === 'department_change') {
      if (!data.new_department || data.new_department.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'New department is required',
          path: ['new_department'],
        });
      }
    }

    // Salary revision: new salary must be provided
    if (data.change_type === 'salary_revision') {
      if (data.new_salary === null || data.new_salary === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'New salary is required for salary revision',
          path: ['new_salary'],
        });
      }
    }

    // Employment type change (non-intern): new type required
    if (data.change_type === 'employment_type_change') {
      if (!data.new_employment_type) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'New employment type is required',
          path: ['new_employment_type'],
        });
      }
    }

    // Structured breakdown: all four fields or none, and the sum must match
    // new_salary (which the form always sets to the computed gross for a
    // full-time change) — this is the same "gross = sum of components"
    // guarantee createSalaryStructure enforces, checked here too so a
    // mismatch surfaces before the career-history row is even written.
    const breakdownFields = [
      data.new_basic_salary,
      data.new_hra,
      data.new_special_allowance,
      data.new_other_allowance,
    ];
    const suppliedCount = breakdownFields.filter((v) => v !== undefined).length;
    if (suppliedCount > 0 && suppliedCount < 4) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Basic, HRA, Special Allowance and Other Allowance must all be provided together',
        path: ['new_basic_salary'],
      });
    } else if (suppliedCount === 4) {
      const gross = breakdownFields.reduce((sum: number, v) => sum + (v ?? 0), 0);
      const rounded = Math.round(gross * 100) / 100;
      if (data.new_salary != null && Math.abs(rounded - data.new_salary) > 0.01) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Basic + HRA + Special + Other (${rounded}) must equal the new salary (${data.new_salary})`,
          path: ['new_basic_salary'],
        });
      }
    }
  });

// ─────────────────────────────────────────────────────────────────────────────
// Actions
// ─────────────────────────────────────────────────────────────────────────────

export interface CareerChangeActionResult {
  success: boolean;
  error?: string;
  data?: EmployeeCareerHistory;
}

/**
 * Unified action to create any type of employee career change.
 * Handles: intern_conversion | promotion | designation_change |
 *          department_change | salary_revision | employment_type_change
 */
export async function createCareerChangeAction(
  formData: CareerChangeFormData,
): Promise<CareerChangeActionResult> {
  try {
    const session = await requireRole(['admin', 'hr']);

    // Validate input
    const validated = careerChangeSchema.parse(formData);

    // Verify employee exists
    const employee = await getEmployeeById(validated.employee_id);
    if (!employee) {
      return { success: false, error: 'Employee not found' };
    }

    // Validate employment type for intern conversion
    if (
      validated.change_type === 'intern_conversion' &&
      employee.employment_type !== 'intern'
    ) {
      return {
        success: false,
        error: 'Employee is not an intern. Use "Employment Type Change" instead.',
      };
    }

    // Prevent promotions/designation changes for inactive employees
    if (
      employee.status !== 'active' &&
      validated.change_type !== 'salary_revision'
    ) {
      return {
        success: false,
        error: 'Cannot create career changes for inactive employees',
      };
    }

    // Check for pending career changes of same type
    const hasPending = await hasPendingCareerChange(
      validated.employee_id,
      validated.change_type as EmployeeCareerChangeType,
    );
    if (hasPending) {
      return {
        success: false,
        error: `Employee already has a pending ${validated.change_type.replace(/_/g, ' ')} request`,
      };
    }

    const record = await insertEmployeeCareerHistory(
      validated as CareerChangeFormData,
      // `session.userId`, not `session.id`: requireRole returns a SessionPayload,
      // which has no `id`. Its `[key: string]: unknown` index signature meant
      // `session.id` type-checked once cast, but at runtime the JWT carries only
      // userId/email/role — so this passed `undefined` as requested_by.
      session.userId,
      // Only the approver's own changes take effect straight away; anyone
      // else's wait as pending until the approver applies them.
      { requesterIsApprover: await isApprover(session) },
    );

    revalidatePath('/erp/employees');
    return { success: true, data: record };
  } catch (error) {
    console.error('Create career change error:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to create career change' };
  }
}

/**
 * Apply a pending_effective career change (Admin explicitly applies on/after effective date).
 */
export async function applyCareerChangeAction(
  historyId: number,
): Promise<CareerChangeActionResult> {
  try {
    const session = await requireApprover();
    await applyCareerChangeById(historyId, session.userId);
    revalidatePath('/erp/employees');
    return { success: true };
  } catch (error) {
    console.error('Apply career change error:', error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to apply career change' };
  }
}

/**
 * Cancel a pending / pending_effective career change.
 */
export async function cancelCareerChangeAction(
  historyId: number,
): Promise<CareerChangeActionResult> {
  try {
    await requireApprover();
    await cancelCareerChangeById(historyId);
    revalidatePath('/erp/employees');
    return { success: true };
  } catch (error) {
    console.error('Cancel career change error:', error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to cancel career change' };
  }
}

/**
 * Get career history for a specific employee.
 */
export async function getEmployeeCareerHistoryAction(
  employeeId: number,
): Promise<EmployeeCareerHistory[]> {
  try {
    await requireRole(['admin', 'hr']);
    return await fetchEmployeeCareerHistory(employeeId);
  } catch (error) {
    console.error('Get career history error:', error);
    return [];
  }
}

/**
 * Get all pending-effective changes that are ready to be applied.
 */
export async function getPendingEffectiveChangesAction(): Promise<
  EmployeeCareerHistoryWithNames[]
> {
  try {
    await requireRole(['admin', 'hr']);
    return await fetchPendingEffectiveChanges();
  } catch (error) {
    console.error('Get pending effective changes error:', error);
    return [];
  }
}

/**
 * Get all career history (admin view).
 */
export async function getAllCareerHistoryAction(filters?: {
  change_type?: EmployeeCareerChangeType;
  status?: string;
  employeeId?: number;
}): Promise<EmployeeCareerHistoryWithNames[]> {
  try {
    await requireRole(['admin', 'hr']);
    return await fetchAllCareerHistory(filters);
  } catch (error) {
    console.error('Get all career history error:', error);
    return [];
  }
}
