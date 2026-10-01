'use client';

/**
 * List of the logged-in employee's own payslips, each opening a short-lived
 * signed URL in a new tab — same open-in-new-tab pattern FinanceManager
 * already uses for the admin-side view of the same files
 * (handleViewReceipt), just driven by the employee-scoped action instead of
 * the admin one.
 */

import { useState } from 'react';
import toast from 'react-hot-toast';
import { getMyPayslipUrlAction } from '@/actions/erp/employee-payslips';
import type { EmployeePayslip } from '@/lib/erp/payroll';
import { formatCurrency, getMonthName } from '@/lib/erp/utils';

export default function PayslipList({ payslips }: { payslips: EmployeePayslip[] }) {
  const [openingId, setOpeningId] = useState<number | null>(null);

  const handleView = async (payslip: EmployeePayslip) => {
    setOpeningId(payslip.id);
    try {
      const { url } = await getMyPayslipUrlAction(payslip.id);
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        toast.error('Could not open payslip — it may have been removed.');
      }
    } finally {
      setOpeningId(null);
    }
  };

  if (payslips.length === 0) {
    return (
      <div className='bg-[#1a1a1a] border border-gray-800 rounded-lg p-8 text-center'>
        <p className='text-gray-400'>
          No payslips yet. One appears here for each month your salary is marked paid.
        </p>
      </div>
    );
  }

  return (
    <div className='bg-[#1a1a1a] border border-gray-800 rounded-lg divide-y divide-gray-800'>
      {payslips.map((payslip) => (
        <div key={payslip.id} className='flex items-center justify-between gap-4 p-5'>
          <div>
            <p className='text-white font-semibold'>{getMonthName(payslip.month)}</p>
            <p className='text-sm text-gray-400 mt-0.5'>
              Net Salary: {formatCurrency(payslip.net_salary)}
            </p>
            {payslip.breakdown && (
              <div className='text-xs text-gray-500 mt-1 space-y-0.5'>
                <p>
                  Gross: {formatCurrency(payslip.breakdown.gross_salary)} · Basic:{' '}
                  {formatCurrency(payslip.breakdown.basic_salary)} · HRA:{' '}
                  {formatCurrency(payslip.breakdown.hra)} · Special:{' '}
                  {formatCurrency(payslip.breakdown.special_allowance)} · Other:{' '}
                  {formatCurrency(payslip.breakdown.other_allowance)}
                </p>
                {payslip.breakdown.total_deductions > 0 && (
                  <p>
                    Deductions: {formatCurrency(payslip.breakdown.total_deductions)}
                    {payslip.breakdown.pf_deduction > 0 && ` (PF ${formatCurrency(payslip.breakdown.pf_deduction)})`}
                    {payslip.breakdown.esi_deduction > 0 && ` (ESI ${formatCurrency(payslip.breakdown.esi_deduction)})`}
                    {payslip.breakdown.professional_tax_deduction > 0 &&
                      ` (PT ${formatCurrency(payslip.breakdown.professional_tax_deduction)})`}
                    {payslip.breakdown.tds_deduction > 0 && ` (TDS ${formatCurrency(payslip.breakdown.tds_deduction)})`}
                    {payslip.breakdown.other_structured_deduction > 0 &&
                      ` (Other ${formatCurrency(payslip.breakdown.other_structured_deduction)})`}
                  </p>
                )}
              </div>
            )}
          </div>
          <button
            type='button'
            onClick={() => handleView(payslip)}
            disabled={openingId === payslip.id}
            className='px-4 py-2 rounded-lg text-sm font-semibold bg-[var(--cyan)]/10 text-[var(--cyan)] border border-[var(--cyan)]/30 hover:bg-[var(--cyan)]/20 transition-colors disabled:opacity-50 whitespace-nowrap'
          >
            {openingId === payslip.id ? 'Opening…' : '📄 View / Download'}
          </button>
        </div>
      ))}
    </div>
  );
}
