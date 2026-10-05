'use client';

/**
 * Attendance Change Requests Management Table
 * Admin/HR view – review, approve, reject requests (status-change + regularisation)
 */

import { useState } from 'react';
import type { AttendanceChangeRequestWithEmployee } from '@/types/erp';
import { REGULARISATION_TYPE_LABELS } from '@/types/erp';
import Modal from '@/components/ui/Modal';
import { Table, TableRow, TableCell } from './Table';
import { StatusChips, ROW_ACTION_CLASS } from './PageChrome';
import AttendanceChangeRequestReviewForm from './AttendanceChangeRequestReviewForm';

interface AttendanceChangeRequestsManagementTableProps {
  requests: AttendanceChangeRequestWithEmployee[];
}

export default function AttendanceChangeRequestsManagementTable({
  requests,
}: AttendanceChangeRequestsManagementTableProps) {
  const [filter, setFilter] = useState<string>('pending');
  const [selectedRequest, setSelectedRequest] =
    useState<AttendanceChangeRequestWithEmployee | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const filteredRequests = requests.filter((request) => {
    if (filter === 'all') return true;
    return request.status === filter;
  });

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string }> = {
      pending: { bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
      approved: { bg: 'bg-green-500/20', text: 'text-green-400' },
      rejected: { bg: 'bg-red-500/20', text: 'text-red-400' },
    };
    const badge = badges[status] || badges.pending;
    return (
      <span className={`inline-block px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${badge.bg} ${badge.text}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  const getTypeBadge = (requestType?: string | null) => {
    if (!requestType || requestType === 'status_change') {
      return (
        <span className="inline-block px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap bg-gray-700/50 text-gray-400">
          Status Change
        </span>
      );
    }
    const colors: Record<string, string> = {
      missed_clock_in: 'bg-blue-500/20 text-blue-300',
      missed_clock_out: 'bg-orange-500/20 text-orange-300',
      missed_both: 'bg-purple-500/20 text-purple-300',
      clock_in_correction: 'bg-cyan-500/20 text-cyan-300',
      clock_out_correction: 'bg-teal-500/20 text-teal-300',
    };
    const label =
      REGULARISATION_TYPE_LABELS[requestType as keyof typeof REGULARISATION_TYPE_LABELS] ||
      requestType;
    return (
      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${colors[requestType] || 'bg-gray-700 text-gray-300'}`}>
        {label}
      </span>
    );
  };

  const getAttendanceStatusBadge = (status: string, halfDayPeriod?: string | null) => (
    <span className="inline-block px-2 py-1 rounded text-xs font-medium whitespace-nowrap bg-gray-700 text-gray-300">
      {status.replace(/[-_]/g, ' ').toUpperCase()}
      {status === 'half-day' && halfDayPeriod
        ? ` (${halfDayPeriod === 'first_half' ? 'MORNING' : 'AFTERNOON'})`
        : ''}
    </span>
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (isoString?: string | null) => {
    if (!isoString) return null;
    try {
      return new Date(isoString).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return isoString;
    }
  };

  const handleReview = (request: AttendanceChangeRequestWithEmployee) => {
    setSelectedRequest(request);
    setIsReviewModalOpen(true);
  };

  const filterCounts = {
    pending: requests.filter((r) => r.status === 'pending').length,
    approved: requests.filter((r) => r.status === 'approved').length,
    rejected: requests.filter((r) => r.status === 'rejected').length,
  };

  /**
   * One clock time in a before → after pair. A missing *requested* time
   * where a current one exists means that side isn't being changed, so it
   * reads "no change" rather than a bare "—" that looked like "remove it".
   */
  const renderTimeShift = (
    label: string,
    current: string | null | undefined,
    requested: string | null | undefined,
    accent: string,
  ) => {
    if (!current && !requested) return null;
    return (
      <div className='flex items-baseline gap-2 text-xs tabular-nums whitespace-nowrap'>
        <span className='w-7 shrink-0 text-gray-500'>{label}</span>
        {requested ? (
          <>
            <span className={current ? 'text-gray-500 line-through decoration-gray-600' : 'text-gray-600'}>
              {formatTime(current) || '—'}
            </span>
            <span aria-hidden='true' className='text-gray-600'>→</span>
            <span className={`font-semibold ${accent}`}>{formatTime(requested)}</span>
          </>
        ) : (
          <>
            <span className='text-gray-300'>{formatTime(current)}</span>
            <span className='text-gray-600'>no change</span>
          </>
        )}
      </div>
    );
  };

  /** The change being asked for — this page's whole subject, so it gets the
   * clearest treatment: old value struck through, new value in colour. */
  const renderChange = (request: AttendanceChangeRequestWithEmployee) => {
    const isRegularisation = request.request_type && request.request_type !== 'status_change';
    if (isRegularisation) {
      return (
        <div className='space-y-1'>
          {renderTimeShift('In', request.current_clock_in_time, request.requested_clock_in_time, 'text-blue-400')}
          {renderTimeShift('Out', request.current_clock_out_time, request.requested_clock_out_time, 'text-orange-400')}
        </div>
      );
    }
    return (
      <div className='flex items-center gap-1 flex-wrap'>
        {request.current_status ? (
          <>
            {getAttendanceStatusBadge(request.current_status)}
            <span aria-hidden='true' className='text-gray-500'>→</span>
            {getAttendanceStatusBadge(request.requested_status, request.half_day_period)}
          </>
        ) : (
          <>
            <span className='text-xs text-gray-500'>New:</span>
            {getAttendanceStatusBadge(request.requested_status, request.half_day_period)}
          </>
        )}
        {request.requested_status === 'paid-leave' && request.leave_type && (
          <span className='text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded'>
            {request.leave_type.toUpperCase()}
          </span>
        )}
        {request.clock_out_time && (
          <span className='text-xs bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded'>
            🕒 {request.clock_out_time.substring(0, 5)}
          </span>
        )}
      </div>
    );
  };

  const renderAction = (request: AttendanceChangeRequestWithEmployee) =>
    request.status === 'pending' ? (
      <button
        type='button'
        onClick={() => handleReview(request)}
        className={`${ROW_ACTION_CLASS} bg-[var(--cyan)] text-black border-[var(--cyan)] hover:opacity-80`}
      >
        Review
      </button>
    ) : (
      <button
        type='button'
        onClick={() => handleReview(request)}
        className={`${ROW_ACTION_CLASS} border-gray-700 text-gray-300 hover:text-white hover:border-gray-500`}
      >
        View
      </button>
    );

  return (
    <>
      <div className='space-y-4'>
        <StatusChips
          label='Filter requests by status'
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'pending', label: 'Pending', count: filterCounts.pending, tone: 'pending' },
            { value: 'approved', label: 'Approved', count: filterCounts.approved, tone: 'approved' },
            { value: 'rejected', label: 'Rejected', count: filterCounts.rejected, tone: 'rejected' },
            { value: 'all', label: 'All', count: requests.length, tone: 'all' },
          ]}
        />

        <div className='glass rounded-lg overflow-hidden'>
          {filteredRequests.length === 0 ? (
            <div className='text-center py-14 px-4'>
              <p className='text-gray-300 font-medium'>
                {filter === 'pending' ? 'Nothing waiting for review' : `No ${filter === 'all' ? '' : `${filter} `}requests`}
              </p>
              {filter !== 'all' && (
                <p className='text-sm text-gray-500 mt-1'>Pick another status to see older requests.</p>
              )}
            </div>
          ) : (
            <>
              {/* Wide containers: the table. */}
              <div className='hidden @min-[52rem]:block'>
                <Table compact headers={['Employee', 'Date', 'Type', 'Change', 'Reason', 'Status', 'Action']}>
                  {filteredRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className='min-w-36'>
                        <p className='font-medium text-white'>{request.employee_name}</p>
                        <p className='text-xs text-gray-500'>{request.employee_employee_id}</p>
                      </TableCell>
                      <TableCell className='whitespace-nowrap'>{formatDate(request.request_date)}</TableCell>
                      <TableCell>{getTypeBadge(request.request_type)}</TableCell>
                      <TableCell className='min-w-44'>{renderChange(request)}</TableCell>
                      <TableCell className='max-w-56'>
                        <p className='text-xs text-gray-400 truncate' title={request.reason}>{request.reason}</p>
                      </TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell>{renderAction(request)}</TableCell>
                    </TableRow>
                  ))}
                </Table>
              </div>

              {/* Narrow containers: one card per request — who and when on
                  top, the change itself as the card's centre, reason and
                  the review button beneath. */}
              <ul className='@min-[52rem]:hidden grid grid-cols-1 @3xl:grid-cols-2 -mb-px'>
                {filteredRequests.map((request) => (
                  <li key={request.id} className='p-4 min-w-0 border-b border-gray-800/70 @3xl:odd:border-r'>
                    <div className='flex items-start justify-between gap-3'>
                      <div className='min-w-0'>
                        <p className='font-semibold text-white [overflow-wrap:anywhere]'>{request.employee_name}</p>
                        <p className='text-xs text-gray-500'>
                          {request.employee_employee_id} · {formatDate(request.request_date)}
                        </p>
                      </div>
                      <div className='shrink-0'>{getStatusBadge(request.status)}</div>
                    </div>
                    <div className='mt-3'>{getTypeBadge(request.request_type)}</div>
                    <div className='mt-2'>{renderChange(request)}</div>
                    {request.reason && (
                      <p className='mt-2 text-xs text-gray-400 line-clamp-2 [overflow-wrap:anywhere]'>{request.reason}</p>
                    )}
                    <div className='mt-3 flex justify-end'>{renderAction(request)}</div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {selectedRequest && (
        <Modal
          isOpen={isReviewModalOpen}
          onClose={() => {
            setIsReviewModalOpen(false);
            setSelectedRequest(null);
          }}
          title="Review Attendance Request"
        >
          <div className="space-y-4">
            {/* Request Details */}
            <div className="bg-[#0a0a0a] rounded-lg p-4 space-y-3">
              {/* Employee */}
              <div>
                <p className="text-xs text-gray-500">Employee</p>
                <p className="text-sm font-medium">
                  {selectedRequest.employee_name} ({selectedRequest.employee_employee_id})
                </p>
              </div>

              {/* Date */}
              <div>
                <p className="text-xs text-gray-500">Attendance Date</p>
                <p className="text-sm">{formatDate(selectedRequest.request_date)}</p>
              </div>

              {/* Request Type */}
              <div>
                <p className="text-xs text-gray-500">Request Type</p>
                <div className="mt-1">{getTypeBadge(selectedRequest.request_type)}</div>
              </div>

              {/* Regularisation comparison */}
              {selectedRequest.request_type && selectedRequest.request_type !== 'status_change' ? (
                <>
                  {/* Clock-In comparison */}
                  {(selectedRequest.current_clock_in_time || selectedRequest.requested_clock_in_time) && (
                    <div className="grid grid-cols-2 gap-3 bg-gray-900/50 rounded-lg p-3 *:min-w-0">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Current Clock-In</p>
                        <p className="text-sm text-gray-300 font-mono">
                          {formatTime(selectedRequest.current_clock_in_time) || '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Requested Clock-In</p>
                        <p className="text-sm text-blue-400 font-semibold font-mono">
                          {formatTime(selectedRequest.requested_clock_in_time) || '—'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Clock-Out comparison */}
                  {(selectedRequest.current_clock_out_time || selectedRequest.requested_clock_out_time) && (
                    <div className="grid grid-cols-2 gap-3 bg-gray-900/50 rounded-lg p-3 *:min-w-0">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Current Clock-Out</p>
                        <p className="text-sm text-gray-300 font-mono">
                          {formatTime(selectedRequest.current_clock_out_time) || '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Requested Clock-Out</p>
                        <p className="text-sm text-orange-400 font-semibold font-mono">
                          {formatTime(selectedRequest.requested_clock_out_time) || '—'}
                        </p>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                /* Legacy status-change display */
                <>
                  <div>
                    <p className="text-xs text-gray-500">Change Requested</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {selectedRequest.current_status ? (
                        <>
                          {getAttendanceStatusBadge(selectedRequest.current_status)}
                          <span>→</span>
                          {getAttendanceStatusBadge(selectedRequest.requested_status, selectedRequest.half_day_period)}
                        </>
                      ) : (
                        <>
                          <span className="text-xs text-gray-500">New Record:</span>
                          {getAttendanceStatusBadge(selectedRequest.requested_status, selectedRequest.half_day_period)}
                        </>
                      )}
                      {selectedRequest.requested_status === 'paid-leave' &&
                        selectedRequest.leave_type && (
                          <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded">
                            {selectedRequest.leave_type.toUpperCase()} LEAVE
                          </span>
                        )}
                    </div>
                  </div>

                  {selectedRequest.clock_out_time && (
                    <div>
                      <p className="text-xs text-gray-500">Requested Clock-Out Time</p>
                      <p className="text-sm text-cyan-400 font-semibold mt-1">
                        {selectedRequest.clock_out_time.substring(0, 5)}
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* Reason */}
              <div>
                <p className="text-xs text-gray-500">Reason</p>
                <p className="text-sm text-gray-300 mt-1 [overflow-wrap:anywhere]">{selectedRequest.reason}</p>
              </div>

              {/* Employee Note */}
              {selectedRequest.employee_note && (
                <div>
                  <p className="text-xs text-gray-500">Employee Note</p>
                  <p className="text-sm text-gray-400 mt-1">{selectedRequest.employee_note}</p>
                </div>
              )}
            </div>

            {/* Review Form / Already-reviewed info */}
            {selectedRequest.status === 'pending' ? (
              <AttendanceChangeRequestReviewForm
                requestId={selectedRequest.id}
                onSuccess={() => {
                  setIsReviewModalOpen(false);
                  setSelectedRequest(null);
                  window.location.reload();
                }}
              />
            ) : (
              <div className="bg-[#0a0a0a] rounded-lg p-4">
                <p className="text-sm text-gray-400">
                  This request has already been{' '}
                  <strong
                    className={
                      selectedRequest.status === 'approved' ? 'text-green-400' : 'text-red-400'
                    }
                  >
                    {selectedRequest.status}
                  </strong>
                  .
                </p>
                {selectedRequest.review_comments && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500">Review Comments:</p>
                    <p className="text-sm mt-1 text-gray-300">{selectedRequest.review_comments}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}
