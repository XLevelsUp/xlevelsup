/**
 * Database functions for Employee management
 */

import { supabaseServer as supabase } from '@/lib/supabase-server';
import type { Employee, EmployeeFormData } from '@/types/erp';
import bcrypt from 'bcryptjs';
import { handleDatabaseError, isNotFoundError } from './error-handler';

/**
 * Generate a default password for new employees
 * Format: Welcome@[EmployeeID] (e.g., Welcome@XLU001 or Welcome@TEMP-XLU-001)
 */
function generateDefaultPassword(employeeId: string): string {
  return `Welcome@${employeeId}`;
}

/**
 * Generate next employee ID
 * - Temporary employees: TEMP-XLU-001, TEMP-XLU-002, etc.
 * - Regular employees: XLU001, XLU002, etc.
 */
async function generateEmployeeId(employmentType?: string): Promise<string> {
  try {
    const isTemporary = employmentType === 'temporary';
    const prefix = isTemporary ? 'TEMP-XLU-' : 'XLU';
    const pattern = isTemporary ? /TEMP-XLU-(\d+)/ : /XLU(\d+)/;

    // Get the latest employee with matching pattern
    const { data, error } = await supabase
      .from('employees')
      .select('employee_id')
      .like('employee_id', `${prefix}%`)
      .order('employee_id', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error generating employee ID:', error.message);
      console.error('Error generating employee ID:', error.message);
      throw handleDatabaseError(error, 'generate employee ID');
    }

    if (!data || data.length === 0) {
      return `${prefix}${isTemporary ? '' : ''}001`; // First employee of this type
    }

    // Extract number from last employee_id
    const lastId = data[0].employee_id;
    const match = lastId.match(pattern);

    if (match) {
      const lastNumber = parseInt(match[1], 10);
      const nextNumber = lastNumber + 1;
      return `${prefix}${nextNumber.toString().padStart(3, '0')}`;
    }

    // Fallback if format doesn't match
    return `${prefix}${isTemporary ? '' : ''}001`;
  } catch (error) {
    throw handleDatabaseError(error, 'generate employee ID');
  }
}

/**
 * Get all employees with optional filters
 */
export async function getAllEmployees(filters?: {
  status?: 'active' | 'inactive';
  department?: string;
  employment_type?: string;
  search?: string;
}): Promise<Employee[]> {
  try {
    let query = supabase.from('employees').select('*');

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.department) {
      query = query.eq('department', filters.department);
    }

    if (filters?.employment_type) {
      query = query.eq('employment_type', filters.employment_type);
    }

    if (filters?.search) {
      query = query.or(
        `name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,employee_id.ilike.%${filters.search}%`,
      );
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      throw handleDatabaseError(error, 'fetch employees');
    }
    return data || [];
  } catch (error) {
    throw handleDatabaseError(error, 'fetch employees');
  }
}

/**
 * Get employee by ID
 */
export async function getEmployeeById(id: number): Promise<Employee | null> {
  try {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (isNotFoundError(error)) {
        return null;
      }
      throw handleDatabaseError(error, 'fetch employee');
    }
    return data;
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      return null;
    }
    throw handleDatabaseError(error, 'fetch employee');
  }
}

/**
 * Get employee by employee_id
 */
export async function getEmployeeByEmployeeId(
  employeeId: string,
): Promise<Employee | null> {
  try {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('employee_id', employeeId)
      .single();

    if (error) {
      if (isNotFoundError(error)) {
        return null;
      }
      throw handleDatabaseError(error, 'fetch employee');
    }
    return data;
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      return null;
    }
    throw handleDatabaseError(error, 'fetch employee');
  }
}

/**
 * Create new employee
 */
export async function createEmployee(
  data: EmployeeFormData,
): Promise<Employee> {
  try {
    // Auto-generate employee_id if not provided
    const employeeId =
      data.employee_id || (await generateEmployeeId(data.employment_type));

    // Generate default password and hash it
    const defaultPassword = generateDefaultPassword(employeeId);
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    const { data: employee, error } = await supabase
      .from('employees')
      .insert({
        employee_id: employeeId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role,
        department: data.department,
        employment_type: data.employment_type,
        joining_date: data.joining_date,
        end_date: data.end_date || null,
        salary_type: data.salary_type,
        monthly_salary: data.monthly_salary,
        hourly_rate: data.hourly_rate || null,
        status: data.status,
        password_hash: passwordHash,
        require_password_change: true,
        account_status: 'active',
      })
      .select()
      .single();

    if (error) {
      throw handleDatabaseError(error, 'create employee');
    }

    // Initialize leave balance for new employee based on joining date and department
    if (employee.joining_date) {
      try {
        const { initializeLeaveBalance } = await import('./leave-requests');
        await initializeLeaveBalance(
          employee.id,
          employee.joining_date,
          employee.department,
        );
      } catch (leaveError) {
        console.error('Failed to initialize leave balance:', leaveError);
        // Don't throw - employee was created successfully
      }
    }

    return employee;
  } catch (error) {
    throw handleDatabaseError(error, 'create employee');
  }
}

/**
 * Update employee
 */
export async function updateEmployee(
  id: number,
  data: EmployeeFormData,
): Promise<Employee> {
  try {
    const { data: employee, error } = await supabase
      .from('employees')
      .update({
        employee_id: data.employee_id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role,
        department: data.department,
        employment_type: data.employment_type,
        joining_date: data.joining_date,
        end_date: data.end_date || null,
        salary_type: data.salary_type,
        monthly_salary: data.monthly_salary,
        hourly_rate: data.hourly_rate || null,
        status: data.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw handleDatabaseError(error, 'update employee');
    }
    return employee;
  } catch (error) {
    throw handleDatabaseError(error, 'update employee');
  }
}

/**
 * Delete employee
 */
export async function deleteEmployee(id: number): Promise<void> {
  try {
    const { error } = await supabase.from('employees').delete().eq('id', id);

    if (error) {
      throw handleDatabaseError(error, 'delete employee');
    }
  } catch (error) {
    throw handleDatabaseError(error, 'delete employee');
  }
}

/**
 * Get all unique departments
 */
export async function getAllDepartments(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('employees')
      .select('department')
      .order('department');

    if (error) {
      throw handleDatabaseError(error, 'fetch departments');
    }

    // Get unique departments
    const unique = [...new Set((data || []).map((r) => r.department))];
    return unique;
  } catch (error) {
    throw handleDatabaseError(error, 'fetch departments');
  }
}

/**
 * Get employee count by status
 */
export async function getEmployeeCountByStatus(): Promise<{
  active: number;
  inactive: number;
}> {
  const { data: activeData, error: activeError } = await supabase
    .from('employees')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'active');

  const { data: inactiveData, error: inactiveError } = await supabase
    .from('employees')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'inactive');

  if (activeError) throw activeError;
  if (inactiveError) throw inactiveError;

  return {
    active: activeData?.length || 0,
    inactive: inactiveData?.length || 0,
  };
}
