/**
 * Database functions for Payroll management
 */

import { supabaseServer as supabase } from '@/lib/supabase-server';
import { computeNetSalary, formatDate, getMonthName, splitGrossByTemplate } from '@/lib/erp/utils';
import { insertLedgerEntry } from '@/lib/erp/finance';
import { getEmployeeById } from '@/lib/erp/employees';
import { generatePayslipPdf, uploadPayslipPdf } from '@/lib/erp/payslips';
import { getDefaultSalaryTemplate } from '@/lib/erp/salary-structure';
import type { Payroll, PayrollWithEmployee, LedgerFormData } from '@/types/erp';

/**
 * A payroll row as PostgREST returns it from the joined select, before the
 * nested `employees` relation is flattened into employee_name / employee_role /
 * employee_department.
 */
interface PayrollJoinedRow extends Payroll {
  employees: { name: string; role: string; department: string };
}

/**
 * Get all payroll records with optional filters
 */
export async function getAllPayroll(filters?: {
  month?: string;
  status?: string;
  employee_id?: number;
}): Promise<PayrollWithEmployee[]> {
  let query = supabase.from('payroll').select(`
            *,
            employees!inner(
                name,
                role,
                department
            )
        `);

  if (filters?.month) {
    query = query.eq('month', filters.month);
  }

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.employee_id) {
    query = query.eq('employee_id', filters.employee_id);
  }

  query = query.order('month', { ascending: false });

  const { data, error } = await query;
  if (error) throw error;

  // Transform the nested employee data to flat structure
  return (data || []).map((item: PayrollJoinedRow) => ({
    ...item,
    employee_name: item.employees.name,
    employee_role: item.employees.role,
    employee_department: item.employees.department,
    employees: undefined,
  })) as PayrollWithEmployee[];
}

/**
 * Get payroll by ID
 */
export async function getPayrollById(
  id: number,
): Promise<PayrollWithEmployee | undefined> {
  const { data, error } = await supabase
    .from('payroll')
    .select(
      `
            *,
            employees!inner(
                name,
                role,
                department
            )
        `,
    )
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  if (!data) return undefined;

  // Transform the nested employee data to flat structure
  return {
    ...data,
    employee_name: data.employees.name,
    employee_role: data.employees.role,
    employee_department: data.employees.department,
    employees: undefined,
  } as PayrollWithEmployee;
}

/**
 * Get payroll for specific employee and month
 */
export async function getPayrollByEmployeeMonth(
  employeeId: number,
  month: string,
): Promise<Payroll | undefined> {
  const { data, error } = await supabase
    .from('payroll')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('month', month)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data || undefined;
}

/**
 * Create payroll record
 */
export async function createPayroll(
  data: Omit<Payroll, 'id' | 'created_at' | 'updated_at'>,
): Promise<Payroll> {
  const { data: result, error } = await supabase
    .from('payroll')
    .insert({
      employee_id: data.employee_id,
      month: data.month,
      total_working_days: data.total_working_days,
      present_days: data.present_days,
      paid_leave_days: data.paid_leave_days,
      unpaid_leave_days: data.unpaid_leave_days,
      absent_days: data.absent_days,
      half_days: data.half_days,
      payable_days: data.payable_days,
      per_day_salary: data.per_day_salary,
      gross_salary: data.gross_salary,
      bonus: data.bonus || 0,
      deduction: data.deduction || 0,
      net_salary: data.net_salary,
      status: data.status,
      notes: data.notes || null,
      generated_by: data.generated_by || null,
      // Structured breakdown — only set for full-time employees with an
      // effective employee_salary_structure at generation time; left null
      // otherwise, matching every payroll row that predates this feature.
      salary_structure_id: data.salary_structure_id ?? null,
      basic_salary: data.basic_salary ?? null,
      hra: data.hra ?? null,
      special_allowance: data.special_allowance ?? null,
      other_allowance: data.other_allowance ?? null,
      pf_deduction: data.pf_deduction || 0,
      esi_deduction: data.esi_deduction || 0,
      professional_tax_deduction: data.professional_tax_deduction || 0,
      tds_deduction: data.tds_deduction || 0,
      other_structured_deduction: data.other_structured_deduction || 0,
    })
    .select()
    .single();

  if (error) throw error;
  return result;
}

/**
 * Update payroll adjustments (bonus, deduction, notes)
 */
