'use client';

/**
 * Attendance Change Requests List Component
 * Shows employee's own change requests history
 */

import type { AttendanceChangeRequest } from '@/types/erp';

interface AttendanceChangeRequestsListProps {
  requests: AttendanceChangeRequest[];
}

export default function AttendanceChangeRequestsList({
  requests,
}: AttendanceChangeRequestsListProps) {
  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string }> = {
      pending: { bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
      approved: { bg: 'bg-green-500/20', text: 'text-green-400' },
      rejected: { bg: 'bg-red-500/20', text: 'text-red-400' },
    };

    const badge = badges[status] || badges.pending;

    return (
      <span
        className={`px-2 py-1 rounded text-xs font-medium ${badge.bg} ${badge.text}`}
      >
        {status.toUpperCase()}
      </span>
    );
  };

  const getAttendanceStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string }> = {
      present: { bg: 'bg-green-500/20', text: 'text-green-400' },
      absent: { bg: 'bg-red-500/20', text: 'text-red-400' },
      'half-day': { bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
      'paid-leave': { bg: 'bg-blue-500/20', text: 'text-blue-400' },
      'unpaid-leave': { bg: 'bg-purple-500/20', text: 'text-purple-400' },
      holiday: { bg: 'bg-cyan-500/20', text: 'text-cyan-400' },
    };

    const badge = badges[status] || badges.present;

    return (
      <span
        className={`px-2 py-1 rounded text-xs font-medium ${badge.bg} ${badge.text}`}
      >
        {status.replace('-', ' ').toUpperCase()}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (requests.length === 0) {
    return (
      <div className='text-center py-12 text-gray-400'>
        <p>No change requests found</p>
        <p className='text-sm mt-2'>
          Submit a request using the form on the right
        </p>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {requests.map((request) => (
        <div
          key={request.id}
          className='bg-[#0a0a0a] border border-gray-800 rounded-lg p-4 hover:border-gray-700 transition-colors'
        >
          {/* Header */}
          <div className='flex items-start justify-between mb-3'>
            <div>
              <div className='flex items-center gap-2 mb-1'>
                <span className='text-sm font-medium'>
                  {formatDate(request.request_date)}
                </span>
                {getStatusBadge(request.status)}
              </div>
              <p className='text-xs text-gray-500'>
                Requested on {formatDateTime(request.created_at)}
              </p>
            </div>
          </div>

          {/* Change Details */}
          <div className='space-y-2 mb-3'>
            <div className='flex items-center gap-2 text-sm'>
              {request.current_status ? (
                <>
                  {getAttendanceStatusBadge(request.current_status)}
                  <span className='text-gray-500'>→</span>
                  {getAttendanceStatusBadge(request.requested_status)}
                </>
              ) : (
                <>
                  <span className='text-gray-500'>New Record:</span>
                  {getAttendanceStatusBadge(request.requested_status)}
                </>
              )}
            </div>

            <div className='bg-gray-900/50 rounded p-2'>
              <p className='text-xs text-gray-400 font-medium mb-1'>Reason:</p>
              <p className='text-sm text-gray-300'>{request.reason}</p>
            </div>
          </div>

          {/* Review Info */}
          {request.status !== 'pending' && (
            <div className='pt-3 border-t border-gray-800'>
              <div className='flex items-start gap-2'>
                <div
                  className={`w-2 h-2 rounded-full mt-1.5 ${
                    request.status === 'approved'
                      ? 'bg-green-500'
                      : 'bg-red-500'
                  }`}
                />
                <div className='flex-1'>
                  <p className='text-xs text-gray-500'>
                    {request.status === 'approved' ? 'Approved' : 'Rejected'} on{' '}
                    {request.reviewed_at && formatDateTime(request.reviewed_at)}
                  </p>
                  {request.review_comments && (
                    <p className='text-sm text-gray-400 mt-1'>
                      {request.review_comments}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
