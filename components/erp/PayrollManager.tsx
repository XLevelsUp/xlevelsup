'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Table, TableRow, TableCell } from './Table';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import type { PayrollWithEmployee } from '@/types/erp';
import { formatCurrency, getMonthName } from '@/lib/erp/utils';
import toast from 'react-hot-toast';
import {
  generatePayrollAction,
  updatePayrollStatusAction,
  deletePayrollAction,
} from '@/actions/erp/payroll';

interface PayrollManagerProps {
  payroll: PayrollWithEmployee[];
  initialMonth: string;
  initialStatus?: string;
}

export default function PayrollManager({
  payroll,
  initialMonth,
  initialStatus,
}: PayrollManagerProps) {
  const router = useRouter();
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [month, setMonth] = useState(initialMonth);
  const [status, setStatus] = useState(initialStatus || '');
  const [generating, setGenerating] = useState(false);

  const handleFilterChange = () => {
    const params = new URLSearchParams();
    params.set('month', month);
    if (status) params.set('status', status);

    router.push(`/erp/payroll?${params.toString()}`);
  };

  const handleGenerate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setGenerating(true);

    const formData = new FormData(e.currentTarget);
    const result = await generatePayrollAction(formData);

    setGenerating(false);

    if (result.success) {
      toast.success(
        `Payroll generated! ${result.payroll.generated} records created, ${result.payroll.skipped} skipped`,
        { duration: 3000 },
      );
      setShowGenerateModal(false);
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to generate payroll');
    }
  };

  const handleStatusChange = async (
    id: number,
    newStatus: 'draft' | 'approved' | 'paid',
  ) => {
    const result = await updatePayrollStatusAction(id, newStatus);
    if (result.success) {
      toast.success('Status updated successfully');
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to update status');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this payroll record?'))
      return;

    const result = await deletePayrollAction(id);
    if (result.success) {
      toast.success('Payroll deleted successfully');
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to delete payroll');
    }
  };

  const totalPayable = payroll.reduce((sum, p) => sum + p.net_salary, 0);

  return (
    <div>
      {/* Header */}
      <div className='flex items-center justify-between mb-8'>
        <div>
          <h1 className='text-3xl font-bold gradient-text'>
            Payroll Management
          </h1>
          <p className='text-gray-400 mt-2'>
            Generate and manage employee salaries
          </p>
        </div>
        <Button variant='primary' onClick={() => setShowGenerateModal(true)}>
          Generate Payroll
        </Button>
      </div>

      {/* Filters */}
      <div className='glass p-4 rounded-lg mb-6'>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <div>
            <label className='block text-sm font-medium mb-2'>Month</label>
            <input
              type='month'
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
            />
          </div>
          <div>
            <label className='block text-sm font-medium mb-2'>Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
            >
              <option value=''>All Statuses</option>
              <option value='draft'>Draft</option>
              <option value='approved'>Approved</option>
              <option value='paid'>Paid</option>
            </select>
          </div>
          <div className='flex items-end'>
            <Button
              variant='secondary'
              onClick={handleFilterChange}
              className='w-full'
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-6'>
        <div className='glass p-4 rounded-lg'>
          <p className='text-sm text-gray-400'>Total Records</p>
          <p className='text-2xl font-bold text-white mt-1'>{payroll.length}</p>
        </div>
        <div className='glass p-4 rounded-lg'>
          <p className='text-sm text-gray-400'>Total Payable</p>
          <p className='text-2xl font-bold text-cyan mt-1'>
            {formatCurrency(totalPayable)}
          </p>
        </div>
        <div className='glass p-4 rounded-lg'>
          <p className='text-sm text-gray-400'>Approved</p>
          <p className='text-2xl font-bold text-green-400 mt-1'>
            {payroll.filter((p) => p.status === 'approved').length}
          </p>
        </div>
        <div className='glass p-4 rounded-lg'>
          <p className='text-sm text-gray-400'>Paid</p>
          <p className='text-2xl font-bold text-blue-400 mt-1'>
            {payroll.filter((p) => p.status === 'paid').length}
          </p>
        </div>
      </div>

      {/* Payroll Table */}
      <div className='glass rounded-lg overflow-hidden'>
        {payroll.length === 0 ? (
          <div className='text-center py-12'>
            <p className='text-gray-400 mb-4'>No payroll records found</p>
            <Button
              variant='primary'
              onClick={() => setShowGenerateModal(true)}
            >
              Generate Payroll
            </Button>
          </div>
        ) : (
          <Table
            headers={[
              'Employee',
              'Department',
              'Working Days',
              'Payable Days',
              'Gross Salary',
              'Net Salary',
              'Status',
              'Actions',
            ]}
          >
            {payroll.map((record) => (
              <TableRow key={record.id}>
                <TableCell>
                  <div className='font-medium text-white'>
                    {record.employee_name}
                  </div>
                  <div className='text-xs text-gray-500'>
                    {record.employee_role}
                  </div>
                </TableCell>
                <TableCell>{record.employee_department}</TableCell>
                <TableCell>{record.total_working_days}</TableCell>
                <TableCell>
                  {record.payable_days.toFixed(1)}
                  <div className='text-xs text-gray-500'>
                    P:{record.present_days} H:{record.half_days} L:
                    {record.paid_leave_days}
                  </div>
                </TableCell>
                <TableCell>{formatCurrency(record.gross_salary)}</TableCell>
                <TableCell>
                  <div className='font-medium text-white'>
                    {formatCurrency(record.net_salary)}
                  </div>
                  {(record.bonus > 0 || record.deduction > 0) && (
                    <div className='text-xs text-gray-500'>
                      {record.bonus > 0 && `+${formatCurrency(record.bonus)} `}
                      {record.deduction > 0 &&
                        `-${formatCurrency(record.deduction)}`}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <select
                    value={record.status}
                    onChange={(e) =>
                      handleStatusChange(record.id, e.target.value as any)
                    }
                    className='px-2 py-1 rounded text-xs font-medium bg-dark-800 border border-gray-700 text-white'
                  >
                    <option value='draft'>Draft</option>
                    <option value='approved'>Approved</option>
                    <option value='paid'>Paid</option>
                  </select>
                </TableCell>
                <TableCell>
                  <button
                    onClick={() => handleDelete(record.id)}
                    className='text-red-400 hover:text-red-300 transition-colors text-sm'
                  >
                    Delete
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </Table>
        )}
      </div>

      {/* Generate Modal */}
      <Modal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        title='Generate Payroll'
      >
        <form onSubmit={handleGenerate} className='space-y-4'>
          <p className='text-gray-300'>
            This will generate payroll records for all active employees for the
            selected month. Existing records will be skipped.
          </p>
          <div>
            <label className='block text-sm font-medium mb-2'>Month *</label>
            <input
              type='month'
              name='month'
              required
              defaultValue={month}
              className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
            />
          </div>
          <Button
            type='submit'
            variant='primary'
            className='w-full'
            disabled={generating}
          >
            {generating ? 'Generating...' : 'Generate Payroll'}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
