/**
 * Effective-dated salary structures (Basic/HRA/Special/Other) for full-time
 * employees, and the reusable templates used to pre-fill them.
 *
 * "Current" is always the row with the latest effective_from <= the date
 * being looked up — there is no effective_to/superseded bookkeeping to
 * maintain when a new revision is added. History views derive a display
 * range from ordering instead (see getSalaryStructureHistory).
 */

import { supabaseServer as supabase } from '@/lib/supabase-server';
import type { Employee, EmployeeSalaryStructure, EmployeeSalaryStructureWithRange, SalaryTemplate } from '@/types/erp';

function assertGrossMatchesComponents(components: {
  basic_salary: number;
  hra: number;
  special_allowance: number;
  other_allowance: number;
}): number {
  const { basic_salary, hra, special_allowance, other_allowance } = components;
  for (const [label, value] of Object.entries(components)) {
    if (value < 0) throw new Error(`${label} cannot be negative`);
  }
  return Math.round((basic_salary + hra + special_allowance + other_allowance) * 100) / 100;
}

/**
 * The salary structure effective for an employee as of a given date (usually
 * the last day of a payroll month). Returns null if the employee has never
 * had one configured — callers fall back to the employee's flat
 * monthly_salary in that case, exactly as payroll worked before this table
 * existed.
 */
