/**
 * Payslip PDF generation + storage for payroll marked paid.
 *
 * Same private-bucket-plus-signed-URL pattern as lib/erp/receipts.ts:
 * files are written and read only through this server-only module using
 * the service-role client, and viewing goes through a short-lived signed
 * URL rather than a public one. Generation is pure jsPDF (text/lines/no
 * html2canvas) so it can run server-side — html2canvas needs a real DOM
 * canvas and only works client-side, which is why the existing invoice PDF
 * flow (components/erp/InvoiceReceiptModal.tsx) can't be reused here.
 */

import { jsPDF, GState } from 'jspdf';
import { supabaseServer as supabase } from '@/lib/supabase-server';
import { storeConfig } from '@/config/store.config';
import { getMonthName, computeNetSalary, type SalaryComponents } from '@/lib/erp/utils';
import { XLEVELSUP_LOGO_PNG } from '@/lib/erp/brand-logo';
import type { Payroll } from '@/types/erp';

export const PAYSLIP_BUCKET = 'payslips';

interface PayslipEmployeeInfo {
  name: string;
  employeeIdDisplay: string;
  department: string;
  role: string;
}

type Rgb = [number, number, number];

// Brand palette — the logo's gradient stops, plus neutral ink/greys.
const BRAND_GRADIENT: Rgb[] = [
  [0x12, 0xe5, 0xfe],
  [0x6c, 0x92, 0xff],
  [0x8b, 0x73, 0xf8],
  [0xc6, 0x40, 0xff],
];
const INK: Rgb = [17, 24, 39];
const MUTED: Rgb = [107, 114, 128];
const HAIRLINE: Rgb = [229, 231, 235];
const PANEL: Rgb = [246, 247, 251];
const ACCENT: Rgb = [0x6c, 0x92, 0xff];
const ACCENT_TINT: Rgb = [238, 242, 255];

/**
 * Amounts are printed without a currency symbol: jsPDF's built-in Helvetica
 * has no ₹ glyph (it renders as garbage), so column headers say "(INR)"
 * instead.
 */
const formatAmount = (n: number) =>
  new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

const formatDays = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

const formatPdfDate = (d: Date | string) =>
  new Date(d).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  });

const ONES = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
  'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen',
];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function belowHundredInWords(n: number): string {
  if (n < 20) return ONES[n];
  return TENS[Math.floor(n / 10)] + (n % 10 ? ` ${ONES[n % 10]}` : '');
}

/** Whole number in Indian numbering words (lakh/crore). */
function integerInWords(n: number): string {
  if (n === 0) return 'Zero';
  const parts: string[] = [];
  const crore = Math.floor(n / 10_000_000);
  const lakh = Math.floor(n / 100_000) % 100;
  const thousand = Math.floor(n / 1000) % 100;
  const hundred = Math.floor(n / 100) % 10;
  const rest = n % 100;
  if (crore) parts.push(`${integerInWords(crore)} Crore`);
  if (lakh) parts.push(`${belowHundredInWords(lakh)} Lakh`);
  if (thousand) parts.push(`${belowHundredInWords(thousand)} Thousand`);
  if (hundred) parts.push(`${ONES[hundred]} Hundred`);
  if (rest) parts.push(belowHundredInWords(rest));
  return parts.join(' ');
}

/** e.g. 34500.5 → "Rupees Thirty Four Thousand Five Hundred and Fifty Paise Only" */
function amountInWords(amount: number): string {
  const sign = amount < 0 ? 'Minus ' : '';
  const totalPaise = Math.round(Math.abs(amount) * 100);
  const rupees = Math.floor(totalPaise / 100);
  const paise = totalPaise % 100;
  const paisePart = paise ? ` and ${belowHundredInWords(paise)} Paise` : '';
  return `Rupees ${sign}${integerInWords(rupees)}${paisePart} Only`;
}

/**
 * Payment details (bank, transfer reference, payment date) are deliberately
 * never printed on a payslip — they live in the financial ledger only.
 */
