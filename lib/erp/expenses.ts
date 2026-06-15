/**
 * Database functions for Expense management
 */

import { supabaseServer as supabase } from '@/lib/supabase-server';
import type { Expense, ExpenseFormData } from '@/types/erp';

/**
 * Get all expenses with optional filters
 */
export async function getAllExpenses(filters?: {
  status?: string;
  category?: string;
  month?: string;
  dateFrom?: string;
  dateTo?: string;
  paidBy?: string;
}): Promise<Expense[]> {
  let query = supabase.from('expenses').select('*');

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.category) {
    query = query.eq('category', filters.category);
  }

  if (filters?.paidBy) {
    query = query.eq('paid_by', filters.paidBy);
  }

  if (filters?.month) {
    // Month filter: YYYY-MM format, get all dates in that month
    const startDate = `${filters.month}-01`;
    const nextMonth = new Date(filters.month + '-01');
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const nextMonthStr = nextMonth.toISOString().substring(0, 10);
    query = query.gte('date', startDate).lt('date', nextMonthStr);
  }

  if (filters?.dateFrom) {
    query = query.gte('date', filters.dateFrom);
  }

  if (filters?.dateTo) {
    query = query.lte('date', filters.dateTo);
  }

  query = query
    .order('date', { ascending: false })
    .order('id', { ascending: false });

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

/**
 * Get expense by ID
 */
export async function getExpenseById(id: number): Promise<Expense | undefined> {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data || undefined;
}

/**
 * Create expense
 */
export async function createExpense(
  data: ExpenseFormData,
  submittedBy: number,
): Promise<Expense> {
  const { data: result, error } = await supabase
    .from('expenses')
    .insert({
      date: data.date,
      category: data.category,
      amount: data.amount,
      paid_by: data.paid_by,
      payment_mode: data.payment_mode,
      description: data.description,
      receipt_url: data.receipt_url || null,
      status: 'pending',
      submitted_by: submittedBy,
    })
    .select()
    .single();

  if (error) throw error;
  return result;
}

/**
 * Update expense
 */
export async function updateExpense(
  id: number,
  data: ExpenseFormData,
): Promise<Expense> {
  const { data: result, error } = await supabase
    .from('expenses')
    .update({
      date: data.date,
      category: data.category,
      amount: data.amount,
      paid_by: data.paid_by,
      payment_mode: data.payment_mode,
      description: data.description,
      receipt_url: data.receipt_url || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return result;
}

/**
 * Update expense status
 */
export async function updateExpenseStatus(
  id: number,
  status: 'pending' | 'approved' | 'rejected' | 'paid',
  userId: number,
  rejectionReason?: string,
): Promise<Expense> {
  let updateData: any = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === 'approved') {
    updateData.approved_by = userId;
    updateData.approved_at = new Date().toISOString();
  } else if (status === 'rejected') {
    updateData.approved_by = userId;
    updateData.approved_at = new Date().toISOString();
    updateData.rejection_reason = rejectionReason || null;
  } else if (status === 'paid') {
    updateData.paid_by = userId;
    updateData.paid_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('expenses')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete expense
 */
export async function deleteExpense(id: number): Promise<void> {
  const { error } = await supabase.from('expenses').delete().eq('id', id);
  if (error) throw error;
}

/**
 * Get expense statistics
 */
export async function getExpenseStats(month?: string): Promise<{
  total_count: number;
  total_amount: number;
  pending_amount: number;
  approved_amount: number;
  paid_amount: number;
  pending_count: number;
}> {
  let query = supabase.from('expenses').select('*');

  if (month) {
    // Month filter: YYYY-MM format
    const nextMonth = new Date(month + '-01');
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const nextMonthStr = nextMonth.toISOString().substring(0, 10);
    query = query.gte('date', `${month}-01`).lt('date', nextMonthStr);
  }

  const { data, error } = await query;
  if (error) throw error;

  const expenses = data || [];

  return {
    total_count: expenses.length,
    total_amount: expenses.reduce((sum, e) => sum + (e.amount || 0), 0),
    pending_amount: expenses
      .filter((e) => e.status === 'pending')
      .reduce((sum, e) => sum + (e.amount || 0), 0),
    approved_amount: expenses
      .filter((e) => e.status === 'approved')
      .reduce((sum, e) => sum + (e.amount || 0), 0),
    paid_amount: expenses
      .filter((e) => e.status === 'paid')
      .reduce((sum, e) => sum + (e.amount || 0), 0),
    pending_count: expenses.filter((e) => e.status === 'pending').length,
  };
}

/**
 * Get all unique expense categories
 */
export async function getAllExpenseCategories(): Promise<string[]> {
  const { data, error } = await supabase
    .from('expenses')
    .select('category')
    .order('category', { ascending: true });

  if (error) throw error;

  // Extract unique categories
  const categories = [...new Set((data || []).map((r) => r.category))];
  return categories;
}
