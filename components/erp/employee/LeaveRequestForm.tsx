'use client';

/**
 * Leave Request Form Component (Employee Portal)
 */

import { useActionState, useEffect, useState } from 'react';
import { createLeaveRequestAction } from '@/actions/erp/leave-requests';
import Button from '@/components/ui/Button';
import { toast } from 'react-hot-toast';
import type { LeaveBalance } from '@/types/erp';

interface LeaveRequestFormProps {
  employeeId: number;
  leaveBalances: LeaveBalance[];
}

export default function LeaveRequestForm({
  employeeId,
  leaveBalances,
}: LeaveRequestFormProps) {
  const [state, formAction, isPending] = useActionState(
    createLeaveRequestAction.bind(null, employeeId),
    null,
  );

  useEffect(() => {
    if (state?.success) {
      toast.success('Leave request submitted successfully!');
      // Reset form
      const form = document.querySelector('form') as HTMLFormElement;
      form?.reset();
      setSelectedLeaveType(''); // Reset selected leave type
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  const [selectedLeaveType, setSelectedLeaveType] = useState<string>('');

  // Get balance for selected leave type
  const getLeaveBalance = (leaveType: string) => {
    const balance = leaveBalances.find((b) => b.leave_type === leaveType);
    return balance || null;
  };

  const selectedBalance = selectedLeaveType
    ? getLeaveBalance(selectedLeaveType)
    : null;

  // Calculate accrued casual leave for current month
  const calculateAccruedCasualLeave = () => {
    const currentMonth = new Date().getMonth() + 1; // 1-12
    return currentMonth * 1.5; // 1.5 days per month
  };

  return (
    <div className='bg-[#1a1a1a] border border-gray-800 rounded-lg p-6'>
      <h2 className='text-xl font-bold text-white mb-4'>New Leave Request</h2>

      <form action={formAction} className='space-y-4'>
        {/* Leave Type */}
        <div>
          <label
            htmlFor='leave_type'
            className='block text-sm font-medium mb-2 text-gray-300'
          >
            Leave Type <span className='text-red-500'>*</span>
          </label>
          <select
            id='leave_type'
            name='leave_type'
            required
            disabled={isPending}
            value={selectedLeaveType}
            onChange={(e) => setSelectedLeaveType(e.target.value)}
            className='w-full px-4 py-2 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--cyan)] text-white'
          >
            <option value=''>Select leave type</option>
            <option value='casual'>Casual Leave</option>
            <option value='floater'>Floater Leave</option>
            <option value='sick'>Sick Leave</option>
            <option value='earned'>Earned Leave</option>
            <option value='unpaid'>Unpaid Leave</option>
            <option value='maternity'>Maternity Leave</option>
            <option value='paternity'>Paternity Leave</option>
          </select>

          {/* Show available balance for selected leave type */}
          {selectedBalance &&
            ['casual', 'floater', 'sick', 'earned'].includes(
              selectedLeaveType,
            ) && (
              <div className='mt-2 p-3 bg-gray-900/50 border border-gray-700 rounded-lg'>
                <div className='flex items-center justify-between text-sm'>
                  <span className='text-gray-400'>Available:</span>
                  <span
                    className={`font-semibold ${
                      selectedBalance.remaining_days > 5
                        ? 'text-green-400'
                        : selectedBalance.remaining_days > 0
                          ? 'text-yellow-400'
                          : 'text-red-400'
                    }`}
                  >
                    {selectedBalance.remaining_days} /{' '}
                    {selectedBalance.total_allocated} days
                  </span>
                </div>
                <div className='flex items-center justify-between text-xs mt-1'>
                  <span className='text-gray-500'>Used:</span>
                  <span className='text-gray-400'>
                    {selectedBalance.used_days} days
                  </span>
                </div>
                {selectedLeaveType === 'casual' && (
                  <div className='mt-2 pt-2 border-t border-gray-700'>
                    <div className='flex items-center justify-between text-xs'>
                      <span className='text-gray-500'>Accrued so far:</span>
                      <span className='text-cyan-400 font-medium'>
                        {calculateAccruedCasualLeave().toFixed(1)} days
                      </span>
                    </div>
                    <div className='flex items-center justify-between text-xs mt-1'>
                      <span className='text-gray-500'>Available now:</span>
                      <span className='text-cyan-400 font-medium'>
                        {Math.max(
                          0,
                          calculateAccruedCasualLeave() -
                            selectedBalance.used_days,
                        ).toFixed(1)}{' '}
                        days
                      </span>
                    </div>
                    <p className='mt-1 text-xs text-gray-500'>
                      💡 1.5 days accrued per month
                    </p>
                  </div>
                )}
                {selectedBalance.remaining_days === 0 && (
                  <p className='mt-2 text-xs text-red-400'>
                    ⚠️ No leave balance available
                  </p>
                )}
              </div>
            )}

          {selectedLeaveType === 'unpaid' && (
            <p className='mt-2 text-xs text-gray-400'>
              💡 Unpaid leave has no balance limit
            </p>
          )}

          {(selectedLeaveType === 'maternity' ||
            selectedLeaveType === 'paternity') && (
            <p className='mt-2 text-xs text-gray-400'>
              💡 Subject to company policy and approval
            </p>
          )}
        </div>

        {/* Start Date */}
        <div>
          <label
            htmlFor='start_date'
            className='block text-sm font-medium mb-2 text-gray-300'
          >
            Start Date <span className='text-red-500'>*</span>
          </label>
          <input
            type='date'
            id='start_date'
            name='start_date'
            required
            min={today}
            disabled={isPending}
            className='w-full px-4 py-2 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--cyan)] text-white'
          />
        </div>

        {/* End Date */}
        <div>
          <label
            htmlFor='end_date'
            className='block text-sm font-medium mb-2 text-gray-300'
          >
            End Date <span className='text-red-500'>*</span>
          </label>
          <input
            type='date'
            id='end_date'
            name='end_date'
            required
            min={today}
            disabled={isPending}
            className='w-full px-4 py-2 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--cyan)] text-white'
          />
        </div>

        {/* Reason */}
        <div>
          <label
            htmlFor='reason'
            className='block text-sm font-medium mb-2 text-gray-300'
          >
            Reason <span className='text-red-500'>*</span>
          </label>
          <textarea
            id='reason'
            name='reason'
            required
            minLength={10}
            rows={4}
            placeholder='Please provide a reason for your leave request (minimum 10 characters)'
            disabled={isPending}
            className='w-full px-4 py-2 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--cyan)] text-white placeholder-gray-500 resize-none'
          />
        </div>

        {/* Submit Button */}
        <Button
          type='submit'
          variant='primary'
          className='w-full'
          disabled={isPending}
        >
          {isPending ? 'Submitting...' : 'Submit Request'}
        </Button>
      </form>
    </div>
  );
}
