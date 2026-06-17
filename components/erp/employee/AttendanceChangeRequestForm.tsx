'use client';

/**
 * Attendance Change Request Form Component
 */

import { useActionState, useEffect, useState } from 'react';
import { createAttendanceChangeRequestAction } from '@/actions/erp/attendance-change-requests';
import Button from '@/components/ui/Button';
import DatePicker from '@/components/ui/DatePicker';
import { toast } from 'react-hot-toast';

interface AttendanceChangeRequestFormProps {
  employeeId: number;
  initialDate?: string;
  initialIsMissed?: boolean;
}

export default function AttendanceChangeRequestForm({
  employeeId,
  initialDate,
  initialIsMissed,
}: AttendanceChangeRequestFormProps) {
  const [requestedStatus, setRequestedStatus] = useState(initialIsMissed ? 'present' : '');
  const [selectedDate, setSelectedDate] = useState(initialDate || '');
  const [showClockOutTime, setShowClockOutTime] = useState(initialIsMissed || false);
  const [clockOutTime, setClockOutTime] = useState('');

  // Handle updates to props
  useEffect(() => {
    if (initialDate) {
      setSelectedDate(initialDate);
    }
    if (initialIsMissed) {
      setRequestedStatus('present');
      setShowClockOutTime(true);
    }
  }, [initialDate, initialIsMissed]);

  const handleFormAction = async (prevState: any, formData: FormData) => {
    // Validate date selection
    if (!selectedDate) {
      return { success: false, error: 'Please select a date' };
    }

    // Add the selected date to form data
    formData.set('request_date', selectedDate);

    // Validate and set clock_out_time
    if (showClockOutTime) {
      if (!clockOutTime) {
        return { success: false, error: 'Please specify the clock-out time' };
      }
      formData.set('clock_out_time', clockOutTime);
    } else {
      formData.delete('clock_out_time');
    }

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
        setRequestedStatus('');
        setSelectedDate('');
        setClockOutTime('');
        setShowClockOutTime(false);
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
      {/* Request Date - Calendar Picker */}
      <DatePicker
        label='Date'
        value={selectedDate}
        onChange={setSelectedDate}
        maxDate={new Date().toISOString().split('T')[0]}
        required
        placeholder='Select the date for attendance change'
        helperText='Select the date for attendance change'
      />

      {/* Hidden field for form submission */}
      <input type='hidden' name='request_date' value={selectedDate} />

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
          value={requestedStatus}
          onChange={(e) => setRequestedStatus(e.target.value)}
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

      {/* Leave Type (only shown when Paid Leave is selected) */}
      {requestedStatus === 'paid-leave' && (
        <div>
          <label
            htmlFor='leave_type'
            className='block text-sm font-medium mb-2'
          >
            Leave Type <span className='text-red-500'>*</span>
          </label>
          <select
            id='leave_type'
            name='leave_type'
            required
            className='w-full px-4 py-2 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--cyan)] text-white'
          >
            <option value=''>Select leave type</option>
            <option value='sick'>Sick Leave</option>
            <option value='casual'>Casual Leave</option>
            <option value='floater'>Floater Leave</option>
            <option value='earned'>Earned Leave (OT)</option>
            <option value='maternity'>Maternity Leave</option>
            <option value='paternity'>Paternity Leave</option>
            <option value='other'>Other</option>
          </select>
          <p className='text-xs text-gray-500 mt-1'>
            Select which leave balance to deduct from
          </p>
        </div>
      )}

      {/* Option to specify clock-out time */}
      {requestedStatus === 'present' && (
        <div className='flex items-center gap-2 py-1'>
          <input
            type='checkbox'
            id='specify_clock_out'
            checked={showClockOutTime}
            onChange={(e) => {
              setShowClockOutTime(e.target.checked);
              if (!e.target.checked) setClockOutTime('');
            }}
            className='w-4 h-4 rounded border-gray-700 bg-[#0a0a0a] text-[var(--cyan)] focus:ring-[var(--cyan)]'
          />
          <label
            htmlFor='specify_clock_out'
            className='text-sm text-gray-300 select-none cursor-pointer'
          >
            Specify Clock-Out Time (For Missed Clock-Out)
          </label>
        </div>
      )}

      {/* Clock-Out Time Input */}
      {requestedStatus === 'present' && showClockOutTime && (
        <div>
          <label
            htmlFor='clock_out_time'
            className='block text-sm font-medium mb-2'
          >
            Requested Clock-Out Time <span className='text-red-500'>*</span>
          </label>
          <input
            type='time'
            id='clock_out_time'
            name='clock_out_time'
            required={showClockOutTime}
            value={clockOutTime}
            onChange={(e) => setClockOutTime(e.target.value)}
            className='w-full px-4 py-2 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--cyan)] text-white'
          />
          <p className='text-xs text-gray-500 mt-1'>
            Enter the time you clocked out (e.g., 18:00)
          </p>
        </div>
      )}

      {/* Reason */}
      <div>
        <label htmlFor='reason' className='block text-sm font-medium mb-2'>
          Reason <span className='text-red-500'>*</span>
        </label>
        <textarea
          id='reason'
          name='reason'
          required
          minLength={5}
          rows={4}
          placeholder='Explain why you need this change (min 5 characters)'
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
        </p>
      </div>

      {/* Submit Button */}
      <Button type='submit' variant='primary' className='w-full'>
        Submit Request
      </Button>
    </form>
  );
}
