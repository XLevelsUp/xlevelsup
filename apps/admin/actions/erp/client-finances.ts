'use server';

import { z } from 'zod';
import { requireRole, requireAuth } from '@/lib/auth';
import {
  getAllClientTransactions,
  getClientTransactionById,
  createClientTransaction,
  updateClientTransaction,
  deleteClientTransaction,
  getAllClients,
} from '@/lib/erp/client-finances';
import { revalidatePath } from 'next/cache';
import type { ClientTransaction } from '@/types/finance';

const transactionSchema = z.object({
  transaction_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  type: z.enum(['income', 'expense']),
  amount: z.number().positive('Amount must be positive'),
  client_name: z.string().min(1, 'Client name is required'),
  project_name: z.string().nullable().optional(),
  category: z.string().min(1, 'Category is required'),
  subcategory: z.string().nullable().optional(),
  payment_mode: z.string().nullable().optional(),
  payment_status: z.enum(['pending', 'completed', 'advance', 'cancelled']),
  reference_number: z.string().nullable().optional(),
  receipt_url: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  advance_amount: z.number().nullable().optional(),
  pending_amount: z.number().nullable().optional(),
});

export interface ClientTransactionActionResult {
  success: boolean;
  error?: string;
  transaction?: ClientTransaction;
}

/**
 * Get all client transactions
 */
export async function getClientTransactionsAction(filters?: {
  type?: 'income' | 'expense';
  client?: string;
  category?: string;
  status?: string;
  month?: string;
}): Promise<ClientTransaction[]> {
  try {
    await requireAuth();
    return await getAllClientTransactions(filters);
  } catch (error) {
    console.error('Get client transactions error:', error);
    return [];
  }
}

/**
 * Create client transaction
 */
