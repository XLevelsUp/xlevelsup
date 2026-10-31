/**
 * What a payroll run would do for each active employee in a month, worked out
 * without writing anything. generatePayrollAction saves the rows marked ready
 * and the Preview tab shows all of them, so there is only this one calculation
 * and the preview can't disagree with what payroll actually does.
 */

import { supabaseServer as supabase } from '@/lib/supabase-server';
import { getAllPayroll } from '@/lib/erp/payroll';
import { getEffectiveSalaryStructure, getDefaultSalaryTemplate } from '@/lib/erp/salary-structure';
import { getFullTimeConversionDate } from '@/lib/erp/employee-career';
import { getAllEmployees } from '@/lib/erp/employees';
import { getMonthlyAttendanceByEmployeeDate } from '@/lib/erp/attendance';
import { getHolidayDateSetInRange } from '@/lib/erp/holidays';
import { getApprovedLeaveByEmployeeDate } from '@/lib/erp/leave-requests';
import { getOffDayWork } from '@/lib/erp/earned-leave';
import {
  getWorkingDayDatesInMonth,
  calculatePayroll,
  computeNetSalary,
  getMonthDateRange,
  splitGrossByTemplate,
  type PayrollCalculation,
  type PayrollDayRecord,
} from '@/lib/erp/utils';
import type { Employee, Payroll } from '@/types/erp';

/** A payroll row ready to save, bar who generated it and when. */
export type PlannedPayroll = Omit<
  Payroll,
  'id' | 'created_at' | 'updated_at' | 'generated_by' | 'generated_at'
>;

/** Only what the screen needs: plan rows reach the browser. */
export type PayrollPlanEmployee = Pick<Employee, 'id' | 'name' | 'employee_id' | 'department'>;

/** The payroll row a month already has for this employee. */
export interface SavedPayrollSummary {
  status: Payroll['status'];
  payable_days: number;
  total_working_days: number;
  gross_salary: number;
  lop_deduction: number;
  net_salary: number;
}

export type PayrollPlanRow = { employee: PayrollPlanEmployee } & (
  | { outcome: 'ready'; calculation: PayrollCalculation; payroll: PlannedPayroll }
  /** Attendance gaps. Any of these refuses a run that includes them. */
  | { outcome: 'blocked'; calculation: PayrollCalculation; offDayDates: string[] }
  | { outcome: 'generated'; saved: SavedPayrollSummary }
  | { outcome: 'skipped'; reason: string }
);

/**
 * Work out one outcome per active employee — or only the given employees,
 * when any are given. Writes nothing.
 */