export async function getEffectiveSalaryStructure(
  employeeId: number,
  asOfDate: string, // YYYY-MM-DD
): Promise<EmployeeSalaryStructure | null> {
  const { data, error } = await supabase
    .from('employee_salary_structure')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('status', 'active')
    .lte('effective_from', asOfDate)
    .order('effective_from', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return (data as EmployeeSalaryStructure | null) ?? null;
}

/**
 * Full history for an employee, newest first, with a display-only derived
 * effective_to (the next row's effective_from minus a day, or null for the
 * current one). Cancelled rows are excluded — they were never real pay.
 */
export async function getSalaryStructureHistory(
  employeeId: number,
): Promise<EmployeeSalaryStructureWithRange[]> {
  const { data, error } = await supabase
    .from('employee_salary_structure')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('status', 'active')
    .order('effective_from', { ascending: false });

  if (error) throw error;
  const rows = (data || []) as EmployeeSalaryStructure[];

  return rows.map((row, i) => {
    if (i === 0) return { ...row, effective_to: null };
    const next = rows[i - 1]; // newer row (ascending index = older)
    const nextStart = new Date(next.effective_from);
    nextStart.setDate(nextStart.getDate() - 1);
    return { ...row, effective_to: nextStart.toISOString().split('T')[0] };
  });
}

/**
 * Create a new salary structure revision for a full-time employee. Only
 * ever inserts a new row — an existing revision is never edited in place,
 * so a payroll row that already snapshotted an older revision's numbers is
 * never retroactively changed.
 */
export async function createSalaryStructure(
  data: {
    employee_id: number;
    basic_salary: number;
    hra: number;
    special_allowance: number;
    other_allowance: number;
    effective_from: string;
    source_career_history_id?: number | null;
  },
  createdBy: number | null,
  options: { becomesFullTime?: boolean } = {},
): Promise<EmployeeSalaryStructure> {
  const grossSalary = assertGrossMatchesComponents(data);
  if (grossSalary <= 0) {
    throw new Error('Gross salary must be greater than zero');
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.effective_from) || Number.isNaN(Date.parse(data.effective_from))) {
    throw new Error('Effective date must be a valid date (YYYY-MM-DD)');
  }

  // A career change that *makes* the employee full-time (e.g. a future-dated
  // intern conversion) creates the structure while they are still an intern
  // — the caller has already checked the resulting employment type.
  if (!options.becomesFullTime) {
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('employment_type')
      .eq('id', data.employee_id)
      .single();
    if (employeeError) throw employeeError;
    if ((employee as Pick<Employee, 'employment_type'>).employment_type !== 'full-time') {
      throw new Error('Salary structures can only be created for full-time employees');
    }
  }

  const { data: latest } = await supabase
    .from('employee_salary_structure')
    .select('effective_from')
    .eq('employee_id', data.employee_id)
    .eq('status', 'active')
    .order('effective_from', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (latest && data.effective_from <= latest.effective_from) {
    throw new Error(
      `A new revision must take effect after the current one (${latest.effective_from}). To fix a mistake, cancel it instead of backdating a new one.`,
    );
  }

  const { data: created, error } = await supabase
    .from('employee_salary_structure')
    .insert({
      employee_id: data.employee_id,
      basic_salary: data.basic_salary,
      hra: data.hra,
      special_allowance: data.special_allowance,
      other_allowance: data.other_allowance,
      gross_salary: grossSalary,
      effective_from: data.effective_from,
      status: 'active',
      source_career_history_id: data.source_career_history_id ?? null,
      created_by: createdBy,
    })
    .select()
    .single();

  if (error) throw error;
  return created as EmployeeSalaryStructure;
}

/**
 * Thin wrapper used by the Career Change flow (salary_revision / promotion /
 * intern_conversion) when it results in a full-time employee with a
 * breakdown supplied. Tags the row with source_career_history_id so
 * cancelCareerChangeById can find and cancel it if the change is cancelled.
 */
export async function createSalaryStructureFromCareerChange(
  employeeId: number,
  breakdown: { basic_salary: number; hra: number; special_allowance: number; other_allowance: number },
  effectiveDate: string,
  careerHistoryId: number,
  createdBy: number | null,
): Promise<EmployeeSalaryStructure> {
  return createSalaryStructure(
    {
      employee_id: employeeId,
      ...breakdown,
      effective_from: effectiveDate,
      source_career_history_id: careerHistoryId,
    },
    createdBy,
    { becomesFullTime: true },
  );
}

/**
 * Void a structure row — used directly, or via cancelCareerChangeById.
 * Refused once a paid payroll month was generated from it: that month really
 * was paid on this structure, so it must stay in the history.
 */
export async function cancelSalaryStructure(id: number): Promise<void> {
  const { count, error: paidError } = await supabase
    .from('payroll')
    .select('id', { count: 'exact', head: true })
    .eq('salary_structure_id', id)
    .eq('status', 'paid');
  if (paidError) throw paidError;
  if ((count || 0) > 0) {
    throw new Error(
      'This salary structure has already been paid out in a finalized payroll month and cannot be cancelled. Add a new revision instead.',
    );
  }

  const { error } = await supabase
    .from('employee_salary_structure')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

/** Cancel whichever structure row (if any) a given career change created. */
export async function cancelSalaryStructureByCareerHistoryId(careerHistoryId: number): Promise<void> {
  const { error } = await supabase
    .from('employee_salary_structure')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('source_career_history_id', careerHistoryId)
    .eq('status', 'active');
  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────────────────────
// Salary Templates
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The company's default salary template — the oldest active one (the seeded
 * "Standard ₹35,000" unless an admin deactivates it). Used to split the gross
 * of a full-time employee who has no salary structure of their own yet, so
 * their payslip still shows Basic/HRA/Special/Other.
 */
export async function getDefaultSalaryTemplate(): Promise<SalaryTemplate | null> {
  const { data, error } = await supabase
    .from('salary_templates')
    .select('*')
    .eq('is_active', true)
    .order('id', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as SalaryTemplate | null) ?? null;
}

export async function getSalaryTemplates(): Promise<SalaryTemplate[]> {
  const { data, error } = await supabase
    .from('salary_templates')
    .select('*')
    .eq('is_active', true)
    .order('gross_salary', { ascending: true });
  if (error) throw error;
  return (data || []) as SalaryTemplate[];
}

export async function createSalaryTemplate(data: {
  name: string;
  basic_salary: number;
  hra: number;
  special_allowance: number;
  other_allowance: number;
}): Promise<SalaryTemplate> {
  const grossSalary = assertGrossMatchesComponents(data);
  const { data: created, error } = await supabase
    .from('salary_templates')
    .insert({ ...data, gross_salary: grossSalary })
    .select()
    .single();
  if (error) throw error;
  return created as SalaryTemplate;
}

export async function updateSalaryTemplate(
  id: number,
  data: { name: string; basic_salary: number; hra: number; special_allowance: number; other_allowance: number },
): Promise<SalaryTemplate> {
  const grossSalary = assertGrossMatchesComponents(data);
  const { data: updated, error } = await supabase
    .from('salary_templates')
    .update({ ...data, gross_salary: grossSalary, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return updated as SalaryTemplate;
}
