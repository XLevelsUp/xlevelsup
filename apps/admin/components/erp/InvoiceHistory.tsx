'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Table, TableRow, TableCell } from './Table';
import MonthPicker from './MonthPicker';
import InvoiceReceiptModal from './InvoiceReceiptModal';
import InvoiceEditModal from './InvoiceEditModal';
import SensitiveValue from './SensitiveValue';
import { FilterField, FIELD_CLASS, ROW_ACTION_CLASS } from './PageChrome';
import { getOrderReceiptAction, getOrderForEditAction } from '@/actions/erp/billing';
import { formatCurrency, formatDisplayDate, getCurrentMonth, getMonthName } from '@/lib/erp/utils';
import type { Order, OrderItem, ReceiptData } from '@/types/billing';

interface InvoiceHistoryProps {
  orders: Order[];
  initialMonth: string;
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: 'Cash',
  UPI: 'UPI',
  BANK_TRANSFER: 'Bank Transfer',
};

export default function InvoiceHistory({ orders, initialMonth }: InvoiceHistoryProps) {
  const router = useRouter();
  const [month, setMonth] = useState(initialMonth);
  // Remembers the last concrete month selected, so toggling "Show all" back
  // off restores it instead of landing on a blank picker.
  const [lastMonth, setLastMonth] = useState(initialMonth || getCurrentMonth());
  const [search, setSearch] = useState('');
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [loadingOrderId, setLoadingOrderId] = useState<number | null>(null);
  const [editTarget, setEditTarget] = useState<{ order: Order; items: OrderItem[] } | null>(null);
  const [editLoadingOrderId, setEditLoadingOrderId] = useState<number | null>(null);

  const applyMonth = (next: string) => {
    setMonth(next);
    if (next) setLastMonth(next);
    const params = new URLSearchParams();
    params.set('tab', 'history');
    // Always set `month` (even to ''), so an explicitly-cleared filter is
    // distinguishable server-side from the param simply being absent.
    params.set('month', next);
    router.push(`/erp/billing?${params.toString()}`);
  };

  const isAllTime = month === '';

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return orders;
    return orders.filter(
      (order) =>
        order.client_name.toLowerCase().includes(query) ||
        order.invoice_number.toLowerCase().includes(query),
    );
  }, [orders, search]);

  const totalForMonth = useMemo(
    () => filteredOrders.reduce((sum, order) => sum + Number(order.grand_total || 0), 0),
    [filteredOrders],
  );

  const handleView = async (order: Order) => {
    setLoadingOrderId(order.id);
    try {
      const result = await getOrderReceiptAction(order.id);
      if (result.success && result.receipt) {
        setReceipt(result.receipt);
      } else {
        toast.error(result.error || 'Failed to load invoice');
      }
    } finally {
      setLoadingOrderId(null);
    }
  };

  const handleEdit = async (order: Order) => {
    setEditLoadingOrderId(order.id);
    try {
      const result = await getOrderForEditAction(order.id);
      if (result.success && result.order && result.items) {
        setEditTarget({ order: result.order, items: result.items });
      } else {
        toast.error(result.error || 'Failed to load invoice');
      }
    } finally {
      setEditLoadingOrderId(null);
    }
  };

  const handleSaved = (updatedReceipt: ReceiptData) => {
    setEditTarget(null);
    setReceipt(updatedReceipt);
    router.refresh();
  };

  // Shared by the table and the cards. `asChip` gives them a tappable,
  // bordered shape for the card footer; the table keeps quiet text links.
  const renderActions = (order: Order, asChip = false) => (
    <>
      <button
        type="button"
        onClick={() => handleView(order)}
        disabled={loadingOrderId === order.id}
        className={
          asChip
            ? `${ROW_ACTION_CLASS} bg-cyan/10 text-cyan border-cyan/30 hover:bg-cyan/20`
            : 'text-xs text-cyan hover:underline font-semibold disabled:opacity-50'
        }
      >
        {loadingOrderId === order.id ? 'Loading…' : 'View / Reprint'}
      </button>
      <button
        type="button"
        onClick={() => handleEdit(order)}
        disabled={editLoadingOrderId === order.id}
        className={
          asChip
            ? `${ROW_ACTION_CLASS} border-gray-700 text-gray-300 hover:text-white hover:border-gray-500`
            : 'text-xs text-gray-400 hover:text-white hover:underline font-semibold disabled:opacity-50'
        }
      >
        {editLoadingOrderId === order.id ? 'Loading…' : 'Edit'}
      </button>
    </>
  );

  return (
    <div className="space-y-4">
      <div className="glass p-4 rounded-lg">
        <div className="grid grid-cols-1 @xl:grid-cols-2 gap-x-3 gap-y-4 items-end">
          <FilterField label="Month">
            <div className="flex gap-2">
              <div className="flex-1 min-w-0">
                <MonthPicker compact value={month} onChange={applyMonth} />
              </div>
              <button
                type="button"
                onClick={() => applyMonth(isAllTime ? lastMonth : '')}
                aria-pressed={isAllTime}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cyan)] ${
                  isAllTime
                    ? 'bg-cyan/10 border-cyan text-cyan'
                    : 'border-gray-700 text-gray-400 hover:border-gray-600'
                }`}
              >
                {isAllTime ? '✓ All time' : 'Show all'}
              </button>
            </div>
          </FilterField>
          <FilterField label="Search">
            <input
              type="search"
              placeholder="Client or invoice number…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={FIELD_CLASS}
            />
          </FilterField>
        </div>
      </div>

      <div className="glass px-4 py-3 rounded-lg flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span className="text-sm text-gray-400">
          {filteredOrders.length} invoice{filteredOrders.length !== 1 ? 's' : ''}
          {isAllTime ? ' — all time' : ` in ${getMonthName(month)}`}
        </span>
        <span className="text-sm font-semibold text-cyan tabular-nums">
          <SensitiveValue>{formatCurrency(totalForMonth)}</SensitiveValue>
        </span>
      </div>

      <div className="glass rounded-lg overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-14 px-4">
            <p className="text-gray-300 font-medium">
              {search.trim()
                ? `No invoices match “${search.trim()}”`
                : isAllTime
                  ? 'No invoices yet'
                  : `No invoices in ${getMonthName(month)}`}
            </p>
            {!isAllTime && (
              <p className="text-sm text-gray-500 mt-1">Pick another month, or show all time.</p>
            )}
          </div>
        ) : (
          <>
            {/* Wide containers: the table — six short columns, so it fits
                from a fairly narrow container. */}
            <div className="hidden @3xl:block">
              <Table compact headers={['Invoice #', 'Client', 'Date', 'Payment', 'Amount', 'Actions']}>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium text-white whitespace-nowrap tabular-nums">{order.invoice_number}</TableCell>
                    <TableCell className="min-w-40">{order.client_name}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap">
                      {formatDisplayDate(order.created_at)}
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap">
                      {PAYMENT_METHOD_LABELS[order.payment_method] || order.payment_method}
                    </TableCell>
                    <TableCell className="font-semibold whitespace-nowrap tabular-nums">
                      <SensitiveValue>{formatCurrency(order.grand_total)}</SensitiveValue>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3 whitespace-nowrap">{renderActions(order)}</div>
                    </TableCell>
                  </TableRow>
                ))}
              </Table>
            </div>

            {/* Narrow containers: one card per invoice — the invoice number
                kept on one line (it used to break into three), client and
                amount beside it, actions in reach. */}
            <ul className="@3xl:hidden">
              {filteredOrders.map((order) => (
                <li key={order.id} className="p-4 min-w-0 border-b border-gray-800/70 last:border-b-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white whitespace-nowrap tabular-nums">{order.invoice_number}</p>
                      <p className="text-sm text-gray-300 [overflow-wrap:anywhere]">{order.client_name}</p>
                    </div>
                    <p className="text-sm font-bold text-white tabular-nums shrink-0">
                      <SensitiveValue>{formatCurrency(order.grand_total)}</SensitiveValue>
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDisplayDate(order.created_at)} ·{' '}
                    {PAYMENT_METHOD_LABELS[order.payment_method] || order.payment_method}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">{renderActions(order, true)}</div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <InvoiceReceiptModal receipt={receipt} onClose={() => setReceipt(null)} closeLabel="Close" />
      <InvoiceEditModal target={editTarget} onClose={() => setEditTarget(null)} onSaved={handleSaved} />
    </div>
  );
}
