'use server';

import { z } from 'zod';
import { requireAuth, requireRole, ERP_FULL_ACCESS_ROLES } from '@/lib/auth';
import {
  getLedgerEntries,
  getLedgerEntryById,
  insertLedgerEntry,
  updateLedgerEntryById,
  deleteLedgerEntryById,
  approveLedgerEntry,
  getFinanceSummary,
  getEmployeeIdFromUserId,
} from '@/lib/erp/finance';
import { uploadReceiptFile, getReceiptSignedUrl, deleteReceiptFile } from '@/lib/erp/receipts';
import type {
  FinanceTransactionType,
  FinanceDirection,
  LedgerFormData,
} from '@/types/erp';
import { getPayslipSignedUrl } from '@/lib/erp/payslips';
import { revalidatePath } from 'next/cache';
import type { FinancialLedgerEntry } from '@/types/erp';

const ledgerEntrySchema = z.object({
  transaction_type: z.enum([
    'income',
    'expense',
    'investment',
    'payroll',
    'reimbursement',
    'adjustment',
    'refund',
    'transfer',
  ]),
  direction: z.enum(['inflow', 'outflow']),
  category: z.string().min(1, 'Category is required'),
  amount: z.number().positive('Amount must be positive'),
  transaction_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  payment_mode: z.string().nullable().optional(),
  payment_status: z.enum(['pending', 'completed', 'failed', 'cancelled', 'refunded']).nullable().optional(),
  client_name: z.string().nullable().optional(),
  project_name: z.string().nullable().optional(),
  employee_id: z.number().nullable().optional(),
  payer_name: z.string().nullable().optional(),
  payee_name: z.string().nullable().optional(),
  vendor_name: z.string().nullable().optional(),
  invoice_number: z.string().nullable().optional(),
  reference_number: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  approval_status: z.enum(['pending', 'approved', 'rejected', 'paid']).nullable().optional(),
  account_id: z.number().nullable().optional(),
  receipt_path: z.string().nullable().optional(),
});

export interface FinanceActionResult {
  success: boolean;
  error?: string;
  entry?: FinancialLedgerEntry;
}

/**
 * Get all ledger entries
 */
export async function getLedgerEntriesAction(filters?: {
  type?: string;
  direction?: string;
  category?: string;
  payment_status?: string;
  approval_status?: string;
  month?: string;
  client?: string;
  employeeId?: number;
}): Promise<FinancialLedgerEntry[]> {
  try {
    const session = await requireAuth();
    return await getLedgerEntries(session.userId, session.role, filters);
  } catch (error) {
    console.error('Get ledger entries error:', error);
    return [];
  }
}

/**
 * Get financial summary
 */
