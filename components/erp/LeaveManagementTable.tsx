'use client';

/**
 * Leave Management Table Component (Admin)
 */

import { useState } from 'react';
import type { LeaveRequestWithEmployee } from '@/types/erp';
import { reviewLeaveRequestAction } from '@/actions/erp/leave-requests';
import { toast } from 'react-hot-toast';
import Modal from '@/components/ui/Modal';

interface LeaveManagementTableProps {
  requests: LeaveRequestWithEmployee[];
  adminId: number;
}

export default function LeaveManagementTable({
  requests,
  adminId,
}: LeaveManagementTableProps) {
  const [selectedRequest, setSelectedRequest] =
    useState<LeaveRequestWithEmployee | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [processing, setProcessing] = useState(false);

  const filteredRequests = requests.filter(
    (req) => filterStatus === 'all' || req.status === filterStatus,
  );

  const handleReview = async (
    status: 'approved' | 'rejected',
    comments?: string,
  ) => {
    if (!selectedRequest) return;

    setProcessing(true);
    const formData = new FormData();
    formData.append('status', status);
    if (comments) formData.append('review_comments', comments);

    const result = await reviewLeaveRequestAction(
      selectedRequest.id,
      adminId,
      null,
      formData,
    );

    setProcessing(false);

    if (result.success) {
      toast.success(`Leave request ${status}`);
      setSelectedRequest(null);
      window.location.reload();
    } else {
      toast.error(result.error || 'Failed to review request');
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

  const getLeaveTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      sick: 'Sick',
      casual: 'Casual',
      floater: 'Floater',
      earned: 'Earned (OT)',
      unpaid: 'Unpaid',
      maternity: 'Maternity',
      paternity: 'Paternity',
      other: 'Other',
      // Legacy support
      annual: 'Casual', // Migrated from annual
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

  return (
    <>
      <div className='bg-[#1a1a1a] border border-gray-800 rounded-lg'>
        {/* Header with Filters */}
        <div className='p-6 border-b border-gray-800'>
          <div className='flex items-center justify-between'>
            <div>
              <h2 className='text-xl font-bold text-white'>Leave Requests</h2>
              <p className='text-sm text-gray-400 mt-1'>
                Total: {filteredRequests.length}
              </p>
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className='px-4 py-2 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[var(--cyan)]'
            >
              <option value='all'>All Status</option>
              <option value='pending'>Pending</option>
              <option value='approved'>Approved</option>
              <option value='rejected'>Rejected</option>
              <option value='cancelled'>Cancelled</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead className='bg-gray-900/50'>
              <tr>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase'>
                  Employee
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase'>
                  Leave Type
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase'>
                  Dates
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase'>
                  Days
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase'>
                  Status
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase'>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-800'>
              {filteredRequests.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className='px-6 py-8 text-center text-gray-400'
                  >
                    No leave requests found
                  </td>
                </tr>
              ) : (
                filteredRequests.map((request) => (
                  <tr key={request.id} className='hover:bg-gray-900/30'>
                    <td className='px-6 py-4'>
                      <div>
                        <p className='font-medium text-white'>
                          {request.employee_name}
                        </p>
                        <p className='text-sm text-gray-400'>
                          {request.employee_id_display}
                        </p>
                        <p className='text-xs text-gray-500'>
                          {request.employee_department}
                        </p>
                      </div>
                    </td>
                    <td className='px-6 py-4 text-gray-300'>
                      {getLeaveTypeLabel(request.leave_type)}
                    </td>
                    <td className='px-6 py-4'>
                      <div className='text-sm'>
                        <p className='text-gray-300'>
                          {formatDate(request.start_date)}
                        </p>
                        <p className='text-gray-500'>
                          to {formatDate(request.end_date)}
                        </p>
                      </div>
                    </td>
                    <td className='px-6 py-4 text-gray-300'>
                      {request.total_days}
                    </td>
                    <td className='px-6 py-4'>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${getStatusBadge(
                          request.status,
                        )}`}
                      >
                        {request.status.toUpperCase()}
                      </span>
                    </td>
                    <td className='px-6 py-4'>
                      <button
                        onClick={() => setSelectedRequest(request)}
                        className='text-sm text-[var(--cyan)] hover:underline'
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      {selectedRequest && (
        <ReviewModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onReview={handleReview}
          processing={processing}
        />
      )}
    </>
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
          <div className='grid grid-cols-2 gap-2 text-sm'>
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
            <div className='col-span-2'>
              <span className='text-gray-400'>Department:</span>
              <span className='text-white ml-2'>
                {request.employee_department}
              </span>
            </div>
          </div>
        </div>

        {/* Leave Details */}
        <div>
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
                {formatDate(request.start_date)} to{' '}
                {formatDate(request.end_date)}
              </span>
            </div>
            <div>
              <span className='text-gray-400'>Total Days:</span>
              <span className='text-white ml-2'>{request.total_days} days</span>
            </div>
            <div>
              <span className='text-gray-400'>Reason:</span>
              <p className='text-white mt-1'>{request.reason}</p>
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