export interface PayslipOptions {
  /** A not-yet-paid payroll row: watermarked PREVIEW, so it can't be mistaken for the final document. */
  preview?: boolean;
  /** effective_from of the salary structure the breakdown was snapshotted from. */
  structureEffectiveFrom?: string | null;
  /**
   * Basic/HRA/Special/Other to print when the payroll row itself has no
   * snapshotted breakdown (generated before any salary structure existed) —
   * the gross split by the default salary template. Adds up to gross_salary.
   */
  fallbackBreakdown?: SalaryComponents | null;
}

/** Renders a one-page payslip PDF and returns its raw bytes. */
export function generatePayslipPdf(
  payroll: Payroll,
  employee: PayslipEmployeeInfo,
  options: PayslipOptions = {},
): Uint8Array {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  const { lop_days, lop_deduction } = computeNetSalary(payroll);
  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 15;
  const rightX = pageWidth - marginX;
  const contentWidth = rightX - marginX;
  const isPreview = options.preview === true;

  // Working days outside the salaried window (joined / converted from intern
  // mid-month, or left) are excluded from payable days just like unpaid
  // absences, but they aren't absences — the stored day counts cover only
  // the salaried days, so the remainder is the out-of-window part. Shown as
  // its own proration line rather than inflating "Loss of Pay".
  const notOnPayrollDays = Math.max(
    0,
    payroll.total_working_days -
      payroll.present_days -
      payroll.paid_leave_days -
      payroll.half_days -
      payroll.unpaid_leave_days -
      payroll.absent_days,
  );
  const attendanceLopDays = Math.max(0, lop_days - notOnPayrollDays);
  const prorationAmount =
    payroll.total_working_days > 0
      ? Math.round((payroll.gross_salary / payroll.total_working_days) * notOnPayrollDays * 100) / 100
      : 0;
  // Remainder, so the two lines always add up to exactly lop_deduction.
  const attendanceLopAmount = Math.round((lop_deduction - prorationAmount) * 100) / 100;

  const fill = (c: Rgb) => doc.setFillColor(c[0], c[1], c[2]);
  const draw = (c: Rgb) => doc.setDrawColor(c[0], c[1], c[2]);
  const ink = (c: Rgb) => doc.setTextColor(c[0], c[1], c[2]);
  const font = (style: 'normal' | 'bold', size: number, color: Rgb = INK) => {
    doc.setFont('helvetica', style);
    doc.setFontSize(size);
    ink(color);
  };
  const fit = (text: string, maxWidth: number) =>
    (doc.splitTextToSize(text, maxWidth) as string[])[0] ?? '';

  /** Horizontal band shaded through the brand gradient. */
  const gradientBand = (x: number, yTop: number, width: number, height: number) => {
    const slices = 90;
    const sliceWidth = width / slices;
    for (let i = 0; i < slices; i++) {
      const t = (i / (slices - 1)) * (BRAND_GRADIENT.length - 1);
      const seg = Math.min(Math.floor(t), BRAND_GRADIENT.length - 2);
      const local = t - seg;
      const [a, b] = [BRAND_GRADIENT[seg], BRAND_GRADIENT[seg + 1]];
      fill([0, 1, 2].map((k) => Math.round(a[k] + (b[k] - a[k]) * local)) as Rgb);
      // Overlap slices slightly so no hairline gaps show between them.
      doc.rect(x + i * sliceWidth, yTop, sliceWidth + 0.2, height, 'F');
    }
  };

  // ── Header: brand bar, logo + company, payslip title ───────────────────────
  gradientBand(0, 0, pageWidth, 3);

  let y = 14;
  const logoWidth = 54;
  const logoHeight = (logoWidth * XLEVELSUP_LOGO_PNG.height) / XLEVELSUP_LOGO_PNG.width;
  doc.addImage(XLEVELSUP_LOGO_PNG.dataUrl, 'PNG', marginX, y, logoWidth, logoHeight);

  font('bold', 8, isPreview ? [220, 38, 38] : MUTED);
  doc.text(isPreview ? 'PAYSLIP PREVIEW - NOT PAID' : 'PAYSLIP', rightX, y + 1.5, { align: 'right' });
  font('bold', 17);
  doc.text(getMonthName(payroll.month), rightX, y + 9, { align: 'right' });

  y += logoHeight + 6;
  font('bold', 10);
  doc.text(storeConfig.legalName, marginX, y);
  y += 4.5;
  font('normal', 8.5, MUTED);
  const addressLine = [storeConfig.addressLine1, storeConfig.addressLine2, storeConfig.cityStatePincode]
    .filter(Boolean)
    .join(', ');
  doc.text(fit(addressLine, contentWidth), marginX, y);
  y += 4;
  doc.text(`GSTIN: ${storeConfig.gstin}   |   ${storeConfig.phone}`, marginX, y);

  y += 6;
  draw(HAIRLINE);
  doc.setLineWidth(0.3);
  doc.line(marginX, y, rightX, y);

  // ── Employee details card ─────────────────────────────────────────────────
  y += 6;
  const cardHeight = 27;
  fill(PANEL);
  doc.roundedRect(marginX, y, contentWidth, cardHeight, 2, 2, 'F');

  const detailCols = 3;
  const colWidth = contentWidth / detailCols;
  const details: [string, string][] = [
    ['Employee Name', employee.name],
    ['Employee ID', employee.employeeIdDisplay],
    ['Designation', employee.role || '—'],
    ['Department', employee.department || '—'],
    ['Pay Period', getMonthName(payroll.month)],
  ];
  details.forEach(([label, value], i) => {
    const col = i % detailCols;
    const rowIdx = Math.floor(i / detailCols);
    const x = marginX + 6 + col * colWidth;
    const rowY = y + 8 + rowIdx * 11;
    font('normal', 7, MUTED);
    doc.text(label.toUpperCase(), x, rowY, { charSpace: 0.3 });
    font('bold', 10);
    doc.text(fit(value, colWidth - 8), x, rowY + 4.8);
  });
  y += cardHeight;

  // ── Attendance summary ────────────────────────────────────────────────────
  y += 9;
  font('bold', 8, MUTED);
  doc.text('ATTENDANCE SUMMARY', marginX, y, { charSpace: 0.5 });
  y += 3;

  const stats: [string, number][] = [
    ['Working Days', payroll.total_working_days],
    ['Present', payroll.present_days],
    ['Paid Leave', payroll.paid_leave_days],
    ['Half Days', payroll.half_days],
    ['Loss of Pay', attendanceLopDays],
    ['Payable Days', payroll.payable_days],
  ];
  const statGap = 3;
  const statWidth = (contentWidth - statGap * (stats.length - 1)) / stats.length;
  const statHeight = 16;
  stats.forEach(([label, value], i) => {
    const x = marginX + i * (statWidth + statGap);
    const highlight = i === stats.length - 1;
    fill(highlight ? ACCENT_TINT : [255, 255, 255]);
    draw(highlight ? ACCENT : HAIRLINE);
    doc.roundedRect(x, y, statWidth, statHeight, 1.5, 1.5, 'FD');
    font('bold', 13, highlight ? ACCENT : INK);
    doc.text(formatDays(value), x + statWidth / 2, y + 7.5, { align: 'center' });
    font('normal', 7, MUTED);
    doc.text(label, x + statWidth / 2, y + 12.5, { align: 'center' });
  });
  y += statHeight;

  // ── Earnings | Deductions ─────────────────────────────────────────────────
  const earnings: [string, number][] = [];
  // Structured breakdown — only present for full-time employees generated
  // from an effective employee_salary_structure (see createPayroll).
  const components: SalaryComponents | null =
    payroll.basic_salary != null
      ? {
          basic_salary: payroll.basic_salary,
          hra: payroll.hra || 0,
          special_allowance: payroll.special_allowance || 0,
          other_allowance: payroll.other_allowance || 0,
        }
      : options.fallbackBreakdown ?? null;
  if (components) {
    earnings.push(['Basic Salary', components.basic_salary]);
    if (components.hra) earnings.push(['House Rent Allowance', components.hra]);
    if (components.special_allowance) earnings.push(['Special Allowance', components.special_allowance]);
    if (components.other_allowance) earnings.push(['Other Allowance', components.other_allowance]);
  } else {
    earnings.push(['Gross Salary', payroll.gross_salary]);
  }
  if (payroll.bonus > 0) earnings.push(['Bonus', payroll.bonus]);

  const deductions: [string, number][] = [];
  if (prorationAmount > 0) {
    deductions.push([`Proration - not on payroll (${formatDays(notOnPayrollDays)} days)`, prorationAmount]);
  }
  if (attendanceLopAmount > 0) {
    deductions.push([`Loss of Pay (${formatDays(attendanceLopDays)} days)`, attendanceLopAmount]);
  }
  if (payroll.pf_deduction) deductions.push(['Provident Fund (PF)', payroll.pf_deduction]);
  if (payroll.esi_deduction) deductions.push(['ESI', payroll.esi_deduction]);
  if (payroll.professional_tax_deduction) deductions.push(['Professional Tax', payroll.professional_tax_deduction]);
  if (payroll.tds_deduction) deductions.push(['Income Tax (TDS)', payroll.tds_deduction]);
  if (payroll.other_structured_deduction) deductions.push(['Other Deduction', payroll.other_structured_deduction]);
  if (payroll.deduction > 0) deductions.push(['Adjustment', payroll.deduction]);

  const totalEarnings = payroll.gross_salary + (payroll.bonus || 0);
  const totalDeductions = deductions.reduce((sum, [, amount]) => sum + amount, 0);

  y += 9;
  const tableGap = 6;
  const tableWidth = (contentWidth - tableGap) / 2;
  const headerHeight = 8;
  const rowHeight = 7.5;
  const bodyRows = Math.max(earnings.length, deductions.length, 1);

  const drawTable = (x: number, title: string, rows: [string, number][], totalLabel: string, total: number) => {
    let ty = y;
    fill(INK);
    doc.roundedRect(x, ty, tableWidth, headerHeight, 1.5, 1.5, 'F');
    doc.rect(x, ty + headerHeight - 2, tableWidth, 2, 'F'); // square off the bottom corners
    font('bold', 8, [255, 255, 255]);
    doc.text(title, x + 4, ty + 5.3, { charSpace: 0.5 });
    doc.text('AMOUNT (INR)', x + tableWidth - 4, ty + 5.3, { align: 'right' });
    ty += headerHeight;

    for (let i = 0; i < bodyRows; i++) {
      if (i % 2 === 1) {
        fill(PANEL);
        doc.rect(x, ty, tableWidth, rowHeight, 'F');
      }
      const entry = rows[i];
      if (entry) {
        font('normal', 9.5);
        doc.text(fit(entry[0], tableWidth - 34), x + 4, ty + 5);
        doc.text(formatAmount(entry[1]), x + tableWidth - 4, ty + 5, { align: 'right' });
      } else if (i === 0) {
        font('normal', 9.5, MUTED);
        doc.text('No deductions', x + 4, ty + 5);
        doc.text('—', x + tableWidth - 4, ty + 5, { align: 'right' });
      }
      ty += rowHeight;
    }

    draw(INK);
    doc.setLineWidth(0.4);
    doc.line(x, ty, x + tableWidth, ty);
    font('bold', 10);
    doc.text(totalLabel, x + 4, ty + 6);
    doc.text(formatAmount(total), x + tableWidth - 4, ty + 6, { align: 'right' });

    draw(HAIRLINE);
    doc.setLineWidth(0.3);
    doc.rect(x, y, tableWidth, ty + 9 - y, 'S');
  };

  drawTable(marginX, 'EARNINGS', earnings, 'Total Earnings', totalEarnings);
  drawTable(marginX + tableWidth + tableGap, 'DEDUCTIONS', deductions, 'Total Deductions', totalDeductions);
  y += headerHeight + bodyRows * rowHeight + 9;

  // ── Net pay ───────────────────────────────────────────────────────────────
  y += 8;
  const netHeight = 24;
  fill(ACCENT_TINT);
  doc.roundedRect(marginX, y, contentWidth, netHeight, 2, 2, 'F');
  gradientBand(marginX, y, 2.5, netHeight);

  font('bold', 8, ACCENT);
  doc.text('NET PAY', marginX + 8, y + 8, { charSpace: 0.6 });
  font('normal', 8.5, MUTED);
  doc.text(fit(amountInWords(payroll.net_salary), contentWidth - 80), marginX + 8, y + (isPreview ? 14 : 16));
  if (isPreview) {
    doc.text(fit('Not yet paid - figures may change until payroll is marked paid', contentWidth - 80), marginX + 8, y + 19);
  }

  font('bold', 8, MUTED);
  doc.text('INR', rightX - 6, y + 8, { align: 'right' });
  font('bold', 20);
  doc.text(formatAmount(payroll.net_salary), rightX - 6, y + 17, { align: 'right' });

  y += netHeight;
  font('normal', 7.5, MUTED);
  if (options.structureEffectiveFrom && payroll.basic_salary != null) {
    doc.text(
      `Salary structure effective from ${formatPdfDate(options.structureEffectiveFrom)}  ·  Monthly gross ${formatAmount(payroll.gross_salary)}`,
      marginX,
      y + 5,
    );
  }
  doc.text('Net Pay = Total Earnings - Total Deductions', rightX, y + 5, { align: 'right' });

  // ── Footer ────────────────────────────────────────────────────────────────
  const footerY = pageHeight - 16;
  draw(HAIRLINE);
  doc.line(marginX, footerY, rightX, footerY);
  font('normal', 7.5, MUTED);
  doc.text('This is a system-generated payslip and does not require a signature.', pageWidth / 2, footerY + 5, {
    align: 'center',
  });
  doc.text(`${storeConfig.legalName}  ·  Confidential`, pageWidth / 2, footerY + 9, { align: 'center' });
  gradientBand(0, pageHeight - 2, pageWidth, 2);

  if (isPreview) {
    doc.setGState(new GState({ opacity: 0.07 }));
    font('bold', 110, [220, 38, 38]);
    doc.text('PREVIEW', pageWidth / 2, pageHeight / 2 + 30, { align: 'center', angle: 35 });
    doc.setGState(new GState({ opacity: 1 }));
  }

  return new Uint8Array(doc.output('arraybuffer') as ArrayBuffer);
}

/**
 * Upload a generated payslip and return its Storage object path (not a
 * URL — the bucket is private, callers must fetch a signed URL to view it).
 */
export async function uploadPayslipPdf(
  pdfBytes: Uint8Array,
  employeeIdDisplay: string,
  month: string,
): Promise<string> {
  const path = `${crypto.randomUUID()}.pdf`;
  const file = new File([pdfBytes as BlobPart], `Payslip-${employeeIdDisplay}-${month}.pdf`, {
    type: 'application/pdf',
  });

  const { error } = await supabase.storage.from(PAYSLIP_BUCKET).upload(path, file, {
    contentType: 'application/pdf',
    upsert: false,
  });

  if (error) {
    throw new Error(`Failed to upload payslip: ${error.message}`);
  }
  return path;
}

/**
 * Generate a short-lived signed URL to view/download a stored payslip.
 * Returns null (rather than throwing) on failure.
 */
export async function getPayslipSignedUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(PAYSLIP_BUCKET)
    .createSignedUrl(path, 60 * 10); // 10 minutes

  if (error) {
    console.error('Error creating payslip signed URL:', error);
    return null;
  }
  return data?.signedUrl ?? null;
}
