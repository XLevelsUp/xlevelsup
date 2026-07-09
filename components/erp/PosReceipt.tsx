'use client';

import { storeConfig } from '@/config/store.config';
import { CGST_RATE_LABEL, SGST_RATE_LABEL } from '@/lib/pos-tax';
import type { ReceiptData } from '@/types/pos';

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
});

interface PosReceiptProps {
  receipt: ReceiptData;
  /** Renders inline (normal document flow) for batch printing instead of taking over the full page on its own. */
  forBulkPrint?: boolean;
}

export default function PosReceipt({ receipt, forBulkPrint = false }: PosReceiptProps) {
  return (
    <div className={`pos-receipt ${forBulkPrint ? 'pos-receipt--inline' : 'pos-receipt--single'}`}>
      <style>{`
        @media screen {
          .pos-receipt {
            display: none;
          }
        }

        @media print {
          @page {
            size: A5 portrait;
            margin: 8mm;
          }

          html, body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          body * {
            visibility: hidden;
          }

          .pos-receipt,
          .pos-receipt * {
            visibility: visible;
          }

          .pos-receipt {
            display: block;
          }

          .pos-receipt--single {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
          }
        }

        .pos-receipt {
          width: 100%;
          max-width: 380px;
          margin: 0 auto;
          font-family: 'Courier New', Courier, monospace;
          color: #000;
          background: #fff;
          font-size: 12px;
        }

        .pos-receipt__header {
          text-align: center;
          background: #111827;
          color: #fff;
          padding: 8px;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        .pos-receipt__store-name {
          font-size: 16px;
          font-weight: 700;
          letter-spacing: 0.05em;
        }

        .pos-receipt__body {
          padding: 8px;
        }

        .pos-receipt__meta-row {
          display: flex;
          justify-content: space-between;
          margin: 2px 0;
        }

        .pos-receipt table {
          width: 100%;
          border-collapse: collapse;
          margin: 8px 0;
        }

        .pos-receipt th,
        .pos-receipt td {
          text-align: left;
          padding: 2px 4px;
          font-size: 11px;
          vertical-align: top;
        }

        .pos-receipt th {
          border-bottom: 1px solid #000;
        }

        .pos-receipt td.pos-receipt__qty,
        .pos-receipt th.pos-receipt__qty,
        .pos-receipt td.pos-receipt__amount,
        .pos-receipt th.pos-receipt__amount {
          text-align: right;
        }

        .pos-receipt__sku {
          font-size: 9px;
          color: #555;
        }

        .pos-receipt__totals {
          border-top: 1px dashed #000;
          padding-top: 6px;
          margin-top: 6px;
        }

        .pos-receipt__totals-row {
          display: flex;
          justify-content: space-between;
          padding: 2px 0;
        }

        .pos-receipt__grand-total {
          background: #e5e7eb;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          font-weight: 700;
          font-size: 14px;
          padding: 4px 6px;
          margin-top: 4px;
          border-radius: 2px;
        }

        .pos-receipt__footer {
          text-align: center;
          margin-top: 10px;
          border-top: 2px dashed #000;
          padding-top: 8px;
          font-size: 10px;
        }
      `}</style>

      <div className="pos-receipt__header">
        <div className="pos-receipt__store-name">{storeConfig.name}</div>
        {storeConfig.addressLine1 && <div>{storeConfig.addressLine1}</div>}
        {storeConfig.addressLine2 && <div>{storeConfig.addressLine2}</div>}
        {storeConfig.cityStatePincode && <div>{storeConfig.cityStatePincode}</div>}
        {storeConfig.gstin && <div>GSTIN: {storeConfig.gstin}</div>}
        {storeConfig.phone && <div>Ph: {storeConfig.phone}</div>}
      </div>

      <div className="pos-receipt__body">
        <div className="pos-receipt__meta-row">
          <span>Invoice No:</span>
          <strong>{receipt.invoiceNumber}</strong>
        </div>
        <div className="pos-receipt__meta-row">
          <span>Order No:</span>
          <span>{receipt.orderNumber}</span>
        </div>
        <div className="pos-receipt__meta-row">
          <span>Date:</span>
          <span>{new Date(receipt.createdAt).toLocaleString('en-IN')}</span>
        </div>
        <div className="pos-receipt__meta-row">
          <span>Client:</span>
          <span>{receipt.clientName}</span>
        </div>
        <div className="pos-receipt__meta-row">
          <span>Payment:</span>
          <span>{receipt.paymentMethod}</span>
        </div>

        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th className="pos-receipt__qty">Qty</th>
              <th className="pos-receipt__amount">Amount</th>
            </tr>
          </thead>
          <tbody>
            {receipt.items.map((item, index) => (
              <tr key={index}>
                <td>{item.description}</td>
                <td className="pos-receipt__qty">{item.quantity}</td>
                <td className="pos-receipt__amount">{currencyFormatter.format(item.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="pos-receipt__totals">
          <div className="pos-receipt__totals-row">
            <span>Taxable Value</span>
            <span>{currencyFormatter.format(receipt.taxableValue)}</span>
          </div>
          <div className="pos-receipt__totals-row">
            <span>CGST ({CGST_RATE_LABEL})</span>
            <span>{currencyFormatter.format(receipt.cgstAmount)}</span>
          </div>
          <div className="pos-receipt__totals-row">
            <span>SGST ({SGST_RATE_LABEL})</span>
            <span>{currencyFormatter.format(receipt.sgstAmount)}</span>
          </div>
          <div className="pos-receipt__totals-row pos-receipt__grand-total">
            <span>Grand Total</span>
            <span>{currencyFormatter.format(receipt.grandTotal)}</span>
          </div>
        </div>

        <div className="pos-receipt__footer">Thank you for your purchase!</div>
      </div>
    </div>
  );
}
