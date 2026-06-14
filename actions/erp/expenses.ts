'use server';

import { z } from 'zod';
import { requireRole, requireAuth } from '@/lib/auth';
import {
  getAllExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  updateExpenseStatus,
  deleteExpense,
} from '@/lib/erp/expenses';
import { revalidatePath } from 'next/cache';
import type { Expense } from '@/types/erp';

const expenseSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  category: z.string().min(1, 'Category is required'),
  amount: z.number().positive('Amount must be positive'),
  paid_by: z.string().min(1, 'Paid by is required'),
  payment_mode: z.string().min(1, 'Payment mode is required'),
  description: z.string().min(1, 'Description is required'),
  receipt_url: z.string().optional(),
});

export interface ExpenseActionResult {
  success: boolean;
  error?: string;
  expense?: Expense;
}

/**
 * Get all expenses
 */
export async function getExpensesAction(filters?: {
  status?: string;
  category?: string;
  month?: string;
}): Promise<Expense[]> {
  try {
    await requireAuth();
    return await getAllExpenses(filters);
  } catch (error) {
    console.error('Get expenses error:', error);
    return [];
  }
}

/**
 * Create expense
 */
export async function createExpenseAction(
  formData: FormData,
): Promise<ExpenseActionResult> {
  try {
    const session = await requireAuth();

    const rawData = {
      date: formData.get('date') as string,
      category: formData.get('category') as string,
      amount: parseFloat(formData.get('amount') as string),
      paid_by: formData.get('paid_by') as string,
      payment_mode: formData.get('payment_mode') as string,
      description: formData.get('description') as string,
      receipt_url: formData.get('receipt_url') as string,
    };

    const validatedData = expenseSchema.parse(rawData);
    const expense = await createExpense(validatedData, session.userId);

    revalidatePath('/erp/expenses');
    return { success: true, expense };
  } catch (error) {
    console.error('Create expense error:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: 'Failed to create expense' };
  }
}

/**
 * Update expense
 */
export async function updateExpenseAction(
  id: number,
  formData: FormData,
): Promise<ExpenseActionResult> {
  try {
    await requireRole(['admin', 'hr']);

    const rawData = {
      date: formData.get('date') as string,
      category: formData.get('category') as string,
      amount: parseFloat(formData.get('amount') as string),
      paid_by: formData.get('paid_by') as string,
      payment_mode: formData.get('payment_mode') as string,
      description: formData.get('description') as string,
      receipt_url: formData.get('receipt_url') as string,
    };

    const validatedData = expenseSchema.parse(rawData);
    const expense = await updateExpense(id, validatedData);

    revalidatePath('/erp/expenses');
    return { success: true, expense };
  } catch (error) {
    console.error('Update expense error:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: 'Failed to update expense' };
  }
}

/**
 * Update expense status
 */
export async function updateExpenseStatusAction(
  id: number,
  status: 'pending' | 'approved' | 'rejected' | 'paid',
  rejectionReason?: string,
): Promise<ExpenseActionResult> {
  try {
    const session = await requireRole(['admin', 'hr']);
    const expense = await updateExpenseStatus(
      id,
      status,
      session.userId,
      rejectionReason,
    );

    revalidatePath('/erp/expenses');
    return { success: true, expense };
  } catch (error) {
    console.error('Update expense status error:', error);
    return { success: false, error: 'Failed to update expense status' };
  }
}

/**
 * Delete expense
 */
export async function deleteExpenseAction(
  id: number,
): Promise<ExpenseActionResult> {
  try {
    await requireRole(['admin', 'hr']);
    await deleteExpense(id);
    revalidatePath('/erp/expenses');
    return { success: true };
  } catch (error) {
    console.error('Delete expense error:', error);
    return { success: false, error: 'Failed to delete expense' };
  }
}
