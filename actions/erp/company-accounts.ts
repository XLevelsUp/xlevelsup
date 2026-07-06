'use server';

import { z } from 'zod';
import { requireAuth, requireRole } from '@/lib/auth';
import {
  getCompanyAccounts,
  getCompanyAccountById,
  getAccountBalance,
  getAccountTransactions,
  createCompanyAccount,
  updateCompanyAccount,
} from '@/lib/erp/company-accounts';
import { revalidatePath } from 'next/cache';
import type { CompanyAccount, FinancialLedgerEntry } from '@/types/erp';

const companyAccountSchema = z.object({
  name: z.string().min(1, 'Account name is required').max(255),
  description: z.string().nullable().optional(),
  account_type: z.enum(['general', 'director', 'stakeholder', 'operations', 'reserve']),
  opening_balance: z.number().min(0, 'Opening balance cannot be negative'),
});

export interface CompanyAccountActionResult {
  success: boolean;
  error?: string;
  account?: CompanyAccount;
  accounts?: CompanyAccount[];
}

/**
 * Get all company accounts
 */
export async function getCompanyAccountsAction(): Promise<CompanyAccount[]> {
  try {
    await requireAuth();
    return await getCompanyAccounts();
  } catch (error) {
    console.error('Get company accounts error:', error);
    return [];
  }
}

/**
 * Get balance stats for a company account
 */
export async function getAccountBalanceAction(accountId: number): Promise<{
  openingBalance: number;
  totalInflow: number;
  totalOutflow: number;
  currentBalance: number;
  pendingOutflow: number;
} | null> {
  try {
    await requireAuth();
    return await getAccountBalance(accountId);
  } catch (error) {
    console.error('Get account balance error:', error);
    return null;
  }
}

/**
 * Get transactions for a specific account
 */
export async function getAccountTransactionsAction(
  accountId: number,
  filters?: { month?: string; type?: string },
): Promise<FinancialLedgerEntry[]> {
  try {
    await requireAuth();
    return await getAccountTransactions(accountId, filters);
  } catch (error) {
    console.error('Get account transactions error:', error);
    return [];
  }
}

/**
 * Create a new company account (admin only)
 */
export async function createCompanyAccountAction(
  formData: FormData,
): Promise<CompanyAccountActionResult> {
  try {
    const session = await requireRole(['admin']);

    const rawData = {
      name: formData.get('name') as string,
      description: (formData.get('description') as string) || null,
      account_type: formData.get('account_type') as any,
      opening_balance: parseFloat((formData.get('opening_balance') as string) || '0'),
    };

    const validated = companyAccountSchema.parse(rawData);
    const account = await createCompanyAccount(validated, session.userId);

    revalidatePath('/erp/finances');
    return { success: true, account };
  } catch (error) {
    console.error('Create company account error:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create account',
    };
  }
}

/**
 * Update a company account (admin only)
 */
export async function updateCompanyAccountAction(
  id: number,
  formData: FormData,
): Promise<CompanyAccountActionResult> {
  try {
    await requireRole(['admin']);

    const rawData: any = {
      name: formData.get('name') as string,
      description: (formData.get('description') as string) || null,
      account_type: formData.get('account_type') as any,
      opening_balance: parseFloat((formData.get('opening_balance') as string) || '0'),
    };

    const isActive = formData.get('is_active');
    if (isActive !== null) {
      rawData.is_active = isActive === 'true';
    }

    const validated = companyAccountSchema.parse(rawData);
    const account = await updateCompanyAccount(id, { ...validated, is_active: rawData.is_active });

    revalidatePath('/erp/finances');
    return { success: true, account };
  } catch (error) {
    console.error('Update company account error:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update account',
    };
  }
}
