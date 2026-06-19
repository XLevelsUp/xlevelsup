/**
 * Extended functions for admin time tracking dashboard
 */

import { supabaseServer as supabase } from '@/lib/supabase-server';
import { getTimeLogsByDate } from './time-logs';

export interface EmployeeTimeStatus {
  employee_id: number;
  employee_code: string;
  name: string;
  department: string;
  is_clocked_in: boolean;
  clock_in_time?: string | null;
  total_hours_today: number;
  status: 'working' | 'completed' | 'not_started';
  completed_sessions: number;
}

export interface TimeTrackingStats {
  total_employees: number;
  currently_working: number;
  completed_day: number;
  not_started: number;
  total_hours_today: number;
  average_hours: number;
}

/**
 * Get all active employees with their current time log status
 */
export async function getAllEmployeesTimeStatus(): Promise<
  EmployeeTimeStatus[]
> {
  const today = new Date().toISOString().split('T')[0];

  // Get all active employees except temporary employees
  const { data: employees, error: empError } = await supabase
    .from('employees')
    .select('id, employee_id, name, department, status, employment_type')
    .eq('status', 'active')
    .neq('employment_type', 'temporary')
    .order('name', { ascending: true });

  if (empError) throw empError;

  if (!employees || employees.length === 0) return [];

  // Get all time logs for today
  const { data: timeLogs, error: logError } = await supabase
    .from('time_logs')
    .select('*')
    .eq('date', today);

  if (logError) throw logError;

  // Map employees with their time log status
  const employeeStatuses: EmployeeTimeStatus[] = employees.map((emp) => {
    const empLogs = timeLogs?.filter((log) => log.employee_id === emp.id) || [];
    const activeLog = empLogs.find((log) => log.status === 'active');
    const completedLogs = empLogs.filter((log) => log.status === 'completed');

    // Calculate total hours from completed sessions
    const completedHours = completedLogs.reduce(
      (sum, log) => sum + (log.total_hours || 0),
      0,
    );

    // Calculate current session hours if active
    let currentSessionHours = 0;
    if (activeLog) {
      try {
        const clockInTimeStr = activeLog.clock_in_time;
        let clockInTime: Date;

        if (clockInTimeStr.includes('+') || clockInTimeStr.endsWith('Z')) {
          clockInTime = new Date(clockInTimeStr);
        } else {
          clockInTime = new Date(clockInTimeStr + 'Z');
        }

        if (!isNaN(clockInTime.getTime())) {
          const now = new Date();
          const diffMs = now.getTime() - clockInTime.getTime();
          currentSessionHours = Math.max(0, diffMs / (1000 * 60 * 60));
        }
      } catch (error) {
        console.error('Error calculating hours for', emp.name, error);
      }
    }

    const totalHours = completedHours + currentSessionHours;

    // Determine status
    let status: 'working' | 'completed' | 'not_started';
    if (activeLog) {
      status = 'working';
    } else if (completedLogs.length > 0) {
      status = totalHours >= 9 ? 'completed' : 'completed';
    } else {
      status = 'not_started';
    }

    return {
      employee_id: emp.id,
      employee_code: emp.employee_id,
      name: emp.name,
      department: emp.department,
      is_clocked_in: !!activeLog,
      clock_in_time: activeLog?.clock_in_time || null,
      total_hours_today: parseFloat(totalHours.toFixed(2)),
      status,
      completed_sessions: completedLogs.length,
    };
  });

  return employeeStatuses;
}

/**
 * Get aggregated time tracking statistics
 */
export async function getTimeTrackingStats(): Promise<TimeTrackingStats> {
  const employeeStatuses = await getAllEmployeesTimeStatus();

  const currentlyWorking = employeeStatuses.filter(
    (e) => e.is_clocked_in,
  ).length;
  const completedDay = employeeStatuses.filter(
    (e) => e.total_hours_today >= 9,
  ).length;
  const notStarted = employeeStatuses.filter(
    (e) => e.status === 'not_started',
  ).length;

  const totalHours = employeeStatuses.reduce(
    (sum, e) => sum + e.total_hours_today,
    0,
  );
  const averageHours =
    employeeStatuses.length > 0 ? totalHours / employeeStatuses.length : 0;

  return {
    total_employees: employeeStatuses.length,
    currently_working: currentlyWorking,
    completed_day: completedDay,
    not_started: notStarted,
    total_hours_today: parseFloat(totalHours.toFixed(2)),
    average_hours: parseFloat(averageHours.toFixed(2)),
  };
}
