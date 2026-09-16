'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import Modal from '@/components/ui/Modal';
import InvoiceReceipt from './InvoiceReceipt';
import type { ReceiptData } from '@/types/billing';

interface InvoiceReceiptModalProps {
  receipt: ReceiptData | null;
  onClose: () => void;
  /** Label for the bottom dismiss button — differs by context (e.g. "Done — New Invoice" vs "Close"). */
  closeLabel?: string;
}

/**
 * Shared print/download-PDF modal for a single invoice receipt — used both
 * right after creating a new invoice and when reprinting a past one from
 * the invoice history list.
 */
export default function InvoiceReceiptModal({
  receipt,
  onClose,
  closeLabel = 'Close',
}: InvoiceReceiptModalProps) {
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [mounted, setMounted] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const receiptRef = useRef<HTMLDivElement>(null);
  const pdfSourceRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [scaledHeight, setScaledHeight] = useState<number | null>(null);

  // The invoice is a fixed physical page size in CSS mm — on screen it's
  // shown as a scaled-down, responsive thumbnail that fits the viewport;
  // print and PDF export each use their own separate, unscaled full-size
  // copy instead (see pdfSourceRef and the print-portal below) — a target
  // that has a CSS transform applied directly to it, as this preview does,
  // isn't reliably rasterized by html2canvas.
  //
  // Uses ResizeObserver rather than a one-off measurement: the modal's
  // entrance animation and any late-loading asset (e.g. the logo image)
  // can change the content's rendered size after the first paint, and a
  // stale one-time measurement would leave the wrapper's fixed height out
  // of sync with the actual (transformed) content — showing as extra
  // blank space or clipped content.
  useLayoutEffect(() => {
    if (!receipt) return;
    const container = wrapperRef.current;
    const inner = receiptRef.current;
    if (!container || !inner) return;

    const computeScale = () => {
      const availableWidth = container.clientWidth;
      const nativeWidth = inner.offsetWidth;
      const nativeHeight = inner.offsetHeight;
      if (!nativeWidth || !nativeHeight) return;
      const next = Math.min(1, Math.max(0.25, availableWidth / nativeWidth));
      setScale(next);
      setScaledHeight(nativeHeight * next);
    };

    computeScale();
    const observer = new ResizeObserver(computeScale);
    observer.observe(container);
    observer.observe(inner);
    return () => observer.disconnect();
  }, [receipt]);

  useLayoutEffect(() => {
    setMounted(true);
  }, []);

  const handlePrint = () => window.print();

  const handleDownloadPdf = async () => {
    if (!pdfSourceRef.current || !receipt) return;

    setIsDownloadingPdf(true);
    try {
      // html2canvas-pro (not plain html2canvas) — the stock library can't
      // parse the oklch() color functions Tailwind v4's default palette
      // generates and throws "unsupported color function" while walking
      // the page's styles during capture; this fork adds that support.
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas-pro'),
        import('jspdf'),
      ]);

      const canvas = await html2canvas(pdfSourceRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
      });
      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF({ unit: 'mm', format: 'a5' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Invoice numbers now contain a "/" (e.g. XLU-001/26-27) — not valid
      // in a filename, so swap any such characters out before saving.
      const safeFileName = receipt.invoiceNumber.replace(/[/\\:*?"<>|]/g, '_');
      pdf.save(`${safeFileName}.pdf`);
    } catch (error) {
      console.error('Failed to generate invoice PDF:', error);
      toast.error('Failed to generate PDF');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={!!receipt}
        onClose={onClose}
        title={receipt ? `Invoice ${receipt.invoiceNumber}` : 'Invoice'}
      >
        {receipt && (
          <div className="space-y-5">
            {/* Screen-only scaled preview. Hidden from print entirely — the
                portalled copy below (a sibling of document.body, outside
                this Modal's transformed ancestor) handles printing so
                position:fixed in InvoiceReceipt's print CSS isn't trapped
                inside the modal's own containing block. */}
            <div
              ref={wrapperRef}
              className="invoice-modal-preview w-full overflow-hidden"
              style={scaledHeight ? { height: scaledHeight } : undefined}
            >
              <style>{`
                @media print {
                  .invoice-modal-preview { display: none !important; }
                }
              `}</style>
              <div
                ref={receiptRef}
                style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: 'fit-content' }}
              >
                <InvoiceReceipt receipt={receipt} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handlePrint}
                className="py-2.5 rounded-lg text-sm font-semibold border border-gray-700 text-gray-200 hover:border-cyan hover:text-cyan transition-all"
              >
                🖨️ Print
              </button>
              <button
                onClick={handleDownloadPdf}
                disabled={isDownloadingPdf}
                className="py-2.5 rounded-lg text-sm font-semibold bg-gradient-to-r from-cyan to-purple text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isDownloadingPdf ? 'Generating…' : '⬇️ Download PDF'}
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-full py-2 text-xs text-gray-400 hover:text-white transition-colors"
            >
              {closeLabel}
            </button>
          </div>
        )}
      </Modal>

      {/* Full-size, unscaled, off-screen copy used exclusively as the
          html2canvas capture source for PDF download. Deliberately not the
          on-screen preview above — that one has a CSS scale transform
          applied directly to it (for the responsive thumbnail), and
          html2canvas can't reliably rasterize a target that is itself
          transformed. Positioned off-screen rather than display:none,
          since display:none has no layout box and html2canvas can't
          capture it at all. */}
      {receipt && (
        <div
          className="invoice-pdf-source"
          style={{ position: 'fixed', top: 0, left: '-9999px', pointerEvents: 'none' }}
          aria-hidden="true"
        >
          <style>{`
            /* Excluded from print — InvoiceReceipt's own print CSS gives
               .invoice-a5--single position:fixed;top:0;left:0, which would
               otherwise pull this off-screen copy on-page too, on top of
               the dedicated .invoice-print-only copy below. */
            @media print {
              .invoice-pdf-source { display: none !important; }
            }
          `}</style>
          <div ref={pdfSourceRef}>
            <InvoiceReceipt receipt={receipt} />
          </div>
        </div>
      )}

      {/* Print-only copy, portalled straight to document.body so it isn't
          nested inside the Modal's transformed ancestor (framer-motion
          applies a CSS transform for the open/close animation, which
          creates a new containing block and breaks position:fixed on an
          in-modal copy) — same fix BulkReceiptWrapper.tsx already applies
          for bulk printing. Invisible on screen; @page/visibility rules in
          InvoiceReceipt's own print CSS take over once actually printing. */}
      {mounted &&
        receipt &&
        createPortal(
          <div className="invoice-print-only">
            <style>{`
              @media screen {
                .invoice-print-only { display: none; }
              }
              @media print {
                .invoice-print-only { display: block; }
              }
            `}</style>
            <InvoiceReceipt receipt={receipt} />
          </div>,
          document.body,
        )}
    </>
  );
}
