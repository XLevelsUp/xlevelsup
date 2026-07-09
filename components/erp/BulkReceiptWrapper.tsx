'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import PosReceipt from './PosReceipt';
import type { ReceiptData } from '@/types/pos';

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
    <div className="pos-bulk-receipts">
      <style>{`
        @media screen {
          .pos-bulk-receipts {
            display: none;
          }
        }

        @media print {
          .pos-bulk-receipts {
            display: block;
          }

          .pos-bulk-receipt-page {
            page-break-after: always;
          }

          .pos-bulk-receipt-page:last-child {
            page-break-after: avoid;
          }
        }
      `}</style>
      {receipts.map((receipt, index) => (
        <div key={`${receipt.invoiceNumber}-${index}`} className="pos-bulk-receipt-page">
          <PosReceipt receipt={receipt} forBulkPrint />
        </div>
      ))}
    </div>,
    document.body,
  );
}
