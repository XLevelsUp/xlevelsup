'use client';

/**
 * Leave Request List Component (Employee Portal)
 */

import { useState } from 'react';
import type { LeaveRequest } from '@/types/erp';
import { cancelLeaveRequestAction } from '@/actions/erp/leave-requests';
import { toast } from 'react-hot-toast';

interface LeaveRequestListProps {
  requests: LeaveRequest[];
  employeeId: number;
}

export default function LeaveRequestList({
  requests,
  employeeId,
}: LeaveRequestListProps) {
  const [cancelling, setCancelling] = useState<number | null>(null);

  const handleCancel = async (requestId: number) => {
    if (!confirm('Are you sure you want to cancel this leave request?')) {
      return;
    }

    setCancelling(requestId);
    const result = await cancelLeaveRequestAction(requestId, employeeId);
    setCancelling(null);

    if (result.success) {
      toast.success('Leave request cancelled');
      window.location.reload();
    } else {
      toast.error(result.error || 'Failed to cancel request');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
      approved: 'bg-green-500/20 text-green-500 border-green-500/30',
      rejected: 'bg-red-500/20 text-red-500 border-red-500/30',
      cancelled: 'bg-gray-500/20 text-gray-500 border-gray-500/30',
    };

    return badges[status as keyof typeof badges] || badges.pending;
  };

  const getLeaveTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      sick: 'Sick Leave',
      casual: 'Casual Leave',
      floater: 'Floater Leave',
      earned: 'Earned Leave (OT)',
      unpaid: 'Unpaid Leave',
      maternity: 'Maternity Leave',
      paternity: 'Paternity Leave',
      wfh: 'Work From Home',
      other: 'Other',
      // Legacy support
      annual: 'Casual Leave', // Migrated from annual
    };
    return labels[type] || type;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (requests.length === 0) {
    return (
      <div className='bg-[#1a1a1a] border border-gray-800 rounded-lg p-8 text-center'>
        <p className='text-gray-400'>No leave requests yet</p>
        <p className='text-sm text-gray-500 mt-2'>
          Submit your first leave request using the form
        </p>
      </div>
    );
  }

  return (
    <div className='bg-[#1a1a1a] border border-gray-800 rounded-lg'>
      <div className='p-6 border-b border-gray-800'>
        <h2 className='text-xl font-bold text-white'>Your Leave Requests</h2>
        <p className='text-sm text-gray-400 mt-1'>
          Total: {requests.length} request{requests.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className='divide-y divide-gray-800'>
        {requests.map((request) => (
          <div
            key={request.id}
            className='p-6 hover:bg-gray-900/30 transition-colors'
          >
            <div className='flex items-start justify-between mb-3'>
              <div>
                <div className='flex items-center gap-3 mb-2'>
                  <h3 className='font-semibold text-white'>
                    {getLeaveTypeLabel(request.leave_type)}
                  </h3>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded border ${getStatusBadge(
                      request.status,
                    )}`}
                  >
                    {request.status.toUpperCase()}
                  </span>
                </div>
                <p className='text-sm text-gray-400'>
                  {request.is_half_day
                    ? formatDate(request.start_date)
                    : `${formatDate(request.start_date)} - ${formatDate(request.end_date)}`}
                  <span className='ml-2 text-gray-500'>
                    {request.is_half_day
                      ? `(Half Day — ${request.half_day_period === 'first_half' ? 'Morning' : 'Afternoon'})`
                      : `(${request.total_days} day${request.total_days !== 1 ? 's' : ''})`}
                  </span>
                </p>
              </div>

              {/* Cancel Button */}
              {(request.status === 'pending' ||
                request.status === 'approved') && (
                <button
                  onClick={() => handleCancel(request.id)}
                  disabled={cancelling === request.id}
                  className='px-3 py-1 text-sm bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded border border-red-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                >
                  {cancelling === request.id ? 'Cancelling...' : 'Cancel'}
                </button>
              )}
            </div>

            {/* Reason */}
            <p className='text-sm text-gray-300 mb-3'>{request.reason}</p>

            {/* Review Comments */}
            {request.review_comments && (
              <div className='mt-3 p-3 bg-gray-900/50 rounded border border-gray-700'>
                <p className='text-xs text-gray-400 mb-1'>Review Comments:</p>
                <p className='text-sm text-gray-300'>
                  {request.review_comments}
                </p>
                {request.reviewed_at && (
                  <p className='text-xs text-gray-500 mt-1'>
                    Reviewed on {formatDate(request.reviewed_at)}
                  </p>
                )}
              </div>
            )}

            {/* Request Date */}
            <p className='text-xs text-gray-500 mt-3'>
              Requested on {formatDate(request.created_at)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
