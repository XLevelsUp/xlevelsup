// ERP Type Definitions

export type UserRole = 'admin' | 'hr' | 'employee';

export type EmploymentType =
  | 'full-time'
  | 'part-time'
  | 'contract'
  | 'temporary'
  | 'freelancer'
  | 'intern'
  | 'consultant';

export type SalaryType = 'monthly' | 'hourly' | 'contract';

export interface User {
  id: number;
  email: string;
  password_hash: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Employee {
  id: number;
  employee_id: string;
  name: string;
  email: string;
  phone: string;
  role: string; // job role/designation
  department: string;
  employment_type?: EmploymentType; // Optional for backward compatibility
  joining_date: string;
  end_date?: string | null; // Optional end date for any employment type
  salary_type: SalaryType;
  monthly_salary?: number | null; // Optional for unpaid employees
  hourly_rate?: number | null; // For freelancers/hourly workers
  status: 'active' | 'inactive';
  // Employee authentication fields
  password_hash?: string | null;
  require_password_change?: boolean;
  last_login?: string | null;
  account_status?: 'active' | 'suspended' | 'locked';
  user_id?: number | null;
  created_at: string;
  updated_at: string;
}

export type AttendanceStatus =
  | 'present'
  | 'absent'
  | 'half-day'
  | 'paid-leave'
  | 'unpaid-leave'
  | 'holiday';

export interface Attendance {
  id: number;
  employee_id: number;
  date: string;
  status: AttendanceStatus;
  overtime_hours?: number | null; // Overtime hours for earned leave calculation
  notes?: string | null;
  created_by?: number | null;
  created_at: string;
  updated_at: string;
}

export interface AttendanceSummary {
  employee_id: number;
  employee_name: string;
  month: string;
  total_days: number;
  present_days: number;
  half_days: number;
  paid_leave_days: number;
  unpaid_leave_days: number;
  absent_days: number;
  holiday_days: number;
}

export type PayrollStatus = 'draft' | 'approved' | 'paid';

export interface Payroll {
  id: number;
  employee_id: number;
  month: string; // YYYY-MM
  total_working_days: number;
  present_days: number;
  paid_leave_days: number;
  unpaid_leave_days: number;
  absent_days: number;
  half_days: number;
  payable_days: number;
  per_day_salary: number;
  gross_salary: number;
  bonus: number;
  deduction: number;
  net_salary: number;
  status: PayrollStatus;
  notes?: string | null;
  generated_by?: number | null;
  generated_at: string;
  approved_by?: number | null;
  approved_at?: string | null;
  paid_by?: number | null;
  paid_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PayrollWithEmployee extends Payroll {
  employee_name: string;
  employee_role: string;
  employee_department: string;
}

export type ExpenseStatus = 'pending' | 'approved' | 'rejected' | 'paid';

export interface Expense {
  id: number;
  date: string;
  category: string;
  amount: number;
  paid_by: string;
  payment_mode: string;
  description: string;
  receipt_url?: string | null;
  status: ExpenseStatus;
  submitted_by?: number | null;
  approved_by?: number | null;
  approved_at?: string | null;
  paid_by_user?: number | null;
  paid_at?: string | null;
  rejection_reason?: string | null;
  reimbursed?: boolean | null;
  reimbursed_by?: number | null;
  reimbursed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  total_active_employees: number;
  today_attendance_count: number;
  today_attendance_percentage: number;
  current_month_payroll_total: number;
  current_month_expenses_total: number;
  pending_expenses_count: number;
  pending_expenses_total: number;
  unpaid_payroll_count: number;
  pending_leave_requests_count: number;
  pending_attendance_change_requests_count: number;
}

// Form data types for validation
export interface EmployeeFormData {
  employee_id?: string; // Optional - will be auto-generated if not provided
  name: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  employment_type: EmploymentType;
  joining_date: string;
  end_date?: string | null; // Optional end date for any employment type
  salary_type: SalaryType;
  monthly_salary?: number | null; // Optional for unpaid employees
  hourly_rate?: number | null; // Optional for hourly/freelancer
  status: 'active' | 'inactive';
}

export interface AttendanceFormData {
  employee_id: number;
  date: string;
  status: AttendanceStatus;
  overtime_hours?: number | null;
  notes?: string;
}

export interface PayrollAdjustmentData {
  bonus?: number;
  deduction?: number;
  notes?: string;
}

export interface ExpenseFormData {
  date: string;
  category: string;
  amount: number;
  paid_by: string;
  payment_mode: string;
  description: string;
  receipt_url?: string | null;
}

// Leave Management Types

export type LeaveType =
  | 'sick'
  | 'casual'
  | 'floater'
  | 'earned'
  | 'unpaid'
  | 'maternity'
  | 'paternity'
  | 'other'
  | 'wfh';

export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface LeaveRequest {
  id: number;
  employee_id: number;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  status: LeaveStatus;
  reviewed_by?: number | null;
  reviewed_at?: string | null;
  review_comments?: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeaveRequestWithEmployee extends LeaveRequest {
  employee_name: string;
  employee_id_display: string; // XLU001 or TEMP-XLU-001
  employee_department: string;
  reviewer_name?: string | null;
}

export interface LeaveBalance {
  id: number;
  employee_id: number;
  year: number;
  leave_type: string;
  total_allocated: number;
  used_days: number;
  remaining_days: number;
  created_at: string;
  updated_at: string;
}

export interface LeaveRequestFormData {
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  reason: string;
}

export interface LeaveReviewData {
  status: 'approved' | 'rejected';
  review_comments?: string;
}

// Employee Portal Session
export interface EmployeeSession {
  id: number;
  employee_id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  require_password_change: boolean;
}

// Attendance Change Requests
export type AttendanceChangeStatus = 'pending' | 'approved' | 'rejected';

export interface AttendanceChangeRequest {
  id: number;
  employee_id: number;
  attendance_id?: number | null;
  request_date: string;
  current_status?: AttendanceStatus | null;
  requested_status: AttendanceStatus;
  leave_type?: string | null;
  clock_out_time?: string | null;
  reason: string;
  status: AttendanceChangeStatus;
  reviewed_by?: number | null;
  reviewed_at?: string | null;
  review_comments?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AttendanceChangeRequestWithEmployee extends AttendanceChangeRequest {
  employee_name: string;
  employee_email: string;
  employee_employee_id: string;
}

export interface AttendanceWithChangeRequest extends Attendance {
  has_pending_request?: boolean;
  change_request_id?: number | null;
}

// Time Logs (Clock In/Out) Types
export type TimeLogStatus = 'active' | 'completed';

export interface TimeLog {
  id: number;
  employee_id: number;
  date: string;
  clock_in_time: string;
  clock_out_time?: string | null;
  total_hours?: number | null;
  status: TimeLogStatus;
  notes?: string | null;
  // Location tracking
  clock_in_latitude?: number | null;
  clock_in_longitude?: number | null;
  clock_in_location_accuracy?: number | null;
  clock_out_latitude?: number | null;
  clock_out_longitude?: number | null;
  clock_out_location_accuracy?: number | null;
  created_at: string;
  updated_at: string;
}

export interface TimeLogSummary {
  total_hours_today: number;
  is_clocked_in: boolean;
  active_session?: TimeLog | null;
  completed_sessions: TimeLog[];
  missed_clock_out?: TimeLog | null;
}

// Login Logs Types
export interface LoginLog {
  id: number;
  employee_id: number;
  login_time: string;
  latitude?: number | null;
  longitude?: number | null;
  location_accuracy?: number | null;
  ip_address?: string | null;
  user_agent?: string | null;
  status: 'success' | 'failed';
  failure_reason?: string | null;
  created_at: string;
}
