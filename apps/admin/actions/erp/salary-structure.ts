'use server';

/**
 * Server Actions for Salary Structures & Templates. Reads and templates are
 * admin/HR-gated; adding or cancelling a structure changes pay, so it needs
 * the approver — same as approving payroll or applying a career change.
 */

import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { requireApprover } from '@/lib/erp/approver';
import {
  getSalaryStructureHistory,
  createSalaryStructure,
  cancelSalaryStructure,
  getSalaryTemplates,
  createSalaryTemplate,
  updateSalaryTemplate,
} from '@/lib/erp/salary-structure';
import { revalidatePath } from 'next/cache';
import type { EmployeeSalaryStructure, EmployeeSalaryStructureWithRange, SalaryTemplate } from '@/types/erp';

export interface SalaryStructureActionResult<T = EmployeeSalaryStructure> {
  success: boolean;
  error?: string;
  data?: T;
}

const structureSchema = z.object({
  employee_id: z.number().min(1),
  basic_salary: z.number().min(0),
  hra: z.number().min(0),
  special_allowance: z.number().min(0),
  other_allowance: z.number().min(0),
  effective_from: z.string().min(1, 'Effective date is required'),
});

export async function getSalaryStructureHistoryAction(
  employeeId: number,
): Promise<EmployeeSalaryStructureWithRange[]> {
  try {
    await requireRole(['admin', 'hr']);
    return await getSalaryStructureHistory(employeeId);
  } catch (error) {
    console.error('Get salary structure history error:', error);
    return [];
  }
}

export async function createSalaryStructureAction(
  formData: FormData,
): Promise<SalaryStructureActionResult> {
  try {
    // A new revision changes what payroll pays, so only the approver can add
    // one directly — anyone else raises a salary revision (career change),
    // which waits for the approver to apply it.
    const session = await requireApprover();

    const validated = structureSchema.parse({
      employee_id: Number(formData.get('employee_id')),
      basic_salary: parseFloat(formData.get('basic_salary') as string) || 0,
      hra: parseFloat(formData.get('hra') as string) || 0,
      special_allowance: parseFloat(formData.get('special_allowance') as string) || 0,
      other_allowance: parseFloat(formData.get('other_allowance') as string) || 0,
      effective_from: formData.get('effective_from') as string,
    });

    const data = await createSalaryStructure(validated, session.userId);

    revalidatePath('/erp/payroll');
    return { success: true, data };
  } catch (error) {
    console.error('Create salary structure error:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create salary structure',
    };
  }
}

export async function cancelSalaryStructureAction(id: number): Promise<SalaryStructureActionResult> {
  try {
    await requireApprover();
    await cancelSalaryStructure(id);
    revalidatePath('/erp/payroll');
    return { success: true };
  } catch (error) {
    console.error('Cancel salary structure error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cancel salary structure',
    };
  }
}

export async function getSalaryTemplatesAction(): Promise<SalaryTemplate[]> {
  try {
    await requireRole(['admin', 'hr']);
    return await getSalaryTemplates();
  } catch (error) {
    console.error('Get salary templates error:', error);
    return [];
  }
}

const templateSchema = z.object({
  name: z.string().trim().min(1, 'Template name is required'),
  basic_salary: z.number().min(0),
  hra: z.number().min(0),
  special_allowance: z.number().min(0),
  other_allowance: z.number().min(0),
});

export async function createSalaryTemplateAction(
  formData: FormData,
): Promise<SalaryStructureActionResult<SalaryTemplate>> {
  try {
    await requireRole(['admin', 'hr']);
    const validated = templateSchema.parse({
      name: formData.get('name') as string,
      basic_salary: parseFloat(formData.get('basic_salary') as string) || 0,
      hra: parseFloat(formData.get('hra') as string) || 0,
      special_allowance: parseFloat(formData.get('special_allowance') as string) || 0,
      other_allowance: parseFloat(formData.get('other_allowance') as string) || 0,
    });
    const data = await createSalaryTemplate(validated);
    revalidatePath('/erp/payroll');
    return { success: true, data };
  } catch (error) {
    console.error('Create salary template error:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create template',
    };
  }
}

export async function updateSalaryTemplateAction(
  id: number,
  formData: FormData,
): Promise<SalaryStructureActionResult<SalaryTemplate>> {
  try {
    await requireRole(['admin', 'hr']);
    const validated = templateSchema.parse({
      name: formData.get('name') as string,
      basic_salary: parseFloat(formData.get('basic_salary') as string) || 0,
      hra: parseFloat(formData.get('hra') as string) || 0,
      special_allowance: parseFloat(formData.get('special_allowance') as string) || 0,
      other_allowance: parseFloat(formData.get('other_allowance') as string) || 0,
    });
    const data = await updateSalaryTemplate(id, validated);
    revalidatePath('/erp/payroll');
    return { success: true, data };
  } catch (error) {
    console.error('Update salary template error:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update template',
    };
  }
}
