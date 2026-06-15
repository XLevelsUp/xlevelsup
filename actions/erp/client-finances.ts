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
  payment_status: z.enum(['pending', 'completed', 'failed', 'cancelled']),
  invoice_number: z.string().nullable().optional(),
  receipt_url: z.string().nullable().optional(),
  description: z.string().min(1, 'Description is required'),
  notes: z.string().nullable().optional(),
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

    const rawData = {
      transaction_date: formData.get('transaction_date') as string,
      type: formData.get('type') as 'income' | 'expense',
      amount: parseFloat(formData.get('amount') as string),
      client_name: formData.get('client_name') as string,
      project_name: (formData.get('project_name') as string) || null,
      category: formData.get('category') as string,
      subcategory: (formData.get('subcategory') as string) || null,
      payment_mode: (formData.get('payment_mode') as string) || null,
      payment_status: formData.get('payment_status') as
        | 'pending'
        | 'completed'
        | 'failed'
        | 'cancelled',
      invoice_number: (formData.get('invoice_number') as string) || null,
      receipt_url: (formData.get('receipt_url') as string) || null,
      description: formData.get('description') as string,
      notes: (formData.get('notes') as string) || null,
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

    const rawData = {
      transaction_date: formData.get('transaction_date') as string,
      type: formData.get('type') as 'income' | 'expense',
      amount: parseFloat(formData.get('amount') as string),
      client_name: formData.get('client_name') as string,
      project_name: (formData.get('project_name') as string) || null,
      category: formData.get('category') as string,
      subcategory: (formData.get('subcategory') as string) || null,
      payment_mode: (formData.get('payment_mode') as string) || null,
      payment_status: formData.get('payment_status') as
        | 'pending'
        | 'completed'
        | 'failed'
        | 'cancelled',
      invoice_number: (formData.get('invoice_number') as string) || null,
      receipt_url: (formData.get('receipt_url') as string) || null,
      description: formData.get('description') as string,
      notes: (formData.get('notes') as string) || null,
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
