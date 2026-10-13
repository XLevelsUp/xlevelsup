'use server';

/**
 * Server actions for Employee Portal Authentication
 */

import { cookies, headers } from 'next/headers';
import { z } from 'zod';
import {
  authenticateEmployee,
  changeEmployeePassword,
  createEmployeeSession,
  verifyEmployeePassword,
} from '@/lib/erp/employee-auth';
import { getEmployeeSession } from '@/lib/erp/employee-portal-auth';
import { changePasswordSchema, newPasswordSchema } from '@/lib/erp/password-policy';
import { createLoginLog } from '@/lib/erp/login-logs';
import type { EmploymentType } from '@/types/erp';

// Validation schemas
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

/**
 * Employee login action
 */
export async function employeeLoginAction(
  prevState: { success: boolean; error?: string } | null,
  formData: FormData,
): Promise<{
  success: boolean;
  error?: string;
  requirePasswordChange?: boolean;
  employmentType?: EmploymentType;
}> {
  try {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    
    // Get location data if provided
    const latitude = formData.get('latitude') ? parseFloat(formData.get('latitude') as string) : undefined;
    const longitude = formData.get('longitude') ? parseFloat(formData.get('longitude') as string) : undefined;
    const accuracy = formData.get('accuracy') ? parseFloat(formData.get('accuracy') as string) : undefined;
    
    // Get request headers for IP and user agent
    const headersList = await headers();
    const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown';
    const userAgent = headersList.get('user-agent') || 'unknown';

    // Validate input
    const validated = loginSchema.parse({ email, password });

    // Authenticate employee
    const result = await authenticateEmployee(
      validated.email,
      validated.password,
    );

    if (!result) {
      // Log failed login attempt with location
      // We need to find employee ID from email - but we can't without exposing security
      // So we'll skip logging failed attempts without employee ID
      return {
        success: false,
        error: 'Invalid email or password',
      };
    }

    // Log successful login with location
    try {
      await createLoginLog(result.employee.id, 'success', {
        latitude,
        longitude,
        accuracy,
        ipAddress,
        userAgent,
      });
    } catch (logError) {
      // Don't fail login if logging fails
      console.error('Failed to create login log:', logError);
    }

    // Create session
    const token = await createEmployeeSession(result.employee);
    const cookieStore = await cookies();
    cookieStore.set('employee_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return {
      success: true,
      requirePasswordChange: result.requirePasswordChange,
      employmentType: result.employee.employment_type,
    };
  } catch (error) {
    console.error('Employee login error:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: 'Login failed. Please try again.' };
  }
}

/**
 * Employee logout action
 */
export async function employeeLogoutAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('employee_session');
}

/**
 * Change password action — an employee changing their own portal password
 * from their profile. Who is changing it always comes from the session,
 * never from the client, and the current password must be confirmed.
 */
export async function changePasswordAction(
  prevState: { success: boolean; error?: string } | null,
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getEmployeeSession();
    if (!session) {
      return { success: false, error: 'Your session has expired. Please log in again.' };
    }
    // Signed in through the admin login (see getEmployeeSession) — that
    // password lives on the admin account, not here.
    if (session.viaAdminSession) {
      return {
        success: false,
        error: 'You are signed in with your admin account, so there is no portal password to change here.',
      };
    }

    const currentPassword = formData.get('currentPassword') as string;
    const newPassword = formData.get('newPassword') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    // Validate input — rules, match and "different from current" all live
    // in the shared schema (lib/erp/password-policy.ts).
    const validated = changePasswordSchema.parse({
      currentPassword,
      newPassword,
      confirmPassword,
    });

    if (!(await verifyEmployeePassword(session.id, validated.currentPassword))) {
      return {
        success: false,
        error: 'Current password is incorrect',
      };
    }

    // Change password
    await changeEmployeePassword(session.id, validated.newPassword);

    return { success: true };
  } catch (error) {
    console.error('Change password error:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: 'Failed to change password' };
  }
}

/**
 * Force password change action (for first login). No current password is
 * asked for, so it only works for the signed-in employee, and only while an
 * admin has required a password change (require_password_change) — never
 * for an employee ID sent from the client, which would let anyone reset
 * anyone's password. A voluntary change goes through changePasswordAction.
 */
export async function forceChangePasswordAction(
  prevState: { success: boolean; error?: string } | null,
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getEmployeeSession();
    if (!session) {
      return {
        success: false,
        error: 'Your session has expired. Please log in again.',
      };
    }
    if (!session.require_password_change) {
      return {
        success: false,
        error: 'A password change is not required. To change your password, use your profile page.',
      };
    }
    const employeeId = session.id;

    const newPassword = formData.get('newPassword') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    // Validate input
    const schema = z.object({
      newPassword: newPasswordSchema,
      confirmPassword: z.string().min(1, 'Please confirm your password'),
    });

    const validated = schema.parse({ newPassword, confirmPassword });

    // Check if passwords match
    if (validated.newPassword !== validated.confirmPassword) {
      return {
        success: false,
        error: 'Passwords do not match',
      };
    }

    // Change password
    await changeEmployeePassword(employeeId, validated.newPassword);

    console.log('Password changed successfully for employee:', employeeId);
    return { success: true };
  } catch (error) {
    console.error('Force change password error:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: 'Failed to change password' };
  }
}
