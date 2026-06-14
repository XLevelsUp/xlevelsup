/**
 * Employee Portal Authentication
 */

import { supabaseServer as supabase } from '@/lib/supabase-server';
import type { Employee, EmployeeSession } from '@/types/erp';
import bcrypt from 'bcryptjs';
import * as jose from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-this',
);

/**
 * Authenticate employee with email and password
 */
export async function authenticateEmployee(
  email: string,
  password: string,
): Promise<{ employee: Employee; requirePasswordChange: boolean } | null> {
  // Get employee by email
  const { data: employee, error } = await supabase
    .from('employees')
    .select('*')
    .eq('email', email)
    .eq('status', 'active')
    .single();

  if (error || !employee) {
    return null;
  }

  // Check if account is suspended or locked
  if (
    employee.account_status === 'suspended' ||
    employee.account_status === 'locked'
  ) {
    return null;
  }

  // Verify password
  if (!employee.password_hash) {
    return null;
  }

  const isValid = await bcrypt.compare(password, employee.password_hash);
  if (!isValid) {
    return null;
  }

  // Update last login
  await supabase
    .from('employees')
    .update({ last_login: new Date().toISOString() })
    .eq('id', employee.id);

  return {
    employee,
    requirePasswordChange: employee.require_password_change || false,
  };
}

/**
 * Change employee password
 */
export async function changeEmployeePassword(
  employeeId: number,
  newPassword: string,
): Promise<void> {
  const passwordHash = await bcrypt.hash(newPassword, 10);

  const { error } = await supabase
    .from('employees')
    .update({
      password_hash: passwordHash,
      require_password_change: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', employeeId);

  if (error) throw error;
}

/**
 * Create employee session token (JWT)
 */
export async function createEmployeeSession(
  employee: Employee,
): Promise<string> {
  const session: EmployeeSession = {
    id: employee.id,
    employee_id: employee.employee_id,
    name: employee.name,
    email: employee.email,
    role: employee.role,
    department: employee.department,
    require_password_change: employee.require_password_change || false,
  };

  const token = await new jose.SignJWT({ ...session, type: 'employee' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(JWT_SECRET);

  return token;
}

/**
 * Verify employee session token
 */
export async function verifyEmployeeSession(
  token: string,
): Promise<EmployeeSession | null> {
  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET);

    if (payload.type !== 'employee') {
      return null;
    }

    return payload as unknown as EmployeeSession;
  } catch {
    return null;
  }
}

/**
 * Get employee by email
 */
export async function getEmployeeByEmail(
  email: string,
): Promise<Employee | null> {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('email', email)
    .single();

  if (error) return null;
  return data;
}
