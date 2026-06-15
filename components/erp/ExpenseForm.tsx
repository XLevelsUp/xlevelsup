'use client';

import { useFormStatus } from 'react-dom';
import { useState, useEffect, useActionState } from 'react';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import { createExpenseAction } from '@/actions/erp/expenses';
import type { Employee } from '@/types/erp';

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type='submit'
      variant='primary'
      className='w-full'
      disabled={pending}
    >
      {pending ? 'Saving...' : 'Save Expense'}
    </Button>
  );
}

interface ExpenseFormProps {
  categories: string[];
  employees: Employee[];
  onSuccess?: () => void;
}

export default function ExpenseForm({
  categories,
  employees,
  onSuccess,
}: ExpenseFormProps) {
  const [state, formAction] = useActionState(
    async (prevState: any, formData: FormData) => {
      return await createExpenseAction(formData);
    },
    { success: false },
  );

  useEffect(() => {
    if (state.success) {
      toast.success('Expense saved successfully!', {
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

  return (
    <form action={formAction} className='space-y-4'>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div>
          <label htmlFor='date' className='block text-sm font-medium mb-2'>
            Date *
          </label>
          <input
            type='date'
            id='date'
            name='date'
            required
            defaultValue={today}
            max={today}
            className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
          />
        </div>

        <div>
          <label htmlFor='category' className='block text-sm font-medium mb-2'>
            Category *
          </label>
          {categories.length > 0 ? (
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
              <option value='Travel'>Travel</option>
              <option value='Office Supplies'>Office Supplies</option>
              <option value='Equipment'>Equipment</option>
              <option value='Software'>Software</option>
              <option value='Utilities'>Utilities</option>
              <option value='Marketing'>Marketing</option>
              <option value='Other'>Other</option>
            </select>
          ) : (
            <input
              type='text'
              id='category'
              name='category'
              required
              placeholder='e.g., Travel, Office Supplies'
              className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
            />
          )}
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
            placeholder='1000.00'
            className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
          />
        </div>

        <div>
          <label htmlFor='paid_by' className='block text-sm font-medium mb-2'>
            Paid By *
          </label>
          <select
            id='paid_by'
            name='paid_by'
            required
            className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
          >
            <option value=''>Select Employee</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.name}>
                {employee.name} ({employee.employee_id})
              </option>
            ))}
            <option value='Company'>Company</option>
          </select>
        </div>

        <div>
          <label
            htmlFor='payment_mode'
            className='block text-sm font-medium mb-2'
          >
            Payment Mode *
          </label>
          <select
            id='payment_mode'
            name='payment_mode'
            required
            className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
          >
            <option value=''>Select Payment Mode</option>
            <option value='Cash'>Cash</option>
            <option value='Bank Transfer'>Bank Transfer</option>
            <option value='Credit Card'>Credit Card</option>
            <option value='Debit Card'>Debit Card</option>
            <option value='UPI'>UPI</option>
            <option value='Other'>Other</option>
          </select>
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
          placeholder='Brief description of the expense...'
          className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
        />
      </div>

      <div className='pt-4'>
        <SubmitButton />
      </div>
    </form>
  );
}
