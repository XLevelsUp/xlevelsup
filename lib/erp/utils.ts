/**
 * Date and payroll calculation helpers for ERP system
 */

/**
 * Get total working days in a month (excluding weekends)
 * @param year - Year (e.g., 2026)
 * @param month - Month (1-12)
 * @returns Number of working days (Monday-Friday)
 */
export function getWorkingDaysInMonth(year: number, month: number): number {
  const daysInMonth = new Date(year, month, 0).getDate();
  let workingDays = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const dayOfWeek = date.getDay();
    // 0 = Sunday, 6 = Saturday
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      workingDays++;
    }
  }

  return workingDays;
}

/**
 * Format date to YYYY-MM-DD
 */
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Get current month in YYYY-MM format
 */
export function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Get month name from YYYY-MM string
 */
export function getMonthName(monthString: string): string {
  const [year, month] = monthString.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/**
 * Calculate payroll based on attendance
 */
export interface PayrollCalculation {
  total_working_days: number;
  present_days: number;
  paid_leave_days: number;
  unpaid_leave_days: number;
  absent_days: number;
  half_days: number;
  payable_days: number;
  per_day_salary: number;
  gross_salary: number;
}

export function calculatePayroll(
  monthSalary: number,
  presentDays: number,
  halfDays: number,
  paidLeaveDays: number,
  unpaidLeaveDays: number,
  absentDays: number,
  totalWorkingDays: number,
): PayrollCalculation {
  // Calculate per day salary
  const perDaySalary = monthSalary / totalWorkingDays;

  // Calculate payable days
  // Present days + paid leave + (half days * 0.5)
  // Unpaid leave and absences reduce the payable days
  const payableDays = presentDays + paidLeaveDays + halfDays * 0.5;

  // Calculate gross salary
  const grossSalary = perDaySalary * payableDays;

  return {
    total_working_days: totalWorkingDays,
    present_days: presentDays,
    paid_leave_days: paidLeaveDays,
    unpaid_leave_days: unpaidLeaveDays,
    absent_days: absentDays,
    half_days: halfDays,
    payable_days: payableDays,
    per_day_salary: perDaySalary,
    gross_salary: grossSalary,
  };
}

/**
 * Format currency (Indian Rupees)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format date for display
 */
export function formatDisplayDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Get date range for a specific month
 */
export function getMonthDateRange(monthString: string): {
  startDate: string;
  endDate: string;
} {
  const [year, month] = monthString.split('-').map(Number);
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  return {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
  };
}
