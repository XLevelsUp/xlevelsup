'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Table, TableRow, TableCell } from './Table';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import ExpenseForm from './ExpenseForm';
import type { Expense, Employee } from '@/types/erp';
import { formatCurrency, formatDisplayDate } from '@/lib/erp/utils';
import toast from 'react-hot-toast';
import {
  updateExpenseStatusAction,
  deleteExpenseAction,
  markExpenseReimbursedAction,
} from '@/actions/erp/expenses';

interface ExpenseManagerProps {
  expenses: Expense[];
  categories: string[];
  employees: Employee[];
  initialMonth: string;
  initialStatus?: string;
  initialCategory?: string;
  initialPaidBy?: string;
}

export default function ExpenseManager({
  expenses,
  categories,
  employees,
  initialMonth,
  initialStatus,
  initialCategory,
  initialPaidBy,
}: ExpenseManagerProps) {
  const router = useRouter();
  const [showAddModal, setShowAddModal] = useState(false);
  const [month, setMonth] = useState(initialMonth);
  const [status, setStatus] = useState(initialStatus || '');
  const [category, setCategory] = useState(initialCategory || '');
  const [paidBy, setPaidBy] = useState(initialPaidBy || '');

  const handleFilterChange = () => {
    const params = new URLSearchParams();
    params.set('month', month);
    if (status) params.set('status', status);
    if (category) params.set('category', category);
    if (paidBy) params.set('paidBy', paidBy);

    router.push(`/erp/expenses?${params.toString()}`);
  };

  const handleStatusChange = async (id: number, newStatus: any) => {
    const result = await updateExpenseStatusAction(id, newStatus);
    if (result.success) {
      toast.success('Status updated successfully');
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to update status');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;

    const result = await deleteExpenseAction(id);
    if (result.success) {
      toast.success('Expense deleted successfully');
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to delete expense');
    }
  };

  const handleMarkReimbursed = async (id: number) => {
    if (!confirm('Mark this expense as reimbursed?')) return;

    const result = await markExpenseReimbursedAction(id);
    if (result.success) {
      toast.success('Expense marked as reimbursed');
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to mark as reimbursed');
    }
  };

  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
  const pendingAmount = expenses
    .filter((e) => e.status === 'pending')
    .reduce((sum, e) => sum + e.amount, 0);
  const reimbursableAmount = expenses
    .filter(
      (e) =>
        (e.status === 'approved' || e.status === 'paid') &&
        !e.reimbursed &&
        e.paid_by !== 'Company',
    )
    .reduce((sum, e) => sum + e.amount, 0);

  return (
    <div>
      {/* Header */}
      <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8'>
        <div>
          <h1 className='text-3xl font-bold gradient-text'>Expense Tracking</h1>
          <p className='text-gray-400 mt-2'>
            Manage and track all business expenses
          </p>
        </div>
        <Button 
          variant='primary' 
          onClick={() => setShowAddModal(true)}
          className='whitespace-nowrap'
        >
          + Add Expense
        </Button>
      </div>

      {/* Filters */}
      <div className='glass p-4 rounded-lg mb-6'>
        <div className='grid grid-cols-1 md:grid-cols-5 gap-4'>
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
              <option value='pending'>Pending</option>
              <option value='approved'>Approved</option>
              <option value='rejected'>Rejected</option>
              <option value='paid'>Paid</option>
            </select>
          </div>
          <div>
            <label className='block text-sm font-medium mb-2'>Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
            >
              <option value=''>All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className='block text-sm font-medium mb-2'>Paid By</label>
            <select
              value={paidBy}
              onChange={(e) => setPaidBy(e.target.value)}
              className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
            >
              <option value=''>All Employees</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.name}>
                  {employee.name}
                </option>
              ))}
              <option value='Company'>Company</option>
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
      <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-6'>
        <div className='glass p-4 rounded-lg'>
          <p className='text-sm text-gray-400'>Total Amount</p>
          <p className='text-2xl font-bold text-white mt-1'>
            {formatCurrency(totalAmount)}
          </p>
        </div>
        <div className='glass p-4 rounded-lg'>
          <p className='text-sm text-gray-400'>Pending</p>
          <p className='text-2xl font-bold text-yellow-400 mt-1'>
            {formatCurrency(pendingAmount)}
          </p>
        </div>
        <div className='glass p-4 rounded-lg'>
          <p className='text-sm text-gray-400'>To Reimburse</p>
          <p className='text-2xl font-bold text-orange-400 mt-1'>
            {formatCurrency(reimbursableAmount)}
          </p>
        </div>
        <div className='glass p-4 rounded-lg'>
          <p className='text-sm text-gray-400'>Total Count</p>
          <p className='text-2xl font-bold text-cyan mt-1'>{expenses.length}</p>
        </div>
      </div>

      {/* Expense Table */}
      <div className='glass rounded-lg overflow-hidden'>
        {expenses.length === 0 ? (
          <div className='text-center py-12'>
            <p className='text-gray-400 mb-4'>No expenses found</p>
            <Button variant='primary' onClick={() => setShowAddModal(true)}>
              Add First Expense
            </Button>
          </div>
        ) : (
          <Table
            headers={[
              'Date',
              'Category',
              'Amount',
              'Paid By',
              'Description',
              'Status',
              'Reimbursement',
              'Actions',
            ]}
          >
            {expenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell>{formatDisplayDate(expense.date)}</TableCell>
                <TableCell>
                  <span className='px-2 py-1 rounded text-xs font-medium bg-purple/20 text-purple'>
                    {expense.category}
                  </span>
                </TableCell>
                <TableCell>
                  <div className='font-medium text-white'>
                    {formatCurrency(expense.amount)}
                  </div>
                  <div className='text-xs text-gray-500'>
                    {expense.payment_mode}
                  </div>
                </TableCell>
                <TableCell>{expense.paid_by}</TableCell>
                <TableCell className='max-w-xs truncate'>
                  {expense.description}
                </TableCell>
                <TableCell>
                  <select
                    value={expense.status}
                    onChange={(e) =>
                      handleStatusChange(expense.id, e.target.value)
                    }
                    className='px-2 py-1 rounded text-xs font-medium bg-dark-800 border border-gray-700 text-white'
                  >
                    <option value='pending'>Pending</option>
                    <option value='approved'>Approved</option>
                    <option value='rejected'>Rejected</option>
                    <option value='paid'>Paid</option>
                  </select>
                </TableCell>
                <TableCell>
                  {expense.reimbursed ? (
                    <span className='px-2 py-1 rounded text-xs font-medium bg-green-500/20 text-green-400'>
                      Reimbursed
                    </span>
                  ) : expense.paid_by === 'Company' ? (
                    <span className='text-xs text-gray-500'>N/A</span>
                  ) : expense.status === 'approved' ||
                    expense.status === 'paid' ? (
                    <button
                      onClick={() => handleMarkReimbursed(expense.id)}
                      className='px-2 py-1 rounded text-xs font-medium bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 transition-colors'
                    >
                      Mark Reimbursed
                    </button>
                  ) : (
                    <span className='text-xs text-gray-500'>Pending</span>
                  )}
                </TableCell>
                <TableCell>
                  <button
                    onClick={() => handleDelete(expense.id)}
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

      {/* Add Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title='Add Expense'
      >
        <ExpenseForm
          categories={categories}
          employees={employees}
          onSuccess={() => {
            setShowAddModal(false);
            router.refresh();
          }}
        />
      </Modal>
    </div>
  );
}
