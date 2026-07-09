'use client';

import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { processServiceInvoice } from '@/actions/erp/pos';
import { computeGstBreakdown, round2Amount, CGST_RATE_LABEL, SGST_RATE_LABEL } from '@/lib/pos-tax';
import { formatCurrency } from '@/lib/erp/utils';
import PosReceipt from './PosReceipt';
import type { InvoiceLineItem, PaymentMethod, ReceiptData } from '@/types/pos';

interface PosTerminalProps {
  knownClients: string[];
}

const PAYMENT_METHODS: PaymentMethod[] = ['CASH', 'UPI', 'CARD'];
const PRINT_MOUNT_DELAY_MS = 300;
const EMPTY_LINE: InvoiceLineItem = { description: '', quantity: 1, rate: 0 };

export default function PosTerminal({ knownClients }: PosTerminalProps) {
  const [clientName, setClientName] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<InvoiceLineItem[]>([{ ...EMPTY_LINE }]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);

  // Trigger the print takeover shortly after the receipt mounts off-screen.
  useEffect(() => {
    if (!receipt) return;
    const timer = setTimeout(() => window.print(), PRINT_MOUNT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [receipt]);

  // Reset the invoice once the browser print dialog has closed.
  useEffect(() => {
    const handleAfterPrint = () => {
      setReceipt(null);
      setClientName('');
      setNotes('');
      setItems([{ ...EMPTY_LINE }]);
    };
    window.addEventListener('afterprint', handleAfterPrint);
    return () => window.removeEventListener('afterprint', handleAfterPrint);
  }, []);

  const lineTotals = useMemo(
    () => items.map((item) => round2Amount(item.quantity * item.rate)),
    [items],
  );

  const grandTotal = round2Amount(lineTotals.reduce((sum, total) => sum + total, 0));
  const taxPreview = computeGstBreakdown(grandTotal);

  const validItems = items.filter((item) => item.description.trim().length > 0);
  const canSubmit = clientName.trim().length > 0 && validItems.length > 0 && !isSubmitting;

  const updateItem = (index: number, patch: Partial<InvoiceLineItem>) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const addLine = () => setItems((prev) => [...prev, { ...EMPTY_LINE }]);

  const removeLine = (index: number) => {
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));
  };

  const handleConfirmInvoice = async () => {
    if (!canSubmit) return;

    setIsSubmitting(true);
    try {
      const result = await processServiceInvoice({
        clientName: clientName.trim(),
        paymentMethod,
        items: validItems.map((item) => ({
          description: item.description.trim(),
          quantity: item.quantity,
          rate: item.rate,
        })),
        notes: notes.trim() || null,
      });

      if (result.success && result.receipt) {
        toast.success(`Invoice created — ${result.invoiceNumber}`);
        if (result.financeSyncFailed) {
          toast.error(
            `Invoice ${result.invoiceNumber} saved, but Finances sync failed — add it manually.`,
          );
        }
        setReceipt(result.receipt);
      } else {
        toast.error(result.error || 'Failed to process invoice');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Service Invoice</h1>
          <p className="text-gray-400 mt-2">Bill clients for services rendered</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Line items */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass p-4 rounded-lg">
            <label className="block text-xs font-medium text-gray-400 mb-2">Client Name</label>
            <input
              type="text"
              list="known-clients"
              placeholder="Search or type a client name..."
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full bg-transparent border border-gray-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-cyan"
            />
            <datalist id="known-clients">
              {knownClients.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </div>

          <div className="glass p-4 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold">Line Items</h2>
              <button
                onClick={addLine}
                className="text-xs font-semibold text-cyan hover:underline"
              >
                + Add line
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                  <input
                    type="text"
                    placeholder="Description (e.g. Website Development - Phase 1)"
                    value={item.description}
                    onChange={(e) => updateItem(index, { description: e.target.value })}
                    className="flex-1 w-full bg-transparent border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan"
                  />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, { quantity: Number(e.target.value) })}
                    className="w-full sm:w-20 bg-transparent border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan"
                  />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Rate"
                    value={item.rate}
                    onChange={(e) => updateItem(index, { rate: Number(e.target.value) })}
                    className="w-full sm:w-28 bg-transparent border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan"
                  />
                  <div className="w-full sm:w-24 text-sm font-semibold text-right">
                    {formatCurrency(lineTotals[index] || 0)}
                  </div>
                  <button
                    onClick={() => removeLine(index)}
                    disabled={items.length === 1}
                    className="text-gray-500 hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed px-1"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="glass p-4 rounded-lg">
            <label className="block text-xs font-medium text-gray-400 mb-2">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Any additional notes for this invoice..."
              className="w-full bg-transparent border border-gray-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-cyan resize-none"
            />
          </div>
        </div>

        {/* Totals & checkout */}
        <div className="glass p-5 rounded-lg h-fit sticky top-4">
          <h2 className="text-lg font-bold mb-4">Invoice Summary</h2>

          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-400">
              <span>Taxable Value</span>
              <span>{formatCurrency(taxPreview.taxableValue)}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>CGST ({CGST_RATE_LABEL})</span>
              <span>{formatCurrency(taxPreview.cgstAmount)}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>SGST ({SGST_RATE_LABEL})</span>
              <span>{formatCurrency(taxPreview.sgstAmount)}</span>
            </div>
            <div className="flex justify-between font-bold text-base pt-1.5 border-t border-gray-800">
              <span>Grand Total</span>
              <span className="text-cyan">{formatCurrency(taxPreview.grandTotal)}</span>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-xs font-medium text-gray-400 mb-2">Payment Method</label>
            <div className="grid grid-cols-3 gap-2">
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  className={`py-2 rounded-lg text-xs font-semibold border transition-all ${
                    paymentMethod === method
                      ? 'bg-cyan/10 border-cyan text-cyan'
                      : 'border-gray-700 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleConfirmInvoice}
            disabled={!canSubmit}
            className="w-full mt-5 bg-gradient-to-r from-cyan to-purple text-white font-semibold py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Processing...' : 'Confirm Invoice'}
          </button>
        </div>
      </div>

      {receipt && <PosReceipt receipt={receipt} />}
    </div>
  );
}
