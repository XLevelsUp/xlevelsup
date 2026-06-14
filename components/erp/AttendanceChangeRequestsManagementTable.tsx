'use client';

/**
 * Attendance Change Requests Management Table
 * For admin to review and approve/reject requests
 */

import { useState } from 'react';
import type { AttendanceChangeRequestWithEmployee } from '@/types/erp';
import Modal from '@/components/ui/Modal';
import AttendanceChangeRequestReviewForm from './AttendanceChangeRequestReviewForm';

interface AttendanceChangeRequestsManagementTableProps {
  requests: AttendanceChangeRequestWithEmployee[];
  userId: number;
}

export default function AttendanceChangeRequestsManagementTable({
  requests,
  userId,
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
      <span
        className={`px-2 py-1 rounded text-xs font-medium ${badge.bg} ${badge.text}`}
      >
        {status.toUpperCase()}
      </span>
    );
  };

  const getAttendanceStatusBadge = (status: string) => {
    return (
      <span className='px-2 py-1 rounded text-xs font-medium bg-gray-700 text-gray-300'>
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

  const handleReview = (request: AttendanceChangeRequestWithEmployee) => {
    setSelectedRequest(request);
    setIsReviewModalOpen(true);
  };

  return (
    <>
      <div className='space-y-4'>
        {/* Filter Buttons */}
        <div className='flex flex-wrap gap-2'>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1 text-xs rounded ${
              filter === 'pending'
                ? 'bg-yellow-500 text-black'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            Pending ({requests.filter((r) => r.status === 'pending').length})
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-3 py-1 text-xs rounded ${
              filter === 'approved'
                ? 'bg-green-500 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            Approved ({requests.filter((r) => r.status === 'approved').length})
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`px-3 py-1 text-xs rounded ${
              filter === 'rejected'
                ? 'bg-red-500 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            Rejected ({requests.filter((r) => r.status === 'rejected').length})
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 text-xs rounded ${
              filter === 'all'
                ? 'bg-[var(--cyan)] text-black'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            All ({requests.length})
          </button>
        </div>

        {/* Table */}
        <div className='overflow-x-auto'>
          {filteredRequests.length === 0 ? (
            <div className='text-center py-12 text-gray-400'>
              <p>No requests found</p>
              <p className='text-sm mt-2'>
                {filter !== 'all' && 'Try changing the filter'}
              </p>
            </div>
          ) : (
            <table className='w-full text-sm'>
              <thead>
                <tr className='border-b border-gray-800'>
                  <th className='text-left py-3 px-2 font-medium text-gray-400'>
                    Employee
                  </th>
                  <th className='text-left py-3 px-2 font-medium text-gray-400'>
                    Date
                  </th>
                  <th className='text-left py-3 px-2 font-medium text-gray-400'>
                    Change
                  </th>
                  <th className='text-left py-3 px-2 font-medium text-gray-400'>
                    Reason
                  </th>
                  <th className='text-center py-3 px-2 font-medium text-gray-400'>
                    Status
                  </th>
                  <th className='text-center py-3 px-2 font-medium text-gray-400'>
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((request) => (
                  <tr
                    key={request.id}
                    className='border-b border-gray-800/50 hover:bg-gray-900/30'
                  >
                    <td className='py-3 px-2'>
                      <div>
                        <p className='font-medium'>{request.employee_name}</p>
                        <p className='text-xs text-gray-500'>
                          {request.employee_employee_id}
                        </p>
                      </div>
                    </td>
                    <td className='py-3 px-2'>
                      {formatDate(request.request_date)}
                    </td>
                    <td className='py-3 px-2'>
                      <div className='flex items-center gap-1'>
                        {request.current_status ? (
                          <>
                            {getAttendanceStatusBadge(request.current_status)}
                            <span className='text-gray-500'>→</span>
                            {getAttendanceStatusBadge(request.requested_status)}
                          </>
                        ) : (
                          <>
                            <span className='text-xs text-gray-500'>New:</span>
                            {getAttendanceStatusBadge(request.requested_status)}
                          </>
                        )}
                      </div>
                    </td>
                    <td className='py-3 px-2'>
                      <p className='text-xs text-gray-400 max-w-xs truncate'>
                        {request.reason}
                      </p>
                    </td>
                    <td className='py-3 px-2 text-center'>
                      {getStatusBadge(request.status)}
                    </td>
                    <td className='py-3 px-2 text-center'>
                      {request.status === 'pending' ? (
                        <button
                          onClick={() => handleReview(request)}
                          className='text-xs px-3 py-1 bg-[var(--cyan)] text-black rounded hover:opacity-80'
                        >
                          Review
                        </button>
                      ) : (
                        <button
                          onClick={() => handleReview(request)}
                          className='text-xs text-gray-500 hover:text-gray-400'
                        >
                          View
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
          title='Review Attendance Change Request'
        >
          <div className='space-y-4'>
            {/* Request Details */}
            <div className='bg-[#0a0a0a] rounded-lg p-4 space-y-3'>
              <div>
                <p className='text-xs text-gray-500'>Employee</p>
                <p className='text-sm font-medium'>
                  {selectedRequest.employee_name} (
                  {selectedRequest.employee_employee_id})
                </p>
              </div>
              <div>
                <p className='text-xs text-gray-500'>Date</p>
                <p className='text-sm'>
                  {formatDate(selectedRequest.request_date)}
                </p>
              </div>
              <div>
                <p className='text-xs text-gray-500'>Change Requested</p>
                <div className='flex items-center gap-2 mt-1'>
                  {selectedRequest.current_status ? (
                    <>
                      {getAttendanceStatusBadge(selectedRequest.current_status)}
                      <span>→</span>
                      {getAttendanceStatusBadge(
                        selectedRequest.requested_status,
                      )}
                    </>
                  ) : (
                    <>
                      <span className='text-xs text-gray-500'>New Record:</span>
                      {getAttendanceStatusBadge(
                        selectedRequest.requested_status,
                      )}
                    </>
                  )}
                </div>
              </div>
              <div>
                <p className='text-xs text-gray-500'>Reason</p>
                <p className='text-sm text-gray-300 mt-1'>
                  {selectedRequest.reason}
                </p>
              </div>
            </div>

            {/* Review Form */}
            {selectedRequest.status === 'pending' ? (
              <AttendanceChangeRequestReviewForm
                requestId={selectedRequest.id}
                reviewerId={userId}
                onSuccess={() => {
                  setIsReviewModalOpen(false);
                  setSelectedRequest(null);
                  window.location.reload();
                }}
              />
            ) : (
              <div className='bg-[#0a0a0a] rounded-lg p-4'>
                <p className='text-sm text-gray-400'>
                  This request has already been {selectedRequest.status}.
                </p>
                {selectedRequest.review_comments && (
                  <div className='mt-2'>
                    <p className='text-xs text-gray-500'>Review Comments:</p>
                    <p className='text-sm mt-1'>
                      {selectedRequest.review_comments}
                    </p>
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
