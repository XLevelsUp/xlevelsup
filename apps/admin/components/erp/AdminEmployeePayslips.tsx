'use client';

/**
 * An employee's payslip history, from the admin side (Employees page →
 * Payslips). Lists every payroll month on record, not only paid ones: a paid
 * month opens its finalized PDF, any other month opens a watermarked preview
 * rendered from its current figures (see getPayslipForPayrollAction).
 *
 * The employee self-service list (components/erp/employee/PayslipList.tsx)
 * deliberately stays paid-only — an employee never sees a draft.
 */

import { useState } from 'react';
import toast from 'react-hot-toast';
import { regeneratePayslipAction } from '@/actions/erp/payroll';
import type { EmployeePayrollHistoryRow } from '@/lib/erp/payroll';
import { formatCurrency } from '@/lib/erp/utils';
import { openPayrollPayslip } from './PayrollManager';
import SensitiveValue from './SensitiveValue';

const STATUS_BADGE: Record<EmployeePayrollHistoryRow['status'], { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-gray-500/10 text-gray-300 border-gray-500/30' },
  approved: { label: 'Approved', className: 'bg-green-500/10 text-green-300 border-green-500/30' },
  paid: { label: 'Finalized', className: 'bg-blue-500/10 text-blue-300 border-blue-500/30' },
};

function shortMonth(month: string): string {
  const [year, m] = month.split('-').map(Number);
  return new Date(year, m - 1, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export default function AdminEmployeePayslips({
  history,
  onChanged,
}: {
  history: EmployeePayrollHistoryRow[];
  /** Called after a PDF is regenerated, so the parent can reload the list. */
  onChanged?: () => void;
}) {
  const [busyId, setBusyId] = useState<number | null>(null);

  const handleView = async (row: EmployeePayrollHistoryRow) => {
    setBusyId(row.payroll_id);
    try {
      await openPayrollPayslip(row.payroll_id);
    } finally {
      setBusyId(null);
    }
  };

  const handleRegenerate = async (row: EmployeePayrollHistoryRow) => {
    setBusyId(row.payroll_id);
    try {
      const result = await regeneratePayslipAction(row.payroll_id);
      if (result.success) {
        toast.success(`Payslip PDF regenerated for ${shortMonth(row.month)}`);
        onChanged?.();
      } else {
        toast.error(result.error || 'Failed to regenerate payslip');
      }
    } finally {
      setBusyId(null);
    }
  };

  if (history.length === 0) {
    return (
      <p className='text-gray-400 text-sm text-center py-8'>
        No payroll generated for this employee yet. Generate payroll from the Payroll page.
      </p>
    );
  }

  return (
    <div className='overflow-x-auto'>
      <table className='w-full text-sm'>
        <thead>
          <tr className='text-left text-xs uppercase tracking-wider text-gray-500 border-b border-gray-800'>
            <th className='py-2 pr-3 font-medium'>Month</th>
            <th className='py-2 px-3 font-medium text-right'>Gross</th>
            <th className='py-2 px-3 font-medium text-right'>Deductions</th>
            <th className='py-2 px-3 font-medium text-right'>Net</th>
            <th className='py-2 px-3 font-medium'>Status</th>
            <th className='py-2 pl-3 font-medium text-right'>Action</th>
          </tr>
        </thead>
        <tbody className='divide-y divide-gray-800'>
          {history.map((row) => {
            const badge = STATUS_BADGE[row.status];
            const busy = busyId === row.payroll_id;
            const isPaid = row.status === 'paid';
            return (
              <tr key={row.payroll_id}>
                <td className='py-2.5 pr-3 text-white font-medium whitespace-nowrap'>{shortMonth(row.month)}</td>
                <td className='py-2.5 px-3 text-right text-gray-300 whitespace-nowrap'>
                  <SensitiveValue>{formatCurrency(row.total_earnings)}</SensitiveValue>
                </td>
                <td className='py-2.5 px-3 text-right text-gray-300 whitespace-nowrap'>
                  <SensitiveValue>{formatCurrency(row.total_deductions)}</SensitiveValue>
                </td>
                <td className='py-2.5 px-3 text-right text-white font-semibold whitespace-nowrap'>
                  <SensitiveValue>{formatCurrency(row.net_salary)}</SensitiveValue>
                </td>
                <td className='py-2.5 px-3'>
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-xs font-medium border whitespace-nowrap ${badge.className}`}
                  >
                    {badge.label}
                  </span>
                </td>
                <td className='py-2.5 pl-3 text-right whitespace-nowrap'>
                  {isPaid && !row.has_payslip ? (
                    <button
                      type='button'
                      onClick={() => handleRegenerate(row)}
                      disabled={busy}
                      title='No PDF was stored when this month was paid — create it from the frozen figures'
                      className='text-cyan hover:text-cyan/80 text-xs font-medium transition-colors disabled:opacity-50'
                    >
                      {busy ? 'Working…' : 'Create PDF'}
                    </button>
                  ) : (
                    <div className='flex justify-end gap-3'>
                      <button
                        type='button'
                        onClick={() => handleView(row)}
                        disabled={busy}
                        className='text-cyan hover:text-cyan/80 text-xs font-medium transition-colors disabled:opacity-50'
                      >
                        {busy ? 'Working…' : isPaid ? 'View' : 'Preview'}
                      </button>
                      {isPaid && (
                        <button
                          type='button'
                          onClick={() => handleRegenerate(row)}
                          disabled={busy}
                          title='Re-render the PDF in the current layout. Figures and payment date are unchanged.'
                          className='text-gray-400 hover:text-white text-xs transition-colors disabled:opacity-50'
                        >
                          Regenerate PDF
                        </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className='text-xs text-gray-500 mt-3'>
        Gross includes any bonus. Deductions include loss of pay, statutory and other deductions. Finalized
        (paid) months are frozen — later salary changes never alter them.
      </p>
    </div>
  );
}
