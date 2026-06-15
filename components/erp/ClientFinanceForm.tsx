'use client';

import { useFormStatus } from 'react-dom';
import { useEffect, useActionState, useState } from 'react';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import { createClientTransactionAction } from '@/actions/erp/client-finances';
import {
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
  PAYMENT_MODES,
} from '@/types/finance';
import type { TransactionType } from '@/types/finance';

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type='submit'
      variant='primary'
      className='w-full'
      disabled={pending}
    >
      {pending ? 'Saving...' : 'Save Transaction'}
    </Button>
  );
}

interface ClientFinanceFormProps {
  clients: string[];
  onSuccess?: () => void;
}

export default function ClientFinanceForm({
  clients,
  onSuccess,
}: ClientFinanceFormProps) {
  const [state, formAction] = useActionState(
    async (prevState: any, formData: FormData) => {
      return await createClientTransactionAction(formData);
    },
    { success: false },
  );

  const [transactionType, setTransactionType] =
    useState<TransactionType>('income');

  useEffect(() => {
    if (state.success) {
      toast.success('Transaction saved successfully!', {
        duration: 2000,
        position: 'top-center',
      });
      onSuccess?.();
    } else if (state.error) {
      toast.error(state.error, {
        duration: 3000,
        position: 'top-center',
      });
    }
  }, [state, onSuccess]);

  const today = new Date().toISOString().split('T')[0];
  const categories =
    transactionType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <form action={formAction} className='space-y-4'>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div>
          <label
            htmlFor='transaction_date'
            className='block text-sm font-medium mb-2'
          >
            Date *
          </label>
          <input
            type='date'
            id='transaction_date'
            name='transaction_date'
            required
            defaultValue={today}
            max={today}
            className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
          />
        </div>

        <div>
          <label htmlFor='type' className='block text-sm font-medium mb-2'>
            Type *
          </label>
          <select
            id='type'
            name='type'
            required
            value={transactionType}
            onChange={(e) =>
              setTransactionType(e.target.value as TransactionType)
            }
            className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
          >
            <option value='income'>Income</option>
            <option value='expense'>Expense</option>
          </select>
        </div>

        <div>
          <label htmlFor='amount' className='block text-sm font-medium mb-2'>
            Amount (₹) *
          </label>
          <input
            type='number'
            id='amount'
            name='amount'
            required
            min='0'
            step='0.01'
            placeholder='10000.00'
            className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
          />
        </div>

        <div>
          <label
            htmlFor='client_name'
            className='block text-sm font-medium mb-2'
          >
            Client Name *
          </label>
          <input
            type='text'
            id='client_name'
            name='client_name'
            required
            list='clients-list'
            placeholder='Client or Company Name'
            className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
          />
          <datalist id='clients-list'>
            {clients.map((client) => (
              <option key={client} value={client} />
            ))}
          </datalist>
        </div>

        <div>
          <label
            htmlFor='project_name'
            className='block text-sm font-medium mb-2'
          >
            Project Name
          </label>
          <input
            type='text'
            id='project_name'
            name='project_name'
            placeholder='Optional project name'
            className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
          />
        </div>

        <div>
          <label htmlFor='category' className='block text-sm font-medium mb-2'>
            Category *
          </label>
          <select
            id='category'
            name='category'
            required
            className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
          >
            <option value=''>Select Category</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor='payment_mode'
            className='block text-sm font-medium mb-2'
          >
            Payment Mode
          </label>
          <select
            id='payment_mode'
            name='payment_mode'
            className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
          >
            <option value=''>Select Payment Mode</option>
            {PAYMENT_MODES.map((mode) => (
              <option key={mode} value={mode}>
                {mode}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor='payment_status'
            className='block text-sm font-medium mb-2'
          >
            Payment Status *
          </label>
          <select
            id='payment_status'
            name='payment_status'
            required
            defaultValue='completed'
            className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
          >
            <option value='pending'>Pending</option>
            <option value='completed'>Completed</option>
            <option value='failed'>Failed</option>
            <option value='cancelled'>Cancelled</option>
          </select>
        </div>

        <div>
          <label
            htmlFor='invoice_number'
            className='block text-sm font-medium mb-2'
          >
            Invoice Number
          </label>
          <input
            type='text'
            id='invoice_number'
            name='invoice_number'
            placeholder='INV-2024-001'
            className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
          />
        </div>
      </div>

      <div>
        <label htmlFor='description' className='block text-sm font-medium mb-2'>
          Description *
        </label>
        <textarea
          id='description'
          name='description'
          required
          rows={3}
          placeholder='Brief description of the transaction...'
          className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
        />
      </div>

      <div>
        <label htmlFor='notes' className='block text-sm font-medium mb-2'>
          Notes
        </label>
        <textarea
          id='notes'
          name='notes'
          rows={2}
          placeholder='Additional notes (optional)...'
          className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
        />
      </div>

      <div className='pt-4'>
        <SubmitButton />
      </div>
    </form>
  );
}
