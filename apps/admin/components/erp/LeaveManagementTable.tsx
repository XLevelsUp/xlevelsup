'use client';

/**
 * Leave Management Table Component (Admin)
 */

import { useState } from 'react';
import type { LeaveRequestWithEmployee } from '@/types/erp';
import { reviewLeaveRequestAction } from '@/actions/erp/leave-requests';
import { batchUpdateEarnedLeaveAction } from '@/actions/erp/earned-leave';
import { toast } from 'react-hot-toast';
import Modal from '@/components/ui/Modal';
import LeaveCalendar from './LeaveCalendar';
import { Table, TableRow, TableCell } from './Table';
import { PageHeader, StatusChips, SECONDARY_ACTION_CLASS, ROW_ACTION_CLASS } from './PageChrome';
import { formatDateSpan } from '@/lib/erp/utils';

interface LeaveManagementTableProps {
  requests: LeaveRequestWithEmployee[];
}

// Helper functions - shared between components
const getLeaveTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    sick: 'Sick',
    casual: 'Casual',
    floater: 'Floater',
    earned: 'Earned',
    unpaid: 'Unpaid',
    maternity: 'Maternity',
    paternity: 'Paternity',
    wfh: 'Work From Home',
    other: 'Other',
    emergency: 'Emergency',
    // Legacy support
    annual: 'Casual', // Migrated from annual
  };
  return labels[type] || type;
};

const halfDayLabel = (period?: string | null) => (period === 'first_half' ? 'Morning' : 'Afternoon');

