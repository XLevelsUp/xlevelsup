'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Table, TableRow, TableCell } from './Table';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import ClientFinanceForm from './ClientFinanceForm';
import type { ClientTransaction } from '@/types/finance';
import {
  formatCurrency,
  formatDisplayDate,
  getCurrentMonth,
} from '@/lib/erp/utils';
import toast from 'react-hot-toast';
import { deleteClientTransactionAction } from '@/actions/erp/client-finances';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '@/types/finance';

interface ClientFinanceManagerProps {
  transactions: ClientTransaction[];
  clients: string[];
  initialMonth: string;
  initialType?: string;
  initialClient?: string;
  initialCategory?: string;
  initialStatus?: string;
  summary: {
    totalIncome: number;
    totalExpense: number;
    netProfit: number;
    pendingIncome: number;
    pendingExpense: number;
    advanceIncome: number;
    pendingFromAdvance: number;
  };
}

export default function ClientFinanceManager({
  transactions,
  clients,
  initialMonth,
  initialType,
  initialClient,
  initialCategory,
  initialStatus,
  summary,
}: ClientFinanceManagerProps) {
  const router = useRouter();
  const [showAddModal, setShowAddModal] = useState(false);
  const [month, setMonth] = useState(initialMonth);
  const [type, setType] = useState(initialType || '');
  const [client, setClient] = useState(initialClient || '');
  const [category, setCategory] = useState(initialCategory || '');
  const [status, setStatus] = useState(initialStatus || '');

  const handleFilterChange = () => {
    const params = new URLSearchParams();
    params.set('month', month);
    if (type) params.set('type', type);
    if (client) params.set('client', client);
    if (category) params.set('category', category);
    if (status) params.set('status', status);

    router.push(`/erp/client-finances?${params.toString()}`);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return;

    const result = await deleteClientTransactionAction(id);
    if (result.success) {
      toast.success('Transaction deleted successfully');
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to delete transaction');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      completed: 'bg-green-500/20 text-green-400',
      advance: 'bg-blue-500/20 text-blue-400',
      pending: 'bg-yellow-500/20 text-yellow-400',
      cancelled: 'bg-gray-500/20 text-gray-400',
    };
    const labels: Record<string, string> = {
      completed: '✓ Full Payment',
      advance: '◑ Advance',
      pending: '⏳ Pending',
      cancelled: '✕ Cancelled',
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${styles[status] || 'bg-gray-500/20 text-gray-400'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const allCategories = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];

  return (
    <div>
      {/* Header */}
      <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8'>
        <div>
          <h1 className='text-3xl font-bold gradient-text'>Client Finances</h1>
          <p className='text-gray-400 mt-2'>
            Track income and expenses for client projects
          </p>
        </div>
        <Button
          variant='primary'
          onClick={() => setShowAddModal(true)}
          className='whitespace-nowrap'
        >
          + Add Transaction
        </Button>
      </div>

      {/* Filters */}
      <div className='glass p-4 rounded-lg mb-6'>
        <div className='grid grid-cols-1 md:grid-cols-6 gap-4'>
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
            <label className='block text-sm font-medium mb-2'>Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
            >
              <option value=''>All Types</option>
              <option value='income'>Income</option>
              <option value='expense'>Expense</option>
            </select>
          </div>
          <div>
            <label className='block text-sm font-medium mb-2'>Client</label>
            <select
              value={client}
              onChange={(e) => setClient(e.target.value)}
              className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
            >
              <option value=''>All Clients</option>
              {clients.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
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
              {allCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className='block text-sm font-medium mb-2'>Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
            >
              <option value=''>All Statuses</option>
              <option value='completed'>Full Payment</option>
              <option value='advance'>Advance Received</option>
              <option value='pending'>Pending</option>
              <option value='cancelled'>Cancelled</option>
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

      {/* Financial Summary */}
      <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-4'>
        <div className='glass p-4 rounded-lg'>
          <p className='text-sm text-gray-400'>Total Income</p>
          <p className='text-2xl font-bold text-green-400 mt-1'>
            {formatCurrency(summary.totalIncome)}
          </p>
          <p className='text-xs text-gray-500 mt-1'>Full payments received</p>
        </div>
        <div className='glass p-4 rounded-lg'>
          <p className='text-sm text-gray-400'>Total Expense</p>
          <p className='text-2xl font-bold text-red-400 mt-1'>
            {formatCurrency(summary.totalExpense)}
          </p>
          <p className='text-xs text-gray-500 mt-1'>Completed expenses</p>
        </div>
        <div className='glass p-4 rounded-lg'>
          <p className='text-sm text-gray-400'>Net Profit</p>
          <p
            className={`text-2xl font-bold mt-1 ${summary.netProfit >= 0 ? 'text-cyan' : 'text-red-400'}`}
          >
            {formatCurrency(summary.netProfit)}
          </p>
          <p className='text-xs text-gray-500 mt-1'>Income − Expense</p>
        </div>
        <div className='glass p-4 rounded-lg'>
          <p className='text-sm text-gray-400'>Pending Income</p>
          <p className='text-2xl font-bold text-yellow-400 mt-1'>
            {formatCurrency(summary.pendingIncome)}
          </p>
          <p className='text-xs text-gray-500 mt-1'>Awaiting full payment</p>
        </div>
      </div>

      {/* Advance Tracking Summary */}
      {(summary.advanceIncome > 0 || summary.pendingFromAdvance > 0) && (
        <div className='grid grid-cols-2 gap-4 mb-6'>
          <div className='glass p-4 rounded-lg border border-blue-500/20'>
            <p className='text-sm text-gray-400'>Advance Received</p>
            <p className='text-2xl font-bold text-blue-400 mt-1'>
              {formatCurrency(summary.advanceIncome)}
            </p>
            <p className='text-xs text-gray-500 mt-1'>Partial payments collected</p>
          </div>
          <div className='glass p-4 rounded-lg border border-orange-500/20'>
            <p className='text-sm text-gray-400'>Balance Pending (from Advances)</p>
            <p className='text-2xl font-bold text-orange-400 mt-1'>
              {formatCurrency(summary.pendingFromAdvance)}
            </p>
            <p className='text-xs text-gray-500 mt-1'>Remaining after advance</p>
          </div>
        </div>
      )}

      {!summary.advanceIncome && !summary.pendingFromAdvance && (
        <div className='mb-6' />
      )}

      {/* Transactions Table */}
      <div className='glass rounded-lg overflow-hidden'>
        {transactions.length === 0 ? (
          <div className='text-center py-12'>
            <p className='text-gray-400 mb-4'>No transactions found</p>
            <Button variant='primary' onClick={() => setShowAddModal(true)}>
              Add First Transaction
            </Button>
          </div>
        ) : (
          <Table
            headers={[
              'Date',
              'Type',
              'Client / Ref #',
              'Project',
              'Category',
              'Amount',
              'Advance',
              'Pending',
              'Status',
              'Actions',
            ]}
          >
            {transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>
                  {formatDisplayDate(transaction.transaction_date)}
                </TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      transaction.type === 'income'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {transaction.type === 'income' ? '↑ Income' : '↓ Expense'}
                  </span>
                </TableCell>
                <TableCell>
                  <div className='font-medium text-white'>
                    {transaction.client_name}
                  </div>
                  {(transaction.reference_number || transaction.invoice_number) && (
                    <div className='text-xs text-gray-500 font-mono'>
                      {transaction.reference_number || transaction.invoice_number}
                    </div>
                  )}
                </TableCell>
                <TableCell className='max-w-xs truncate'>
                  {transaction.project_name || '-'}
                </TableCell>
                <TableCell>
                  <span className='px-2 py-1 rounded text-xs font-medium bg-purple/20 text-purple'>
                    {transaction.category}
                  </span>
                </TableCell>
                <TableCell>
                  <div
                    className={`font-bold ${
                      transaction.type === 'income'
                        ? 'text-green-400'
                        : 'text-red-400'
                    }`}
                  >
                    {transaction.type === 'income' ? '+' : '-'}
                    {formatCurrency(transaction.amount)}
                  </div>
                  {transaction.payment_mode && (
                    <div className='text-xs text-gray-500'>
                      {transaction.payment_mode}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {transaction.advance_amount ? (
                    <span className='text-blue-400 font-semibold'>
                      {formatCurrency(transaction.advance_amount)}
                    </span>
                  ) : (
                    <span className='text-gray-600'>—</span>
                  )}
                </TableCell>
                <TableCell>
                  {transaction.pending_amount != null && transaction.pending_amount > 0 ? (
                    <span className='text-orange-400 font-semibold'>
                      {formatCurrency(transaction.pending_amount)}
                    </span>
                  ) : transaction.payment_status === 'pending' ? (
                    <span className='text-yellow-400 font-semibold'>
                      {formatCurrency(transaction.amount)}
                    </span>
                  ) : (
                    <span className='text-gray-600'>—</span>
                  )}
                </TableCell>
                <TableCell>
                  {getStatusBadge(transaction.payment_status)}
                </TableCell>
                <TableCell>
                  <button
                    onClick={() => handleDelete(transaction.id)}
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
        title='Add Transaction'
      >
        <ClientFinanceForm
          clients={clients}
          onSuccess={() => {
            setShowAddModal(false);
            router.refresh();
          }}
        />
      </Modal>
    </div>
  );
}
