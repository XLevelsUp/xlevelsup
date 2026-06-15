/**
 * Database functions for Client Finance management
 */

import { supabaseServer as supabase } from '@/lib/supabase-server';
import type {
  ClientTransaction,
  ClientTransactionFormData,
} from '@/types/finance';
import { handleDatabaseError } from './error-handler';

/**
 * Get all client transactions with optional filters
 */
export async function getAllClientTransactions(filters?: {
  type?: 'income' | 'expense';
  client?: string;
  category?: string;
  status?: string;
  month?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<ClientTransaction[]> {
  try {
    let query = supabase.from('client_transactions').select('*');

    if (filters?.type) {
      query = query.eq('type', filters.type);
    }

    if (filters?.client) {
      query = query.eq('client_name', filters.client);
    }

    if (filters?.category) {
      query = query.eq('category', filters.category);
    }

    if (filters?.status) {
      query = query.eq('payment_status', filters.status);
    }

    if (filters?.month) {
      const startDate = `${filters.month}-01`;
      const nextMonth = new Date(filters.month + '-01');
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      const nextMonthStr = nextMonth.toISOString().substring(0, 10);
      query = query
        .gte('transaction_date', startDate)
        .lt('transaction_date', nextMonthStr);
    }

    if (filters?.dateFrom) {
      query = query.gte('transaction_date', filters.dateFrom);
    }

    if (filters?.dateTo) {
      query = query.lte('transaction_date', filters.dateTo);
    }

    query = query
      .order('transaction_date', { ascending: false })
      .order('id', { ascending: false });

    const { data, error } = await query;

    if (error) {
      throw handleDatabaseError(error, 'fetch client transactions');
    }

    return data || [];
  } catch (error) {
    throw handleDatabaseError(error, 'fetch client transactions');
  }
}

/**
 * Get transaction by ID
 */
export async function getClientTransactionById(
  id: number,
): Promise<ClientTransaction | null> {
  try {
    const { data, error } = await supabase
      .from('client_transactions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw handleDatabaseError(error, 'fetch client transaction');
    }

    return data;
  } catch (error) {
    throw handleDatabaseError(error, 'fetch client transaction');
  }
}

/**
 * Create new client transaction
 */
export async function createClientTransaction(
  data: ClientTransactionFormData,
  userId: number,
): Promise<ClientTransaction> {
  try {
    const { data: transaction, error } = await supabase
      .from('client_transactions')
      .insert({
        ...data,
        created_by: userId,
      })
      .select()
      .single();

    if (error) {
      throw handleDatabaseError(error, 'create client transaction');
    }

    return transaction;
  } catch (error) {
    throw handleDatabaseError(error, 'create client transaction');
  }
}

/**
 * Update client transaction
 */
export async function updateClientTransaction(
  id: number,
  data: ClientTransactionFormData,
): Promise<ClientTransaction> {
  try {
    const { data: transaction, error } = await supabase
      .from('client_transactions')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw handleDatabaseError(error, 'update client transaction');
    }

    return transaction;
  } catch (error) {
    throw handleDatabaseError(error, 'update client transaction');
  }
}

/**
 * Delete client transaction
 */
export async function deleteClientTransaction(id: number): Promise<void> {
  try {
    const { error } = await supabase
      .from('client_transactions')
      .delete()
      .eq('id', id);

    if (error) {
      throw handleDatabaseError(error, 'delete client transaction');
    }
  } catch (error) {
    throw handleDatabaseError(error, 'delete client transaction');
  }
}

/**
 * Get all unique clients
 */
export async function getAllClients(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('client_transactions')
      .select('client_name')
      .order('client_name');

    if (error) {
      throw handleDatabaseError(error, 'fetch clients');
    }

    const unique = [...new Set((data || []).map((r) => r.client_name))];
    return unique;
  } catch (error) {
    throw handleDatabaseError(error, 'fetch clients');
  }
}

/**
 * Get financial summary
 */
export async function getFinancialSummary(filters?: {
  month?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<{
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
  pendingIncome: number;
  pendingExpense: number;
}> {
  try {
    const transactions = await getAllClientTransactions(filters);

    const income = transactions.filter((t) => t.type === 'income');
    const expenses = transactions.filter((t) => t.type === 'expense');

    const totalIncome = income
      .filter((t) => t.payment_status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = expenses
      .filter((t) => t.payment_status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);

    const pendingIncome = income
      .filter((t) => t.payment_status === 'pending')
      .reduce((sum, t) => sum + t.amount, 0);

    const pendingExpense = expenses
      .filter((t) => t.payment_status === 'pending')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      totalIncome,
      totalExpense,
      netProfit: totalIncome - totalExpense,
      pendingIncome,
      pendingExpense,
    };
  } catch (error) {
    throw handleDatabaseError(error, 'calculate financial summary');
  }
}
