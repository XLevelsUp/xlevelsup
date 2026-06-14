'use client';

/**
 * Attendance Change Request Form Component
 */

import { useActionState, useEffect } from 'react';
import { createAttendanceChangeRequestAction } from '@/actions/erp/attendance-change-requests';
import Button from '@/components/ui/Button';
import { toast } from 'react-hot-toast';

interface AttendanceChangeRequestFormProps {
  employeeId: number;
}

export default function AttendanceChangeRequestForm({
  employeeId,
}: AttendanceChangeRequestFormProps) {
  const handleFormAction = async (prevState: any, formData: FormData) => {
    return await createAttendanceChangeRequestAction(
      employeeId,
      prevState,
      formData,
    );
  };

  const [state, formAction] = useActionState(handleFormAction, null);

  useEffect(() => {
    if (state?.success) {
      toast.success('Change request submitted successfully!');
      // Reset form
      const form = document.getElementById(
        'change-request-form',
      ) as HTMLFormElement;
      if (form) {
        form.reset();
      }
      // Reload page to show updated data
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <form id='change-request-form' action={formAction} className='space-y-4'>
      {/* Request Date */}
      <div>
        <label
          htmlFor='request_date'
          className='block text-sm font-medium mb-2'
        >
          Date <span className='text-red-500'>*</span>
        </label>
        <input
          type='date'
          id='request_date'
          name='request_date'
          required
          max={new Date().toISOString().split('T')[0]}
          className='w-full px-4 py-2 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--cyan)] text-white'
        />
        <p className='text-xs text-gray-500 mt-1'>
          Select the date for attendance change
        </p>
      </div>

      {/* Hidden fields for modification requests (populated by table) */}
      <input type='hidden' id='current_status' name='current_status' />
      <input type='hidden' id='attendance_id' name='attendance_id' />

      {/* Requested Status */}
      <div>
        <label
          htmlFor='requested_status'
          className='block text-sm font-medium mb-2'
        >
          Requested Status <span className='text-red-500'>*</span>
        </label>
        <select
          id='requested_status'
          name='requested_status'
          required
          className='w-full px-4 py-2 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--cyan)] text-white'
        >
          <option value=''>Select status</option>
          <option value='present'>Present</option>
          <option value='absent'>Absent</option>
          <option value='half-day'>Half Day</option>
          <option value='paid-leave'>Paid Leave</option>
          <option value='unpaid-leave'>Unpaid Leave</option>
          <option value='holiday'>Holiday</option>
        </select>
      </div>

      {/* Reason */}
      <div>
        <label htmlFor='reason' className='block text-sm font-medium mb-2'>
          Reason <span className='text-red-500'>*</span>
        </label>
        <textarea
          id='reason'
          name='reason'
          required
          minLength={20}
          rows={4}
          placeholder='Explain why you need this change (min 20 characters)'
          className='w-full px-4 py-2 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--cyan)] text-white placeholder-gray-500 resize-none'
        />
        <p className='text-xs text-gray-500 mt-1'>
          Be specific about why this change is needed
        </p>
      </div>

      {/* Info Box */}
      <div className='bg-blue-900/20 border border-blue-700/30 rounded-lg p-3'>
        <p className='text-xs text-blue-300'>
          <strong>Note:</strong> Your request will be reviewed by HR/Admin.
          You'll be notified once it's approved or rejected.
        </p>
      </div>

      {/* Submit Button */}
      <Button type='submit' variant='primary' className='w-full'>
        Submit Request
      </Button>
    </form>
  );
}