export async function buildPayrollPlan(
  month: string,
  employeeIds?: Set<number>,
): Promise<{ rows: PayrollPlanRow[]; workingDayCount: number }> {
  const employees = (await getAllEmployees({ status: 'active' })).filter(
    (e) => !employeeIds?.size || employeeIds.has(e.id),
  );

  const [year, monthNum] = month.split('-').map(Number);

  // Public holidays are not working days: counting them would understate
  // per-day salary and dock anyone who correctly did not work that day.
  const { startDate, endDate } = getMonthDateRange(month);
  const holidaySet = await getHolidayDateSetInRange(startDate, endDate);
  const workingDayDates = getWorkingDayDatesInMonth(year, monthNum, holidaySet);

  // One query each for the whole run, rather than one per employee.
  const [attendanceByEmployee, leaveByEmployee, defaultTemplate, offDayWork, existingPayroll] =
    await Promise.all([
      getMonthlyAttendanceByEmployeeDate(month),
      getApprovedLeaveByEmployeeDate(workingDayDates),
      getDefaultSalaryTemplate(),
      getOffDayWork(startDate, endDate),
      getAllPayroll({ month }),
    ]);
  const existingByEmployee = new Map(existingPayroll.map((p) => [p.employee_id, p]));

  // Weekend/holiday work that was never clocked out or has no hours logged.
  // It isn't paid, but it can't be priced for earned leave either, so it
  // has to be fixed before the month's payroll runs.
  const unrecordedOffDays = new Map<number, string[]>();
  for (const work of offDayWork) {
    if (work.recorded) continue;
    unrecordedOffDays.set(work.employee_id, [
      ...(unrecordedOffDays.get(work.employee_id) || []),
      work.date,
    ]);
  }

  const planEmployee = async (employee: Employee): Promise<PayrollPlanRow> => {
    const summary: PayrollPlanEmployee = {
      id: employee.id,
      name: employee.name,
      employee_id: employee.employee_id,
      department: employee.department,
    };

    // Interns and freelancers never get a payslip through this system —
    // interns are on a stipend (not a salary), and freelancers are paid
    // through the hourly flow. This holds even if one of them happens to
    // have a monthly_salary value set.
    if (employee.employment_type === 'intern') {
      return { employee: summary, outcome: 'skipped', reason: 'Intern — on a stipend' };
    }
    if (employee.employment_type === 'freelancer') {
      return { employee: summary, outcome: 'skipped', reason: 'Freelancer — paid hourly' };
    }

    // Check if payroll already exists
    const existing = existingByEmployee.get(employee.id);
    if (existing) {
      return {
        employee: summary,
        outcome: 'generated',
        saved: {
          status: existing.status,
          payable_days: existing.payable_days,
          total_working_days: existing.total_working_days,
          gross_salary: existing.gross_salary,
          lop_deduction: computeNetSalary(existing).lop_deduction,
          net_salary: existing.net_salary,
        },
      };
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
      return { employee: summary, outcome: 'skipped', reason: 'No salary set' };
    }

    // Attendance and approved leave side by side, per date — which one a
    // day counts as is decided in calculatePayroll (resolvePayrollDay).
    const employeeAttendance = attendanceByEmployee.get(employee.id);
    const employeeLeave = leaveByEmployee.get(employee.id);
    const daysByDate = new Map<string, PayrollDayRecord>();
    for (const date of workingDayDates) {
      const attendance = employeeAttendance?.get(date);
      const leave = employeeLeave?.get(date);
      if (attendance || leave) daysByDate.set(date, { attendance, leave });
    }

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
    const calculation = calculatePayroll(effectiveGrossSalary, workingDayDates, daysByDate, {
      from: salariedFrom,
      to: employee.end_date,
    });

    // Not employed for a single working day of this month — someone hired
    // after it, or who left before it. No payslip is owed, and generating a
    // zero row would just be noise on the screen.
    if (calculation.not_employed_days === calculation.total_working_days) {
      return { employee: summary, outcome: 'skipped', reason: 'Not employed this month' };
    }

    const offDayDates = (unrecordedOffDays.get(employee.id) || []).sort();
    if (calculation.unrecorded_dates.length > 0 || offDayDates.length > 0) {
      return { employee: summary, outcome: 'blocked', calculation, offDayDates };
    }

    return {
      employee: summary,
      outcome: 'ready',
      calculation,
      payroll: {
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
      },
    };
  };

  return {
    rows: await Promise.all(employees.map(planEmployee)),
    workingDayCount: workingDayDates.length,
  };
}

export type PayrollPreviewRow = PayrollPlanRow & {
  /** Unreviewed leave touching this month. WFH doesn't change pay, so it isn't counted. */
  pendingLeave: number;
  /** Unreviewed attendance change / regularisation requests in this month. */
  pendingAttendance: number;
};

export interface PayrollPreviewData {
  rows: PayrollPreviewRow[];
  workingDayCount: number;
}

/**
 * The plan for every active employee plus their unreviewed requests for the
 * month. Those matter here because approving one is refused once the month
 * has a payroll row (see assertPayrollNotGenerated) — Generate doesn't check
 * for them, so this is the last place to catch them.
 */
export async function getPayrollPreview(month: string): Promise<PayrollPreviewData> {
  const { startDate, endDate } = getMonthDateRange(month);

  const [plan, leaveResult, attendanceResult] = await Promise.all([
    buildPayrollPlan(month),
    supabase
      .from('leave_requests')
      .select('employee_id')
      .eq('status', 'pending')
      .neq('leave_type', 'wfh')
      .lte('start_date', endDate)
      .gte('end_date', startDate),
    supabase
      .from('attendance_change_requests')
      .select('employee_id')
      .eq('status', 'pending')
      .gte('request_date', startDate)
      .lte('request_date', endDate),
  ]);
  if (leaveResult.error) throw leaveResult.error;
  if (attendanceResult.error) throw attendanceResult.error;

  const countByEmployee = (requests: { employee_id: number }[]) => {
    const counts = new Map<number, number>();
    for (const { employee_id } of requests) {
      counts.set(employee_id, (counts.get(employee_id) || 0) + 1);
    }
    return counts;
  };
  const pendingLeave = countByEmployee(leaveResult.data);
  const pendingAttendance = countByEmployee(attendanceResult.data);

  return {
    workingDayCount: plan.workingDayCount,
    rows: plan.rows.map((row) => ({
      ...row,
      pendingLeave: pendingLeave.get(row.employee.id) || 0,
      pendingAttendance: pendingAttendance.get(row.employee.id) || 0,
    })),
  };
}
