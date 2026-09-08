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

import { jsPDF } from 'jspdf';
import { supabaseServer as supabase } from '@/lib/supabase-server';
import { storeConfig } from '@/config/store.config';
import { formatCurrency, getMonthName, computeNetSalary } from '@/lib/erp/utils';
import type { Payroll } from '@/types/erp';

export const PAYSLIP_BUCKET = 'payslips';

interface PayslipEmployeeInfo {
  name: string;
  employeeIdDisplay: string;
  department: string;
  role: string;
}

/** Renders a one-page payslip PDF and returns its raw bytes. */
export function generatePayslipPdf(
  payroll: Payroll,
  employee: PayslipEmployeeInfo,
  referenceNumber: string,
): Uint8Array {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const { lop_days, lop_deduction } = computeNetSalary(payroll);
  const pageWidth = 210;
  const marginX = 15;
  const rightX = pageWidth - marginX;
  let y = 20;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(storeConfig.legalName, pageWidth / 2, y, { align: 'center' });
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const addressLine = [storeConfig.addressLine1, storeConfig.addressLine2].filter(Boolean).join(', ');
  doc.text(addressLine, pageWidth / 2, y, { align: 'center' });
  y += 4.5;
  doc.text(`${storeConfig.cityStatePincode} | GSTIN: ${storeConfig.gstin}`, pageWidth / 2, y, { align: 'center' });
  y += 8;

  doc.setDrawColor(180);
  doc.line(marginX, y, rightX, y);
  y += 9;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(`Payslip — ${getMonthName(payroll.month)}`, pageWidth / 2, y, { align: 'center' });
  y += 10;

  const labelCol2X = pageWidth / 2 + 5;
  const field = (label: string, value: string, x: number) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`${label}: ${value}`, x, y);
  };
  field('Employee Name', employee.name, marginX);
  field('Employee ID', employee.employeeIdDisplay, labelCol2X);
  y += 6;
  field('Department', employee.department, marginX);
  field('Role', employee.role, labelCol2X);
  y += 6;
  field('Payment Date', new Date().toLocaleDateString('en-IN'), marginX);
  field('Reference ID', referenceNumber, labelCol2X);
  y += 10;

  doc.line(marginX, y, rightX, y);
  y += 8;

  const row = (label: string, value: string, bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(11);
    doc.text(label, marginX, y);
    doc.text(value, rightX, y, { align: 'right' });
    y += 7;
  };

  row('Total Working Days', String(payroll.total_working_days));
  row('Present Days', String(payroll.present_days));
  row('Paid Leave Days', String(payroll.paid_leave_days));
  row('Half Days', String(payroll.half_days));
  row('Payable Days', String(payroll.payable_days));
  if (lop_days > 0) row('Loss of Pay Days', String(lop_days));
  y += 2;
  doc.line(marginX, y, rightX, y);
  y += 8;

  row('Per Day Salary', formatCurrency(payroll.per_day_salary));
  row('Gross Salary', formatCurrency(payroll.gross_salary));
  if (lop_deduction > 0) row('Loss of Pay Deduction', `- ${formatCurrency(lop_deduction)}`);
  if (payroll.bonus > 0) row('Bonus', `+ ${formatCurrency(payroll.bonus)}`);
  if (payroll.deduction > 0) row('Other Deduction', `- ${formatCurrency(payroll.deduction)}`);
  y += 2;
  doc.line(marginX, y, rightX, y);
  y += 8;
  row('Net Salary Paid', formatCurrency(payroll.net_salary), true);

  y += 14;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text('This is a system-generated payslip and does not require a signature.', pageWidth / 2, y, {
    align: 'center',
  });

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
