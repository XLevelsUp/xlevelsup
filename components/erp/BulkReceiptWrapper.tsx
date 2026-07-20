'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import InvoiceReceipt from './InvoiceReceipt';
import type { ReceiptData } from '@/types/billing';

interface BulkReceiptWrapperProps {
  receipts: ReceiptData[];
}

/**
 * Renders a batch of tax invoices via a portal to document.body so they
 * print on separate pages regardless of where this component sits in the
 * React tree.
 */
export default function BulkReceiptWrapper({ receipts }: BulkReceiptWrapperProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || receipts.length === 0) return null;

  return createPortal(
    <div className="bulk-invoice-receipts">
      <style>{`
        @media screen {
          .bulk-invoice-receipts {
            display: none;
          }
        }

        @media print {
          .bulk-invoice-receipts {
            display: block;
          }

          .bulk-invoice-receipt-page {
            page-break-after: always;
          }

          .bulk-invoice-receipt-page:last-child {
            page-break-after: avoid;
          }
        }
      `}</style>
      {receipts.map((receipt, index) => (
        <div key={`${receipt.invoiceNumber}-${index}`} className="bulk-invoice-receipt-page">
          <InvoiceReceipt receipt={receipt} forBulkPrint />
        </div>
      ))}
    </div>,
    document.body,
  );
}