export async function updatePayrollAdjustments(
  id: number,
  bonus: number,
  deduction: number,
  notes?: string,
): Promise<Payroll> {
  // Get current payroll
  const { data: payroll, error: fetchError } = await supabase
    .from('payroll')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError) throw fetchError;
  // A finalized (paid) payslip is an immutable snapshot — if a later salary
  // or attendance correction needs to happen, it belongs in a fresh payroll
  // run, never a silent edit to a record an employee has already been paid
  // (and downloaded a PDF for) against.
  if (payroll.status === 'paid') {
    throw new Error('Cannot modify a finalized (paid) payroll record');
  }

  // Must go through computeNetSalary: gross_salary is the full contracted
  // salary, so a plain `gross + bonus - deduction` here would silently drop
  // the loss of pay for unpaid days and overpay an absent employee.
  const { net_salary: netSalary } = computeNetSalary({
    total_working_days: payroll.total_working_days,
    payable_days: payroll.payable_days,
    per_day_salary: payroll.per_day_salary,
    gross_salary: payroll.gross_salary,
    bonus,
    deduction,
    pf_deduction: payroll.pf_deduction,
    esi_deduction: payroll.esi_deduction,
    professional_tax_deduction: payroll.professional_tax_deduction,
    tds_deduction: payroll.tds_deduction,
    other_structured_deduction: payroll.other_structured_deduction,
  });

  const { data, error } = await supabase
    .from('payroll')
    .update({
      bonus,
      deduction,
      net_salary: netSalary,
      notes: notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update the structured deductions (PF/ESI/Professional Tax/TDS/Other) on a
 * payroll row. None of these are ever auto-applied — every field defaults to
 * 0 (see createPayroll) and only changes when an admin explicitly sets one
 * here. Blocked once the record is paid, same as updatePayrollAdjustments.
 */
export async function updatePayrollDeductions(
  id: number,
  deductions: {
    pf_deduction: number;
    esi_deduction: number;
    professional_tax_deduction: number;
    tds_deduction: number;
    other_structured_deduction: number;
  },
): Promise<Payroll> {
  const { data: payroll, error: fetchError } = await supabase
    .from('payroll')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError) throw fetchError;
  if (payroll.status === 'paid') {
    throw new Error('Cannot modify a finalized (paid) payroll record');
  }
  for (const [label, value] of Object.entries(deductions)) {
    if (value < 0) throw new Error(`${label} cannot be negative`);
  }

  const { net_salary: netSalary } = computeNetSalary({
    total_working_days: payroll.total_working_days,
    payable_days: payroll.payable_days,
    per_day_salary: payroll.per_day_salary,
    gross_salary: payroll.gross_salary,
    bonus: payroll.bonus,
    deduction: payroll.deduction,
    ...deductions,
  });

  const { data, error } = await supabase
    .from('payroll')
    .update({
      ...deductions,
      net_salary: netSalary,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update payroll status between draft and approved. Marking a record paid
 * always goes through markPayrollPaid instead (see below) — that path
 * requires a bank transfer reference ID and creates the matching ledger
 * entry, which this generic setter must not be able to bypass.
 */
export async function updatePayrollStatus(
  id: number,
  status: 'draft' | 'approved',
  userId: number,
): Promise<Payroll> {
  const { data: existing, error: fetchError } = await supabase
    .from('payroll')
    .select('status')
    .eq('id', id)
    .single();
  if (fetchError) throw fetchError;
  if (existing.status === 'paid') {
    throw new Error('Cannot modify a finalized (paid) payroll record');
  }

  const updateData: Partial<Payroll> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === 'approved') {
    updateData.approved_by = userId;
    updateData.approved_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('payroll')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Mark a payroll record as paid via bank transfer, with a mandatory
 * reference ID. Creates the matching financial_ledger outflow entry first —
 * a payroll run is never left marked "paid" without a financial record
 * backing it — then flips the payroll status.
 */
export async function markPayrollPaid(
  id: number,
  referenceNumber: string,
  userId: number,
): Promise<Payroll> {
  const record = await getPayrollById(id);
  if (!record) {
    throw new Error('Payroll record not found');
  }
  if (record.status === 'paid') {
    throw new Error('This payroll record is already marked as paid');
  }

  // Generate and attach the payslip. Non-fatal: a PDF hiccup must never
  // block the actual payment from being recorded — the ledger entry (with
  // its reference ID) is what matters most, the payslip is a convenience
  // attached alongside it.
  let receiptPath: string | null = null;
  try {
    const rendered = await renderPayslipForPayroll(record, { preview: false });
    if (rendered) {
      receiptPath = await uploadPayslipPdf(rendered.pdf, rendered.employeeIdDisplay, record.month);
    }
  } catch (err) {
    console.error('Failed to generate/upload payslip:', err);
  }

  const ledgerEntry: LedgerFormData = {
    transaction_type: 'payroll',
    direction: 'outflow',
    category: 'Salary',
    amount: record.net_salary,
    transaction_date: formatDate(new Date()),
    payment_mode: 'Bank Transfer',
    payment_status: 'completed',
    employee_id: record.employee_id,
    payroll_id: record.id,
    payee_name: record.employee_name,
    reference_number: referenceNumber,
    description: `Salary payment — ${record.employee_name} (${getMonthName(record.month)})`,
    approval_status: 'paid',
    receipt_path: receiptPath,
  };
  await insertLedgerEntry(ledgerEntry, userId);

  const { data, error } = await supabase
    .from('payroll')
    .update({
      status: 'paid',
      paid_by: userId,
      paid_at: new Date().toISOString(),
      finalized_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Render the payslip PDF for a payroll row from its own snapshotted values —
 * never from the employee's current salary, so a later revision can't change
 * what an old month's payslip says. `preview` renders a watermarked preview
 * of a row that hasn't been paid yet. Returns null if the employee record no
 * longer exists.
 *
 * A full-time employee's row generated before they had any salary structure
 * carries only a flat gross; its Basic/HRA/Special/Other are then shown as
 * that gross split by the default salary template — same totals, just the
 * components the payslip is expected to list.
 */
export async function renderPayslipForPayroll(
  record: PayrollWithEmployee,
  { preview }: { preview: boolean },
): Promise<{ pdf: Uint8Array; employeeIdDisplay: string } | null> {
  const employee = await getEmployeeById(record.employee_id);
  if (!employee) return null;

  let structureEffectiveFrom: string | null = null;
  if (record.salary_structure_id) {
    const { data } = await supabase
      .from('employee_salary_structure')
      .select('effective_from')
      .eq('id', record.salary_structure_id)
      .maybeSingle();
    structureEffectiveFrom = data?.effective_from ?? null;
  }

  let fallbackBreakdown = null;
  if (record.basic_salary == null && employee.employment_type === 'full-time' && record.gross_salary > 0) {
    const template = await getDefaultSalaryTemplate();
    if (template) fallbackBreakdown = splitGrossByTemplate(record.gross_salary, template);
  }

  const pdf = generatePayslipPdf(
    record,
    {
      name: record.employee_name,
      employeeIdDisplay: employee.employee_id,
      department: record.employee_department,
      role: record.employee_role,
    },
    { preview, structureEffectiveFrom, fallbackBreakdown },
  );
  return { pdf, employeeIdDisplay: employee.employee_id };
}

/** The ledger payout entry a paid payroll row created (see markPayrollPaid). */
async function getPayrollLedgerEntry(payrollId: number): Promise<{
  id: number;
  receipt_path: string | null;
  transaction_date: string;
} | null> {
  const { data, error } = await supabase
    .from('financial_ledger')
    .select('id, receipt_path, transaction_date')
    .eq('payroll_id', payrollId)
    .eq('transaction_type', 'payroll')
    .order('id', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Storage path of the finalized payslip PDF for a paid payroll row, if any. */
export async function getPayrollPayslipPath(payrollId: number): Promise<string | null> {
  return (await getPayrollLedgerEntry(payrollId))?.receipt_path ?? null;
}

/**
 * Re-render a paid month's payslip PDF (e.g. after a layout change, or if
 * generation failed at pay time) and attach it to the same ledger entry.
 * Uses the payroll row's frozen snapshot — none of the figures can change. The previous file is kept in
 * storage, only the ledger's pointer moves.
 */
export async function regeneratePaidPayslip(payrollId: number): Promise<void> {
  const record = await getPayrollById(payrollId);
  if (!record) throw new Error('Payroll record not found');
  if (record.status !== 'paid') {
    throw new Error('Only paid (finalized) payroll has a payslip to regenerate — use Preview for unpaid months');
  }
  const ledger = await getPayrollLedgerEntry(payrollId);
  if (!ledger) throw new Error('No payment record found for this payroll month');

  const rendered = await renderPayslipForPayroll(record, { preview: false });
  if (!rendered) throw new Error('Employee record not found');

  const path = await uploadPayslipPdf(rendered.pdf, rendered.employeeIdDisplay, record.month);
  const { error } = await supabase
    .from('financial_ledger')
    .update({ receipt_path: path, updated_at: new Date().toISOString() })
    .eq('id', ledger.id);
  if (error) throw error;
}

/**
 * Delete a payroll record. Paid (finalized) records are permanent — they
 * back a ledger payment and an issued payslip, and deleting one would let
 * the month be generated and paid a second time.
 */
export async function deletePayroll(id: number): Promise<void> {
  const { data: existing, error: fetchError } = await supabase
    .from('payroll')
    .select('status')
    .eq('id', id)
    .maybeSingle();
  if (fetchError) throw fetchError;
  if (existing?.status === 'paid') {
    throw new Error('Cannot delete a finalized (paid) payroll record');
  }

  const { error } = await supabase.from('payroll').delete().eq('id', id).neq('status', 'paid');
  if (error) throw error;
}

/**
 * Delete all not-yet-paid payroll records for a given month (e.g. to
 * regenerate from scratch). Paid records are always kept — see deletePayroll.
 */
export async function deletePayrollByMonth(
  month: string,
): Promise<{ deleted: number; keptPaid: number }> {
  const { data, error } = await supabase
    .from('payroll')
    .delete()
    .eq('month', month)
    .neq('status', 'paid')
    .select('id');
  if (error) throw error;

  const { count, error: countError } = await supabase
    .from('payroll')
    .select('id', { count: 'exact', head: true })
    .eq('month', month)
    .eq('status', 'paid');
  if (countError) throw countError;

  return { deleted: (data || []).length, keptPaid: count || 0 };
}

/**
 * Get payroll statistics
 */
export async function getPayrollStats(month?: string): Promise<{
  total_records: number;
  total_payable: number;
  draft_count: number;
  approved_count: number;
  paid_count: number;
}> {
  let query = supabase.from('payroll').select('*');

  if (month) {
    query = query.eq('month', month);
  }

  const { data, error } = await query;
  if (error) throw error;

  const records = data || [];

  return {
    total_records: records.length,
    total_payable: records.reduce((sum, r) => sum + (r.net_salary || 0), 0),
    draft_count: records.filter((r) => r.status === 'draft').length,
    approved_count: records.filter((r) => r.status === 'approved').length,
    paid_count: records.filter((r) => r.status === 'paid').length,
  };
}

/**
 * A financial_ledger payroll-payout row as PostgREST returns it from the
 * joined select below, with the linked payroll row nested under `payroll`
 * rather than flattened.
 */
interface PayslipLedgerRow {
  id: number;
  transaction_date: string;
  receipt_path: string | null;
  payroll: {
    month: string;
    gross_salary: number;
    net_salary: number;
    basic_salary: number | null;
    hra: number | null;
    special_allowance: number | null;
    other_allowance: number | null;
    pf_deduction: number;
    esi_deduction: number;
    professional_tax_deduction: number;
    tds_deduction: number;
    other_structured_deduction: number;
  } | null;
}

export interface EmployeePayslip {
  /** financial_ledger row id — a stable React key, not what's needed to
   * fetch the file (that's receipt_path, via getPayslipUrlAction). */
  id: number;
  month: string;
  net_salary: number;
  /** When it was actually paid (financial_ledger.transaction_date) — not
   * necessarily the same month as `month` if a payroll run was paid late. */
  paid_at: string;
  receipt_path: string;
  /** Structured breakdown — undefined for rows that predate the salary
   * structure feature (no employee_salary_structure was configured at
   * generation time), in which case only month/net_salary are shown. */
  breakdown?: {
    gross_salary: number;
    basic_salary: number;
    hra: number;
    special_allowance: number;
    other_allowance: number;
    pf_deduction: number;
    esi_deduction: number;
    professional_tax_deduction: number;
    tds_deduction: number;
    other_structured_deduction: number;
    total_deductions: number;
  };
}

/**
 * An employee's own generated payslips, newest paid first.
 *
 * Reads financial_ledger rather than payroll directly: that's where
 * receipt_path (the payslip PDF) lives — see markPayrollPaid above, which
 * writes the payslip onto the ledger entry it creates, not onto the payroll
 * row itself. Scoped to rows where receipt_path is set: a payroll month can
 * be marked paid with no payslip if PDF generation failed at pay time (see
 * the non-fatal try/catch in markPayrollPaid), and there is nothing to show
 * for those — no broken "download" link for a file that was never created.
 */
export async function getEmployeePayslips(employeeId: number): Promise<EmployeePayslip[]> {
  const { data, error } = await supabase
    .from('financial_ledger')
    .select(
      'id, transaction_date, receipt_path, payroll:payroll_id(month, gross_salary, net_salary, basic_salary, hra, special_allowance, other_allowance, pf_deduction, esi_deduction, professional_tax_deduction, tds_deduction, other_structured_deduction)',
    )
    .eq('employee_id', employeeId)
    .eq('transaction_type', 'payroll')
    .not('receipt_path', 'is', null)
    .order('transaction_date', { ascending: false });

  if (error) throw error;

  // Cast, not a type-narrowing annotation: without generated Database types,
  // postgrest-js's string-parsed inference can't tell this FK is many-to-one
  // (financial_ledger.payroll_id -> payroll.id) and defaults the embed to an
  // array. Verified against a real row that PostgREST actually returns
  // `payroll` as a single object at runtime, matching every other to-one
  // embed already typed this way in this file (see PayrollJoinedRow above).
  const rows = (data || []) as unknown as PayslipLedgerRow[];

  return rows
    .filter((row) => row.payroll && row.receipt_path)
    .map((row) => {
      const p = row.payroll!;
      // basic_salary is only ever set alongside the rest of the breakdown
      // (see createPayroll) — its presence alone is enough to tell a
      // structured row apart from a legacy/flat one.
      const hasBreakdown = p.basic_salary != null;
      return {
        id: row.id,
        month: p.month,
        net_salary: p.net_salary,
        paid_at: row.transaction_date,
        receipt_path: row.receipt_path!,
        breakdown: hasBreakdown
          ? {
              gross_salary: p.gross_salary,
              basic_salary: p.basic_salary!,
              hra: p.hra || 0,
              special_allowance: p.special_allowance || 0,
              other_allowance: p.other_allowance || 0,
              pf_deduction: p.pf_deduction || 0,
              esi_deduction: p.esi_deduction || 0,
              professional_tax_deduction: p.professional_tax_deduction || 0,
              tds_deduction: p.tds_deduction || 0,
              other_structured_deduction: p.other_structured_deduction || 0,
              total_deductions:
                (p.pf_deduction || 0) +
                (p.esi_deduction || 0) +
                (p.professional_tax_deduction || 0) +
                (p.tds_deduction || 0) +
                (p.other_structured_deduction || 0),
            }
          : undefined,
      };
    });
}

/**
 * The storage path for ONE of an employee's own payslips, or null if that
 * ledger row doesn't exist, isn't theirs, or has no payslip attached.
 *
 * Ownership is enforced in the WHERE clause (employee_id = employeeId), not
 * by trusting a client-supplied path or id — the action that calls this
 * (getMyPayslipUrlAction) takes only the ledger row id from the client, so
 * there is nothing here for a tampered request to redirect at someone
 * else's file.
 */
export async function getEmployeePayslipPath(
  ledgerEntryId: number,
  employeeId: number,
): Promise<string | null> {
  const { data, error } = await supabase
    .from('financial_ledger')
    .select('receipt_path')
    .eq('id', ledgerEntryId)
    .eq('employee_id', employeeId)
    .eq('transaction_type', 'payroll')
    .maybeSingle();

  if (error) throw error;
  return data?.receipt_path ?? null;
}

export interface EmployeePayrollHistoryRow {
  payroll_id: number;
  month: string;
  status: Payroll['status'];
  /** Gross salary plus any bonus — the "Total Earnings" line on the payslip. */
  total_earnings: number;
  /** Loss of pay + statutory/other deductions + adjustment deduction. */
  total_deductions: number;
  net_salary: number;
  /** A finalized PDF exists (paid months only). */
  has_payslip: boolean;
}

/**
 * Every payroll month for one employee, newest first, for the admin
 * payslip history — including draft/approved months that have no final
 * payslip yet (those can be previewed instead). Figures come from each row's
 * own snapshot, and total_earnings - total_deductions always equals
 * net_salary, matching the PDF.
 */
export async function getEmployeePayrollHistory(employeeId: number): Promise<EmployeePayrollHistoryRow[]> {
  const { data, error } = await supabase
    .from('payroll')
    .select('*')
    .eq('employee_id', employeeId)
    .order('month', { ascending: false });
  if (error) throw error;
  const rows = (data || []) as Payroll[];

  const paidIds = rows.filter((r) => r.status === 'paid').map((r) => r.id);
  const withPdf = new Set<number>();
  if (paidIds.length > 0) {
    const { data: ledger, error: ledgerError } = await supabase
      .from('financial_ledger')
      .select('payroll_id')
      .in('payroll_id', paidIds)
      .eq('transaction_type', 'payroll')
      .not('receipt_path', 'is', null);
    if (ledgerError) throw ledgerError;
    for (const entry of ledger || []) withPdf.add(entry.payroll_id as number);
  }

  return rows.map((r) => {
    const totalEarnings = r.gross_salary + (r.bonus || 0);
    return {
      payroll_id: r.id,
      month: r.month,
      status: r.status,
      total_earnings: totalEarnings,
      total_deductions: Math.round((totalEarnings - r.net_salary) * 100) / 100,
      net_salary: r.net_salary,
      has_payslip: withPdf.has(r.id),
    };
  });
}
