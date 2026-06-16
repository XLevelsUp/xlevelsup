/**
 * Client Finance Types
 */

export type TransactionType = 'income' | 'expense';
export type PaymentStatus = 'pending' | 'completed' | 'advance' | 'cancelled';

export interface ClientTransaction {
  id: number;
  transaction_date: string;
  type: TransactionType;
  amount: number;
  client_name: string;
  project_name?: string | null;
  category: string;
  subcategory?: string | null;
  payment_mode?: string | null;
  payment_status: PaymentStatus;
  /** @deprecated use reference_number instead */
  invoice_number?: string | null;
  reference_number?: string | null;
  receipt_url?: string | null;
  description?: string | null;
  notes?: string | null;
  advance_amount?: number | null;
  pending_amount?: number | null;
  created_by?: number | null;
  created_at: string;
  updated_at: string;
}

export interface ClientTransactionFormData {
  transaction_date: string;
  type: TransactionType;
  amount: number;
  client_name: string;
  project_name?: string | null;
  category: string;
  subcategory?: string | null;
  payment_mode?: string | null;
  payment_status: PaymentStatus;
  reference_number?: string | null;
  receipt_url?: string | null;
  description?: string | null;
  notes?: string | null;
  advance_amount?: number | null;
  pending_amount?: number | null;
}

// Predefined categories
export const INCOME_CATEGORIES = [
  'Service Fee',
  'Consulting',
  'Development',
  'Marketing Services',
  'Design Services',
  'Maintenance',
  'Subscription',
  'License Fee',
  'Other Income',
] as const;

export const EXPENSE_CATEGORIES = [
  'Client Acquisition',
  'Marketing Campaign',
  'Software/Tools',
  'Outsourcing',
  'Travel',
  'Client Entertainment',
  'Materials',
  'Subcontractor',
  'Other Expense',
] as const;

export const PAYMENT_MODES = [
  'Bank Transfer',
  'UPI',
  'Credit Card',
  'Debit Card',
  'Cash',
  'Cheque',
  'PayPal',
  'Stripe',
  'Other',
] as const;