export default function LeaveManagementTable({
  requests,
}: LeaveManagementTableProps) {
  const [selectedRequest, setSelectedRequest] =
    useState<LeaveRequestWithEmployee | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [processing, setProcessing] = useState(false);
  const [isAccruing, setIsAccruing] = useState(false);

  const filteredRequests = requests.filter(
    (req) => filterStatus === 'all' || req.status === filterStatus,
  );

  const handleReview = async (
    status: 'approved' | 'rejected',
    comments?: string,
  ) => {
    if (!selectedRequest) return;

    setProcessing(true);

    const result = await reviewLeaveRequestAction(
      selectedRequest.id,
      status,
      comments || undefined,
    );

    setProcessing(false);

    if (result.success) {
      toast.success(`Leave request ${status}.`);
      setSelectedRequest(null);
      window.location.reload();
    } else {
      toast.error(result.error || 'Failed to review request');
    }
  };

  const handleAccrueEarnedLeaves = async () => {
    if (
      !confirm(
        'Recalculate earned leave for every employee across all attendance history? Each weekend or company holiday worked for 6+ logged hours earns 1 day. Used earned leave is not affected.'
      )
    ) {
      return;
    }

    setIsAccruing(true);
    const result = await batchUpdateEarnedLeaveAction();
    setIsAccruing(false);

    if (result.success) {
      toast.success(result.message || 'Earned leaves updated successfully!');
      window.location.reload();
    } else {
      toast.error(result.error || 'Failed to update earned leaves.');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: 'bg-yellow-500/20 text-yellow-500',
      approved: 'bg-green-500/20 text-green-500',
      rejected: 'bg-red-500/20 text-red-500',
      cancelled: 'bg-gray-500/20 text-gray-500',
    };

    return badges[status as keyof typeof badges] || badges.pending;
  };

  const countOf = (status: string) => requests.filter((r) => r.status === status).length;

  const renderStatus = (request: LeaveRequestWithEmployee) => (
    <span className={`inline-block px-2 py-1 text-xs font-medium rounded whitespace-nowrap ${getStatusBadge(request.status)}`}>
      {request.status.toUpperCase()}
    </span>
  );

  const renderAction = (request: LeaveRequestWithEmployee) => (
    <button
      type='button'
      onClick={() => setSelectedRequest(request)}
      className={
        request.status === 'pending'
          ? `${ROW_ACTION_CLASS} bg-[var(--cyan)] text-black border-[var(--cyan)] hover:opacity-80`
          : `${ROW_ACTION_CLASS} border-gray-700 text-gray-300 hover:text-white hover:border-gray-500`
      }
    >
      {request.status === 'pending' ? 'Review' : 'View details'}
    </button>
  );

  return (
    <div className='@container pb-20'>
      <PageHeader
        title='Leave Requests'
        description='Approve or reject time off, and see who’s away on the calendar.'
        actions={
          <button
            type='button'
            onClick={handleAccrueEarnedLeaves}
            disabled={isAccruing}
            className={`${SECONDARY_ACTION_CLASS} gap-2`}
          >
            {isAccruing && (
              <svg className='animate-spin h-3.5 w-3.5' fill='none' viewBox='0 0 24 24' aria-hidden='true'>
                <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
                <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'></path>
              </svg>
            )}
            {isAccruing ? 'Recalculating…' : 'Recalculate earned leave'}
          </button>
        }
      />

      {/* View switch, then — for the list — the status filter. They wrap
          onto separate rows on a phone rather than squeezing together. */}
      <div className='flex flex-wrap items-center justify-between gap-3 mb-4 select-none'>
        <div role='group' aria-label='View' className='flex items-center gap-1 p-1 bg-dark-900 border border-gray-800 rounded-lg'>
          {(['list', 'calendar'] as const).map((mode) => (
            <button
              key={mode}
              type='button'
              onClick={() => setViewMode(mode)}
              aria-pressed={viewMode === mode}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all border focus-visible:outline-2 focus-visible:outline-[var(--cyan)] ${
                viewMode === mode ? 'bg-cyan/10 text-cyan border-cyan/25' : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              {mode === 'list' ? 'List' : 'Calendar'}
            </button>
          ))}
        </div>
        {viewMode === 'list' && (
          <StatusChips
            label='Filter leave requests by status'
            value={filterStatus}
            onChange={setFilterStatus}
            options={[
              { value: 'pending', label: 'Pending', count: countOf('pending'), tone: 'pending' },
              { value: 'approved', label: 'Approved', count: countOf('approved'), tone: 'approved' },
              { value: 'rejected', label: 'Rejected', count: countOf('rejected'), tone: 'rejected' },
              { value: 'cancelled', label: 'Cancelled', count: countOf('cancelled'), tone: 'cancelled' },
              { value: 'all', label: 'All', count: requests.length, tone: 'all' },
            ]}
          />
        )}
      </div>

      {viewMode === 'calendar' ? (
        <LeaveCalendar requests={requests} />
      ) : (
        <div className='glass rounded-lg overflow-hidden'>
          {filteredRequests.length === 0 ? (
            <div className='text-center py-14 px-4'>
              <p className='text-gray-300 font-medium'>
                {filterStatus === 'pending' ? 'Nothing waiting for review' : 'No leave requests with this status'}
              </p>
              {filterStatus !== 'all' && (
                <p className='text-sm text-gray-500 mt-1'>Pick another status to see the rest.</p>
              )}
            </div>
          ) : (
            <>
              {/* Wide containers: the table. */}
              <div className='hidden @min-[44rem]:block'>
                <Table compact headers={['Employee', 'Leave Type', 'Dates', 'Days', 'Status', 'Action']}>
                  {filteredRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className='min-w-40'>
                        <p className='font-medium text-white'>{request.employee_name}</p>
                        <p className='text-xs text-gray-500'>
                          {request.employee_id_display}
                          {request.employee_department && <> · {request.employee_department}</>}
                        </p>
                      </TableCell>
                      <TableCell className='text-gray-300 whitespace-nowrap'>{getLeaveTypeLabel(request.leave_type)}</TableCell>
                      <TableCell className='whitespace-nowrap'>
                        <span className='text-gray-300'>{formatDateSpan(request.start_date, request.end_date)}</span>
                        {request.is_half_day && (
                          <p className='text-cyan-400 text-xs'>Half day · {halfDayLabel(request.half_day_period)}</p>
                        )}
                      </TableCell>
                      <TableCell className='text-gray-300 tabular-nums'>{request.total_days}</TableCell>
                      <TableCell>{renderStatus(request)}</TableCell>
                      <TableCell>{renderAction(request)}</TableCell>
                    </TableRow>
                  ))}
                </Table>
              </div>

              {/* Narrow containers: one card per request. */}
              <ul className='@min-[44rem]:hidden'>
                {filteredRequests.map((request) => (
                  <li key={request.id} className='p-4 min-w-0 border-b border-gray-800/70 last:border-b-0'>
                    <div className='flex items-start justify-between gap-3'>
                      <div className='min-w-0'>
                        <p className='font-semibold text-white [overflow-wrap:anywhere]'>{request.employee_name}</p>
                        <p className='text-xs text-gray-500'>
                          {request.employee_id_display}
                          {request.employee_department && <> · {request.employee_department}</>}
                        </p>
                      </div>
                      <div className='shrink-0'>{renderStatus(request)}</div>
                    </div>
                    <p className='mt-3 text-sm text-gray-200'>
                      {formatDateSpan(request.start_date, request.end_date)}
                      <span className='text-gray-500'>
                        {' '}· {request.is_half_day ? `Half day, ${halfDayLabel(request.half_day_period).toLowerCase()}` : `${request.total_days} day${Number(request.total_days) === 1 ? '' : 's'}`}
                      </span>
                    </p>
                    <div className='mt-3 flex items-center justify-between gap-3'>
                      <span className='text-xs text-gray-400'>{getLeaveTypeLabel(request.leave_type)}</span>
                      {renderAction(request)}
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      {/* Review Modal */}
      {selectedRequest && (
        <ReviewModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onReview={handleReview}
          processing={processing}
        />
      )}
    </div>
  );
}

interface ReviewModalProps {
  request: LeaveRequestWithEmployee;
  onClose: () => void;
  onReview: (status: 'approved' | 'rejected', comments?: string) => void;
  processing: boolean;
}

function ReviewModal({
  request,
  onClose,
  onReview,
  processing,
}: ReviewModalProps) {
  const [comments, setComments] = useState('');

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Modal isOpen onClose={onClose} title='Review Leave Request'>
      <div className='space-y-4'>
        {/* Employee Info */}
        <div className='bg-gray-900/50 rounded-lg p-4'>
          <h3 className='font-semibold text-white mb-2'>
            Employee Information
          </h3>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm *:min-w-0 [overflow-wrap:anywhere]'>
            <div>
              <span className='text-gray-400'>Name:</span>
              <span className='text-white ml-2'>{request.employee_name}</span>
            </div>
            <div>
              <span className='text-gray-400'>ID:</span>
              <span className='text-white ml-2'>
                {request.employee_id_display}
              </span>
            </div>
            <div className='sm:col-span-2'>
              <span className='text-gray-400'>Department:</span>
              <span className='text-white ml-2'>
                {request.employee_department}
              </span>
            </div>
          </div>
        </div>

        {/* Leave Details */}
        <div className='bg-gray-900/50 rounded-lg p-4'>
          <h3 className='font-semibold text-white mb-2'>Leave Details</h3>
          <div className='space-y-2 text-sm'>
            <div>
              <span className='text-gray-400'>Type:</span>
              <span className='text-white ml-2'>
                {getLeaveTypeLabel(request.leave_type)}
              </span>
            </div>
            <div>
              <span className='text-gray-400'>Duration:</span>
              <span className='text-white ml-2'>
                {request.is_half_day
                  ? `${formatDate(request.start_date)} (Half Day — ${
                      request.half_day_period === 'first_half' ? 'Morning' : 'Afternoon'
                    })`
                  : `${formatDate(request.start_date)} to ${formatDate(request.end_date)}`}
              </span>
            </div>
            <div>
              <span className='text-gray-400'>Total Days:</span>
              <span className='text-white ml-2'>{request.total_days} days</span>
            </div>
            <div>
              <span className='text-gray-400'>Reason:</span>
              <p className='text-white mt-1 [overflow-wrap:anywhere]'>{request.reason}</p>
            </div>
          </div>
        </div>

        {/* Review Comments */}
        {request.status === 'pending' && (
          <div>
            <label className='block text-sm font-medium text-gray-300 mb-2'>
              Review Comments (Optional)
            </label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={3}
              className='w-full px-4 py-2 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--cyan)] text-white resize-none'
              placeholder='Add your comments here...'
              disabled={processing}
            />
          </div>
        )}

        {/* Action Buttons */}
        {request.status === 'pending' ? (
          <>
            <div className='flex gap-3'>
              <button
                onClick={() => onReview('approved', comments)}
                disabled={processing}
                className='flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
              >
                {processing ? 'Processing...' : 'Approve'}
              </button>
              <button
                onClick={() => onReview('rejected', comments)}
                disabled={processing}
                className='flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
              >
                {processing ? 'Processing...' : 'Reject'}
              </button>
            </div>
          </>
        ) : (
          <div className='bg-gray-900/50 rounded-lg p-4'>
            <p className='text-sm text-gray-400'>
              This request has been {request.status}
              {request.reviewer_name && ` by ${request.reviewer_name}`}
              {request.reviewed_at && ` on ${formatDate(request.reviewed_at)}`}
            </p>
            {request.review_comments && (
              <p className='text-sm text-white mt-2'>
                {request.review_comments}
              </p>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