export async function getFinanceSummaryAction(filters?: {
  month?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<Awaited<ReturnType<typeof getFinanceSummary>>> {
  try {
    const session = await requireAuth();
    return await getFinanceSummary(session.userId, session.role, filters);
  } catch (error) {
    console.error('Get finance summary error:', error);
    return {
      totalIncome: 0,
      totalExpenses: 0,
      netBalance: 0,
      clientIncome: 0,
      investments: 0,
      pendingReimbursements: 0,
      payrollOutflow: 0,
      thisMonthIncome: 0,
      thisMonthExpenses: 0,
    };
  }
}

/**
 * Create a ledger entry
 */
export async function createLedgerEntryAction(
  formData: FormData,
): Promise<FinanceActionResult> {
  try {
    const session = await requireAuth();

    const rawAmount = parseFloat(formData.get('amount') as string);
    const rawEmployeeId = formData.get('employee_id')
      ? parseInt(formData.get('employee_id') as string, 10)
      : null;

    const rawData: LedgerFormData = {
      transaction_type: formData.get('transaction_type') as FinanceTransactionType,
      direction: formData.get('direction') as FinanceDirection,
      category: formData.get('category') as string,
      amount: rawAmount,
      transaction_date: formData.get('transaction_date') as string,
      payment_mode: (formData.get('payment_mode') as string) || null,
      payment_status: (formData.get('payment_status') as string) || 'completed',
      client_name: (formData.get('client_name') as string) || null,
      project_name: (formData.get('project_name') as string) || null,
      employee_id: rawEmployeeId,
      payer_name: (formData.get('payer_name') as string) || null,
      payee_name: (formData.get('payee_name') as string) || null,
      vendor_name: (formData.get('vendor_name') as string) || null,
      invoice_number: (formData.get('invoice_number') as string) || null,
      reference_number: (formData.get('reference_number') as string) || null,
      description: (formData.get('description') as string) || null,
      notes: (formData.get('notes') as string) || null,
      approval_status: (formData.get('approval_status') as string) || 'approved',
      account_id: formData.get('account_id') ? parseInt(formData.get('account_id') as string, 10) : null,
      receipt_path: null as string | null,
    };

    // Role restrictions.
    //
    // Deny-by-default: only admin, hr and employee may write to the ledger, and
    // employees are clamped to their own pending reimbursements below. Before
    // this, anything that was not literally 'employee' fell through with
    // unrestricted create rights — which handed the invoice-only accountant the
    // ability to post arbitrary company transactions.
    if (!ERP_FULL_ACCESS_ROLES.includes(session.role) && session.role !== 'employee') {
      return { success: false, error: 'Forbidden - Insufficient permissions' };
    }

    if (session.role === 'employee') {
      const employeeId = await getEmployeeIdFromUserId(session.userId);
      if (!employeeId) {
        return { success: false, error: 'Your employee profile is not linked to this user' };
      }
      // Employees can only request reimbursements (which are outflow, pending)
      rawData.transaction_type = 'reimbursement';
      rawData.direction = 'outflow';
      rawData.employee_id = employeeId;
      rawData.payment_status = 'pending';
      rawData.approval_status = 'pending';
    }

    const receiptFile = formData.get('receipt');
    if (receiptFile instanceof File && receiptFile.size > 0) {
      rawData.receipt_path = await uploadReceiptFile(receiptFile);
    }

    const validatedData = ledgerEntrySchema.parse(rawData);
    const entry = await insertLedgerEntry(validatedData, session.userId);

    revalidatePath('/erp/finances');
    return { success: true, entry };
  } catch (error) {
    console.error('Create ledger entry error:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create ledger entry' };
  }
}

/**
 * Update a ledger entry
 */
export async function updateLedgerEntryAction(
  id: number,
  formData: FormData,
): Promise<FinanceActionResult> {
  try {
    const session = await requireRole(['admin', 'hr']);

    const rawAmount = parseFloat(formData.get('amount') as string);
    const rawEmployeeId = formData.get('employee_id')
      ? parseInt(formData.get('employee_id') as string, 10)
      : null;

    const rawData: LedgerFormData = {
      transaction_type: formData.get('transaction_type') as FinanceTransactionType,
      direction: formData.get('direction') as FinanceDirection,
      category: formData.get('category') as string,
      amount: rawAmount,
      transaction_date: formData.get('transaction_date') as string,
      payment_mode: (formData.get('payment_mode') as string) || null,
      payment_status: (formData.get('payment_status') as string) || 'completed',
      client_name: (formData.get('client_name') as string) || null,
      project_name: (formData.get('project_name') as string) || null,
      employee_id: rawEmployeeId,
      payer_name: (formData.get('payer_name') as string) || null,
      payee_name: (formData.get('payee_name') as string) || null,
      vendor_name: (formData.get('vendor_name') as string) || null,
      invoice_number: (formData.get('invoice_number') as string) || null,
      reference_number: (formData.get('reference_number') as string) || null,
      description: (formData.get('description') as string) || null,
      notes: (formData.get('notes') as string) || null,
      approval_status: (formData.get('approval_status') as string) || 'approved',
      account_id: formData.get('account_id') ? parseInt(formData.get('account_id') as string, 10) : null,
    };

    const validatedData = ledgerEntrySchema.parse(rawData);
    const entry = await updateLedgerEntryById(id, validatedData, session.userId);

    revalidatePath('/erp/finances');
    return { success: true, entry };
  } catch (error) {
    console.error('Update ledger entry error:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: 'Failed to update ledger entry' };
  }
}

/**
 * Attach a receipt to a ledger entry — the "Upload" button the Finance >
 * Expenses listing shows in place of "View" when `receipt_path` is empty,
 * and also the "Replace" control in the transaction details modal for an
 * entry that already has one.
 *
 * Deliberately its own action rather than routed through
 * updateLedgerEntryAction: that action re-validates and rewrites the entire
 * entry via ledgerEntrySchema, which attaching one file has no reason to
 * trigger. Reuses uploadReceiptFile — the same validation (type, 5MB limit)
 * that create-time uploads already go through — and updateLedgerEntryById
 * for the write, so nothing new is duplicated.
 */
export async function uploadLedgerReceiptAction(
  id: number,
  formData: FormData,
): Promise<FinanceActionResult> {
  try {
    const session = await requireRole(ERP_FULL_ACCESS_ROLES);

    const file = formData.get('receipt');
    if (!(file instanceof File) || file.size === 0) {
      return { success: false, error: 'No file selected' };
    }

    // Replace case: this entry already points at a file. Upload the new one
    // and confirm the row now points at it BEFORE touching the old object —
    // if either of those two steps fails, the entry is left with the
    // original receipt still valid rather than none at all. Removing the old
    // file afterward is cleanup, not the operation's result, so a failure
    // there is logged but does not fail the user-visible replace.
    const existing = await getLedgerEntryById(id);
    const previousPath = existing?.receipt_path || null;

    const receipt_path = await uploadReceiptFile(file);
    const entry = await updateLedgerEntryById(id, { receipt_path }, session.userId);

    if (previousPath && previousPath !== receipt_path) {
      await deleteReceiptFile(previousPath).catch((err) => {
        console.error('Failed to remove replaced receipt from storage:', err);
      });
    }

    revalidatePath('/erp/finances');
    return { success: true, entry };
  } catch (error) {
    console.error('Upload ledger receipt error:', error);
    // uploadReceiptFile throws user-facing messages (wrong type, too large);
    // surface those instead of the generic fallback.
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload receipt',
    };
  }
}

/**
 * Delete a ledger entry's receipt — both the Storage object and the
 * `receipt_path` pointer. Unlike the Replace case in
 * uploadLedgerReceiptAction, there is no fallback state here: the file is
 * gone once this succeeds, so the delete must succeed before the pointer is
 * cleared, not after.
 */
export async function deleteLedgerReceiptAction(id: number): Promise<FinanceActionResult> {
  try {
    const session = await requireRole(ERP_FULL_ACCESS_ROLES);

    const existing = await getLedgerEntryById(id);
    if (!existing?.receipt_path) {
      return { success: false, error: 'This entry has no receipt to delete' };
    }

    await deleteReceiptFile(existing.receipt_path);
    const entry = await updateLedgerEntryById(id, { receipt_path: null }, session.userId);

    revalidatePath('/erp/finances');
    return { success: true, entry };
  } catch (error) {
    console.error('Delete ledger receipt error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete receipt',
    };
  }
}

/**
 * Toggle whether a ledger entry has been claimed as GST input tax credit.
 * One checkbox click on the Finance > Expenses listing = one save, scoped to
 * this single field — same reasoning as uploadLedgerReceiptAction above for
 * not going through the general update action.
 */
export async function toggleGstClaimAction(
  id: number,
  claimed: boolean,
): Promise<FinanceActionResult> {
  try {
    const session = await requireRole(ERP_FULL_ACCESS_ROLES);
    const entry = await updateLedgerEntryById(id, { gst_claim: claimed }, session.userId);
    revalidatePath('/erp/finances');
    return { success: true, entry };
  } catch (error) {
    console.error('Toggle GST claim error:', error);
    return { success: false, error: 'Failed to update GST claim status' };
  }
}

/**
 * Delete a ledger entry
 */
export async function deleteLedgerEntryAction(
  id: number,
): Promise<FinanceActionResult> {
  try {
    await requireRole(['admin']);
    await deleteLedgerEntryById(id);
    revalidatePath('/erp/finances');
    return { success: true };
  } catch (error) {
    console.error('Delete ledger entry error:', error);
    return { success: false, error: 'Failed to delete ledger entry' };
  }
}

/**
 * Approve/reject a reimbursement, expense, or invoice-generated income entry.
 * Income entries (client invoices) are admin-only — separation of duties
 * between whoever raised the invoice and whoever confirms the income.
 */
export async function approveLedgerEntryAction(
  id: number,
  status: 'pending' | 'approved' | 'rejected' | 'paid',
  comments?: string,
): Promise<FinanceActionResult> {
  try {
    const session = await requireRole(['admin', 'hr']);

    const existing = await getLedgerEntryById(id);
    if (!existing) {
      return { success: false, error: 'Ledger entry not found' };
    }
    if (existing.transaction_type === 'income' && session.role !== 'admin') {
      return { success: false, error: 'Only admins can approve invoice income entries' };
    }
    if (existing.created_by === session.userId) {
      return { success: false, error: 'You cannot approve an entry you created yourself' };
    }

    const entry = await approveLedgerEntry(id, status, session.userId, comments);

    revalidatePath('/erp/finances');
    return { success: true, entry };
  } catch (error) {
    console.error('Approve ledger entry error:', error);
    return { success: false, error: 'Failed to update entry approval status' };
  }
}

/**
 * Get a short-lived signed URL to view a ledger entry's receipt attachment.
 * The storage bucket is private, so viewing always goes through this
 * server action rather than a stored public URL.
 */
export async function getReceiptUrlAction(path: string): Promise<{ url: string | null }> {
  try {
    // Only reached from the admin finance screen. Was requireAuth(), which
    // handed a signed receipt URL to any authenticated role — including the
    // invoice-only accountant, and any role added later.
    await requireRole(ERP_FULL_ACCESS_ROLES);
    const url = await getReceiptSignedUrl(path);
    return { url };
  } catch (error) {
    console.error('Get receipt URL error:', error);
    return { url: null };
  }
}

/**
 * Same shape as getReceiptUrlAction, but for the payslips bucket — payroll
 * ledger entries store their receipt_path there instead of expense-receipts.
 */
export async function getPayslipUrlAction(path: string): Promise<{ url: string | null }> {
  try {
    // Payslips carry salary figures. Same fix as getReceiptUrlAction above:
    // this was open to every authenticated role. The employee portal does not
    // call it, so restricting it here takes nothing away from staff.
    await requireRole(ERP_FULL_ACCESS_ROLES);
    const url = await getPayslipSignedUrl(path);
    return { url };
  } catch (error) {
    console.error('Get payslip URL error:', error);
    return { url: null };
  }
}
