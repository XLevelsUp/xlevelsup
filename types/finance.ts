/**
 * Client Finance Types
 */

export type TransactionType = 'income' | 'expense';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'cancelled';

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
  invoice_number?: string | null;
  receipt_url?: string | null;
  description: string;
  notes?: string | null;
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
  invoice_number?: string | null;
  receipt_url?: string | null;
  description: string;
  notes?: string | null;
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
