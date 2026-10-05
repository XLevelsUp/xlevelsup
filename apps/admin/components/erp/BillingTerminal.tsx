'use client';

import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { processServiceInvoice } from '@/actions/erp/billing';
import { computeGstBreakdown, round2Amount, CGST_RATE_LABEL, SGST_RATE_LABEL } from '@/lib/billing-tax';
import { formatCurrency } from '@/lib/erp/utils';
import InvoiceReceiptModal from './InvoiceReceiptModal';
import type { InvoiceLineItem, PaymentMethod, ReceiptData } from '@/types/billing';

interface BillingTerminalProps {
  knownClients: string[];
}

const PAYMENT_METHODS: PaymentMethod[] = ['CASH', 'UPI', 'BANK_TRANSFER'];
const EMPTY_LINE: InvoiceLineItem = { description: '', quantity: 1, rate: 0 };

export default function BillingTerminal({ knownClients }: BillingTerminalProps) {
  const [clientName, setClientName] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<InvoiceLineItem[]>([{ ...EMPTY_LINE }]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  // Server-side failure (e.g. a DB constraint the client can't validate
  // against, or a network error) — shown as a persistent banner on the page
  // itself, not just a toast that's easy to miss.
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleCloseReceipt = () => {
    setReceipt(null);
    setClientName('');
    setNotes('');
    setItems([{ ...EMPTY_LINE }]);
    setAttemptedSubmit(false);
    setSubmitError(null);
  };

  const lineTotals = useMemo(
    () => items.map((item) => round2Amount(item.rate)),
    [items],
  );

  const grandTotal = round2Amount(lineTotals.reduce((sum, total) => sum + total, 0));
  const taxPreview = computeGstBreakdown(grandTotal);

  const validItems = items.filter((item) => item.description.trim().length > 0);

  // Derived (not stored) so messages appear/disappear live as the user
  // fixes them, and only once a submit attempt has been made.
  const clientNameError =
    attemptedSubmit && !clientName.trim() ? 'Client name is required' : null;

  const lineErrors = useMemo(() => {
    if (!attemptedSubmit) return {} as Record<number, string>;
    const errs: Record<number, string> = {};
    items.forEach((item, index) => {
      if (!item.description.trim()) return;
      if (item.rate <= 0) {
        errs[index] = 'Amount must be greater than 0';
      }
    });
    return errs;
  }, [attemptedSubmit, items]);

  const itemsError =
    attemptedSubmit && validItems.length === 0
      ? 'Add at least one line item with a description'
      : null;

  const updateItem = (index: number, patch: Partial<InvoiceLineItem>) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const addLine = () => setItems((prev) => [...prev, { ...EMPTY_LINE }]);

  const removeLine = (index: number) => {
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));
  };

  const handleConfirmInvoice = async () => {
    setAttemptedSubmit(true);
    setSubmitError(null);

    const hasLineErrors = items.some(
      (item) => item.description.trim() && item.rate <= 0,
    );
    if (!clientName.trim() || validItems.length === 0 || hasLineErrors || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await processServiceInvoice({
        clientName: clientName.trim(),
        paymentMethod,
        items: validItems.map((item) => ({
          description: item.description.trim(),
          quantity: 1,
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
        const message = result.error || 'Failed to process invoice';
        toast.error(message);
        setSubmitError(message);
      }
    } catch (error) {
      // Guards against a thrown/rejected request (e.g. a network error) —
      // without this, the button re-enables silently with no feedback,
      // which reads as "nothing happened" rather than a clear failure.
      console.error('Failed to process invoice:', error);
      const message = 'Failed to process invoice — please try again';
      toast.error(message);
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {/* The page header and "New Invoice" tab (app/erp/billing/page.tsx)
          already title this view. Columns follow the @container on that
          page: the summary moves beside the form only once the form column
          itself is still comfortably wide. */}
      <div className="grid grid-cols-1 @4xl:grid-cols-3 gap-4 @xl:gap-6">
        {/* Line items */}
        <div className="@4xl:col-span-2 space-y-4 min-w-0">
          <div className="glass p-4 rounded-lg">
            <label htmlFor="billing-client" className="block text-xs font-medium text-gray-400 mb-2">Client Name</label>
            <input
              id="billing-client"
              type="text"
              list="known-clients"
              placeholder="Search or type a client name..."
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className={`w-full min-w-0 bg-transparent border rounded-lg px-4 py-2.5 text-sm focus:outline-none ${
                clientNameError ? 'border-red-500 focus:border-red-500' : 'border-gray-700 focus:border-[var(--cyan)]'
              }`}
            />
            <datalist id="known-clients">
              {knownClients.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
            {clientNameError && <p className="text-xs text-red-400 mt-1.5">{clientNameError}</p>}
          </div>

          <div className="glass p-4 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold">Line Items</h2>
              <button
                type="button"
                onClick={addLine}
                className="text-xs font-semibold text-cyan hover:underline"
              >
                + Add line
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => {
                const lineError = lineErrors[index];
                return (
                  <div key={index} className="space-y-1">
                    {/* Narrow: description on its own row, amount + remove
                        beneath it (the ✕ used to drop onto a third row by
                        itself). Wide: all three on one row. */}
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] @xl:grid-cols-[minmax(0,1fr)_9rem_auto] gap-2 items-center">
                      <input
                        type="text"
                        aria-label={`Line ${index + 1} description`}
                        placeholder="Description (e.g. Website Development - Phase 1)"
                        value={item.description}
                        onChange={(e) => updateItem(index, { description: e.target.value })}
                        className="col-span-2 @xl:col-span-1 w-full min-w-0 bg-transparent border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--cyan)]"
                      />
                      <input
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        min="0"
                        aria-label={`Line ${index + 1} amount`}
                        placeholder="Amount (₹)"
                        // Empty rather than "0" until something is typed, so
                        // the placeholder shows; Number('') is still 0.
                        value={item.rate || ''}
                        onChange={(e) => updateItem(index, { rate: Number(e.target.value) })}
                        className={`w-full min-w-0 bg-transparent border rounded-lg px-3 py-2 text-sm tabular-nums focus:outline-none ${
                          lineError ? 'border-red-500 focus:border-red-500' : 'border-gray-700 focus:border-[var(--cyan)]'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => removeLine(index)}
                        disabled={items.length === 1}
                        aria-label={`Remove line ${index + 1}`}
                        title="Remove line"
                        className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                      >
                        ✕
                      </button>
                    </div>
                    {lineError && <p className="text-xs text-red-400 pl-1">{lineError}</p>}
                  </div>
                );
              })}
            </div>
            {itemsError && <p className="text-xs text-red-400 mt-2">{itemsError}</p>}
          </div>

          <div className="glass p-4 rounded-lg">
            <label htmlFor="billing-notes" className="block text-xs font-medium text-gray-400 mb-2">Notes (optional)</label>
            <textarea
              id="billing-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Any additional notes for this invoice..."
              className="w-full min-w-0 bg-transparent border border-gray-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--cyan)] resize-none"
            />
          </div>
        </div>

        {/* Totals & checkout. Sticky only beside the form, and at top-20 —
            the old top-4 slid this panel up underneath the 64px sticky
            ERPHeader (z-30) while scrolling a long invoice. */}
        <div className="glass p-5 rounded-lg h-fit min-w-0 @4xl:sticky @4xl:top-20">
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
            <p id="billing-payment-method" className="block text-xs font-medium text-gray-400 mb-2">Payment Method</p>
            <div role="group" aria-labelledby="billing-payment-method" className="grid grid-cols-3 gap-2">
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  aria-pressed={paymentMethod === method}
                  className={`py-2 px-1 rounded-lg text-xs font-semibold border transition-all min-w-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cyan)] ${
                    paymentMethod === method
                      ? 'bg-cyan/10 border-cyan text-cyan'
                      : 'border-gray-700 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  {method.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {submitError && (
            <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2.5">
              <p className="text-xs text-red-400">⚠️ {submitError}</p>
            </div>
          )}

          <button
            onClick={handleConfirmInvoice}
            disabled={isSubmitting}
            className="w-full mt-5 bg-gradient-to-r from-cyan to-purple text-white font-semibold py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Processing...' : 'Confirm Invoice'}
          </button>
        </div>
      </div>

      <InvoiceReceiptModal
        receipt={receipt}
        onClose={handleCloseReceipt}
        closeLabel="Done — New Invoice"
      />
    </div>
  );
}
