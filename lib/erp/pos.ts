/**
 * Database helper functions for service billing & tax invoices (Supabase)
 */

import { supabaseServer as supabase } from '@/lib/supabase-server';
import { handleDatabaseError } from './error-handler';
import type { Order, OrderItem, PaymentMethod } from '@/types/pos';

export { GST_RATE, computeGstBreakdown } from '@/lib/pos-tax';

export async function createOrder(order: {
  client_name: string;
  payment_method: PaymentMethod;
  taxable_value: number;
  cgst_amount: number;
  sgst_amount: number;
  grand_total: number;
  notes: string | null;
  created_by: number;
}): Promise<Order> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .insert({
        ...order,
        status: 'delivered',
        payment_status: 'completed',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    throw handleDatabaseError(error, 'create order');
  }
}

export async function createOrderItems(
  orderId: number,
  items: Array<{ description: string; quantity: number; rate: number }>,
): Promise<OrderItem[]> {
  const { data, error } = await supabase
    .from('order_items')
    .insert(items.map((item) => ({ ...item, order_id: orderId })))
    .select();

  if (error) throw error;
  return data || [];
}

/**
 * Rollback helper: remove an order created earlier in the same checkout
 * if a later step (line items) fails.
 */
export async function deleteOrder(orderId: number): Promise<void> {
  const { error } = await supabase.from('orders').delete().eq('id', orderId);
  if (error) {
    console.error(`Rollback failed to delete order ${orderId}:`, error);
  }
}

/**
 * Link an invoice back to the client_transactions row that was
 * auto-created for it, once that finance-ledger sync succeeds.
 */
export async function linkOrderTransaction(
  orderId: number,
  transactionId: number,
): Promise<void> {
  const { error } = await supabase
    .from('orders')
    .update({ linked_transaction_id: transactionId })
    .eq('id', orderId);

  if (error) throw error;
}
