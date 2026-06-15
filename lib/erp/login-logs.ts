/**
 * Login Logs Management
 * Track employee login attempts with location and device info
 */

import { supabaseServer as supabase } from '@/lib/supabase-server';
import type { LoginLog } from '@/types/erp';
import { handleDatabaseError } from './error-handler';

/**
 * Create a login log entry
 */
export async function createLoginLog(
  employeeId: number,
  status: 'success' | 'failed',
  options?: {
    latitude?: number;
    longitude?: number;
    accuracy?: number;
    ipAddress?: string;
    userAgent?: string;
    failureReason?: string;
  },
): Promise<LoginLog> {
  try {
    const { data, error } = await supabase
      .from('login_logs')
      .insert({
        employee_id: employeeId,
        login_time: new Date().toISOString(),
        latitude: options?.latitude || null,
        longitude: options?.longitude || null,
        location_accuracy: options?.accuracy || null,
        ip_address: options?.ipAddress || null,
        user_agent: options?.userAgent || null,
        status,
        failure_reason: options?.failureReason || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create login log:', error.message);
      // Don't throw - login logs are supplementary, shouldn't block login
      throw handleDatabaseError(error, 'create login log');
    }

    return data!;
  } catch (error) {
    console.error('Unexpected error creating login log:', error);
    // Don't throw - login logs are supplementary
    throw handleDatabaseError(error, 'create login log');
  }
}

/**
 * Get login logs for an employee
 */
export async function getEmployeeLoginLogs(
  employeeId: number,
  limit: number = 50,
): Promise<LoginLog[]> {
  try {
    const { data, error } = await supabase
      .from('login_logs')
      .select('*')
      .eq('employee_id', employeeId)
      .order('login_time', { ascending: false })
      .limit(limit);

    if (error) {
      throw handleDatabaseError(error, 'fetch login logs');
    }
    return data || [];
  } catch (error) {
    throw handleDatabaseError(error, 'fetch login logs');
  }
}

/**
 * Get all login logs with filters
 */
export async function getAllLoginLogs(filters?: {
  employeeId?: number;
  status?: 'success' | 'failed';
  startDate?: string;
  endDate?: string;
  limit?: number;
}): Promise<LoginLog[]> {
  try {
    let query = supabase.from('login_logs').select('*');

    if (filters?.employeeId) {
      query = query.eq('employee_id', filters.employeeId);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.startDate) {
      query = query.gte('login_time', filters.startDate);
    }

    if (filters?.endDate) {
      query = query.lte('login_time', filters.endDate);
    }

    query = query.order('login_time', { ascending: false });

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) {
      throw handleDatabaseError(error, 'fetch login logs');
    }
    return data || [];
  } catch (error) {
    throw handleDatabaseError(error, 'fetch login logs');
  }
}

/**
 * Get recent failed login attempts for an employee
 */
export async function getRecentFailedLogins(
  employeeId: number,
  hours: number = 24,
): Promise<number> {
  const since = new Date();
  since.setHours(since.getHours() - hours);

  const { data, error } = await supabase
    .from('login_logs')
    .select('id', { count: 'exact', head: true })
    .eq('employee_id', employeeId)
    .eq('status', 'failed')
    .gte('login_time', since.toISOString());

  if (error) {
    console.error('Failed to get failed login count:', error);
    return 0;
  }

  return data?.length || 0;
}