export async function createClientTransactionAction(
  formData: FormData,
): Promise<ClientTransactionActionResult> {
  try {
    const session = await requireAuth();

    const paymentStatus = formData.get('payment_status') as string;
    const amountStr = formData.get('amount') as string;
    const amount = parseFloat(amountStr);

    const advanceAmountStr = formData.get('advance_amount') as string;
    const advanceAmount = advanceAmountStr ? parseFloat(advanceAmountStr) : null;

    // Auto-calculate pending amount for advance payments
    let pendingAmount: number | null = null;
    if (paymentStatus === 'advance' && advanceAmount !== null && !isNaN(advanceAmount)) {
      pendingAmount = amount - advanceAmount;
    }

    const rawData = {
      transaction_date: formData.get('transaction_date') as string,
      type: formData.get('type') as 'income' | 'expense',
      amount,
      client_name: formData.get('client_name') as string,
      project_name: (formData.get('project_name') as string) || null,
      category: formData.get('category') as string,
      subcategory: (formData.get('subcategory') as string) || null,
      payment_mode: (formData.get('payment_mode') as string) || null,
      payment_status: paymentStatus as 'pending' | 'completed' | 'advance' | 'cancelled',
      reference_number: (formData.get('reference_number') as string) || null,
      receipt_url: (formData.get('receipt_url') as string) || null,
      description: (formData.get('description') as string) || null,
      notes: (formData.get('notes') as string) || null,
      advance_amount: advanceAmount,
      pending_amount: pendingAmount,
    };

    const validatedData = transactionSchema.parse(rawData);
    const transaction = await createClientTransaction(
      validatedData,
      session.userId,
    );

    revalidatePath('/erp/client-finances');
    return { success: true, transaction };
  } catch (error) {
    console.error('Create client transaction error:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: 'Failed to create transaction' };
  }
}

/**
 * Update client transaction
 */
export async function updateClientTransactionAction(
  id: number,
  formData: FormData,
): Promise<ClientTransactionActionResult> {
  try {
    await requireRole(['admin', 'hr']);

    const paymentStatus = formData.get('payment_status') as string;
    const amountStr = formData.get('amount') as string;
    const amount = parseFloat(amountStr);

    const advanceAmountStr = formData.get('advance_amount') as string;
    const advanceAmount = advanceAmountStr ? parseFloat(advanceAmountStr) : null;

    let pendingAmount: number | null = null;
    if (paymentStatus === 'advance' && advanceAmount !== null && !isNaN(advanceAmount)) {
      pendingAmount = amount - advanceAmount;
    }

    const rawData = {
      transaction_date: formData.get('transaction_date') as string,
      type: formData.get('type') as 'income' | 'expense',
      amount,
      client_name: formData.get('client_name') as string,
      project_name: (formData.get('project_name') as string) || null,
      category: formData.get('category') as string,
      subcategory: (formData.get('subcategory') as string) || null,
      payment_mode: (formData.get('payment_mode') as string) || null,
      payment_status: paymentStatus as 'pending' | 'completed' | 'advance' | 'cancelled',
      reference_number: (formData.get('reference_number') as string) || null,
      receipt_url: (formData.get('receipt_url') as string) || null,
      description: (formData.get('description') as string) || null,
      notes: (formData.get('notes') as string) || null,
      advance_amount: advanceAmount,
      pending_amount: pendingAmount,
    };

    const validatedData = transactionSchema.parse(rawData);
    const transaction = await updateClientTransaction(id, validatedData);

    revalidatePath('/erp/client-finances');
    return { success: true, transaction };
  } catch (error) {
    console.error('Update client transaction error:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: 'Failed to update transaction' };
  }
}

/**
 * Delete client transaction
 */
export async function deleteClientTransactionAction(
  id: number,
): Promise<ClientTransactionActionResult> {
  try {
    await requireRole(['admin', 'hr']);
    await deleteClientTransaction(id);
    revalidatePath('/erp/client-finances');
    return { success: true };
  } catch (error) {
    console.error('Delete client transaction error:', error);
    return { success: false, error: 'Failed to delete transaction' };
  }
}

/**
 * Get all clients
 */
export async function getAllClientsAction(): Promise<string[]> {
  try {
    await requireAuth();
    return await getAllClients();
  } catch (error) {
    console.error('Get clients error:', error);
    return [];
  }
}

/**
 * Record payment for a transaction (partial or full)
 */
export async function recordTransactionPaymentAction(
  id: number,
  newPaymentAmount: number,
): Promise<ClientTransactionActionResult> {
  try {
    await requireRole(['admin', 'hr']);

    if (isNaN(newPaymentAmount) || newPaymentAmount <= 0) {
      return { success: false, error: 'Payment amount must be positive' };
    }

    const transaction = await getClientTransactionById(id);
    if (!transaction) {
      return { success: false, error: 'Transaction not found' };
    }

    const totalAmount = Number(transaction.amount || 0);
    let updatedStatus: 'completed' | 'advance' = 'completed';
    let newAdvanceAmount: number | null = null;
    let newPendingAmount: number | null = null;

    if (transaction.payment_status === 'pending') {
      if (newPaymentAmount >= totalAmount) {
        updatedStatus = 'completed';
        newAdvanceAmount = null;
        newPendingAmount = null;
      } else {
        updatedStatus = 'advance';
        newAdvanceAmount = newPaymentAmount;
        newPendingAmount = totalAmount - newPaymentAmount;
      }
    } else if (transaction.payment_status === 'advance') {
      const currentAdvance = Number(transaction.advance_amount ?? 0);
      const totalAdvance = currentAdvance + newPaymentAmount;

      if (totalAdvance >= totalAmount) {
        updatedStatus = 'completed';
        newAdvanceAmount = null;
        newPendingAmount = null;
      } else {
        updatedStatus = 'advance';
        newAdvanceAmount = totalAdvance;
        newPendingAmount = totalAmount - totalAdvance;
      }
    } else {
      return { success: false, error: `Cannot record payment on a '${transaction.payment_status}' transaction` };
    }

    const rawData = {
      transaction_date: transaction.transaction_date,
      type: transaction.type,
      amount: totalAmount,
      client_name: transaction.client_name,
      project_name: transaction.project_name,
      category: transaction.category,
      subcategory: transaction.subcategory,
      payment_mode: transaction.payment_mode,
      payment_status: updatedStatus,
      reference_number: transaction.reference_number,
      receipt_url: transaction.receipt_url,
      description: transaction.description,
      notes: transaction.notes,
      advance_amount: newAdvanceAmount,
      pending_amount: newPendingAmount,
    };

    const updated = await updateClientTransaction(id, rawData);

    revalidatePath('/erp/client-finances');
    return { success: true, transaction: updated };
  } catch (error) {
    console.error('Record payment error:', error);
    return { success: false, error: 'Failed to record payment' };
  }
}
