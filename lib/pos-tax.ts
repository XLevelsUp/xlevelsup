/**
 * Pure GST math shared by the server action and the POS client UI.
 * No server-only imports here — this file is safe to import from
 * client components.
 */

import type { GstBreakdown } from '@/types/pos';

/** Flat GST rate applied to all services: 9% CGST + 9% SGST */
export const GST_RATE = 0.18;

/** Display labels for the per-side GST rate, derived from GST_RATE (e.g. "9%") */
export const CGST_RATE_LABEL = `${((GST_RATE / 2) * 100).toFixed(0)}%`;
export const SGST_RATE_LABEL = CGST_RATE_LABEL;

export function round2Amount(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

/**
 * Reverse-calculate the GST breakdown from a tax-inclusive grand total.
 * taxableValue = grandTotal / (1 + GST_RATE); the remainder splits evenly
 * into CGST/SGST.
 */
export function computeGstBreakdown(grandTotal: number): GstBreakdown {
  const taxableValue = round2Amount(grandTotal / (1 + GST_RATE));
  const totalGst = round2Amount(grandTotal - taxableValue);
  const cgstAmount = round2Amount(totalGst / 2);
  const sgstAmount = round2Amount(totalGst - cgstAmount);
  return { taxableValue, cgstAmount, sgstAmount, grandTotal: round2Amount(grandTotal) };
}
