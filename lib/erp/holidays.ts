/**
 * Database functions for Company Holidays
 * Provides helpers to fetch holidays and check if a date is a holiday.
 */

import { supabaseServer as supabase } from '@/lib/supabase-server';
import { getWorkingDaysInMonth } from '@/lib/erp/utils';

export interface CompanyHoliday {
  id: number;
  date: string; // YYYY-MM-DD
  name: string;
  holiday_type: 'public' | 'floater' | 'optional' | 'company';
  description?: string;
  is_active: boolean;
}

/**
 * Get all active holidays for a given year.
 */
export async function getHolidaysForYear(
  year: number,
): Promise<CompanyHoliday[]> {
  const { data, error } = await supabase
    .from('company_holidays')
    .select('*')
    .gte('date', `${year}-01-01`)
    .lte('date', `${year}-12-31`)
    .eq('is_active', true)
    .order('date', { ascending: true });

  if (error) throw error;
  return (data as CompanyHoliday[]) || [];
}

/**
 * Get all active holidays between two dates (inclusive).
 */
export async function getHolidaysInRange(
  startDate: string,
  endDate: string,
): Promise<CompanyHoliday[]> {
  const { data, error } = await supabase
    .from('company_holidays')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate)
    .eq('is_active', true)
    .order('date', { ascending: true });

  if (error) throw error;
  return (data as CompanyHoliday[]) || [];
}

/**
 * Get the Set of active holiday date strings (YYYY-MM-DD) for a given year.
 * Useful for fast O(1) lookups in loops.
 */
export async function getHolidayDateSetForYear(
  year: number,
): Promise<Set<string>> {
  const holidays = await getHolidaysForYear(year);
  return new Set(holidays.map((h) => h.date));
}

/**
 * Get the Set of active holiday date strings (YYYY-MM-DD) between two dates.
 * Useful for fast O(1) lookups in date-range loops.
 */
export async function getHolidayDateSetInRange(
  startDate: string,
  endDate: string,
): Promise<Set<string>> {
  const holidays = await getHolidaysInRange(startDate, endDate);
  return new Set(holidays.map((h) => h.date));
}

/**
 * Get all active public (non-floater) holidays between two dates.
 * Public holidays are mandatory days off — excluded from leave & payroll working days.
 */
export async function getPublicHolidaysInRange(
  startDate: string,
  endDate: string,
): Promise<CompanyHoliday[]> {
  const { data, error } = await supabase
    .from('company_holidays')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate)
    .eq('is_active', true)
    .eq('holiday_type', 'public')
    .order('date', { ascending: true });

  if (error) throw error;
  return (data as CompanyHoliday[]) || [];
}

/**
 * Get all active floater holidays for a given year.
 * Floater holidays are tracked separately (employees may choose to take them).
 */
export async function getFloaterHolidaysForYear(
  year: number,
): Promise<CompanyHoliday[]> {
  const { data, error } = await supabase
    .from('company_holidays')
    .select('*')
    .gte('date', `${year}-01-01`)
    .lte('date', `${year}-12-31`)
    .eq('is_active', true)
    .eq('holiday_type', 'floater')
    .order('date', { ascending: true });

  if (error) throw error;
  return (data as CompanyHoliday[]) || [];
}

/**
 * Check if a specific date is a public company holiday.
 */
export async function isPublicHoliday(date: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('company_holidays')
    .select('id')
    .eq('date', date)
    .eq('is_active', true)
    .eq('holiday_type', 'public')
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return !!data;
}

/**
 * Create or update a holiday (admin use).
 */
export async function upsertHoliday(
  holiday: Omit<CompanyHoliday, 'id'>,
): Promise<CompanyHoliday> {
  const { data, error } = await supabase
    .from('company_holidays')
    .upsert(
      {
        ...holiday,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'date' },
    )
    .select()
    .single();

  if (error) throw error;
  return data as CompanyHoliday;
}

/**
 * Delete a holiday by ID.
 */
export async function deleteHoliday(id: number): Promise<void> {
  const { error } = await supabase
    .from('company_holidays')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

/**
 * Get total working days in a month, subtracting public holidays fetched from DB.
 * Use this in server actions / payroll generation instead of the plain getWorkingDaysInMonth.
 */
export async function getWorkingDaysInMonthWithHolidays(
  year: number,
  month: number,
): Promise<number> {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  const holidaySet = await getHolidayDateSetInRange(startDate, endDate);
  return getWorkingDaysInMonth(year, month, holidaySet);
}
