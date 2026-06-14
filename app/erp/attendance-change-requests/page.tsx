/**
 * Admin Attendance Change Requests Page
 * Review and approve/reject employee attendance change requests
 */

import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getAllAttendanceChangeRequests } from '@/lib/erp/attendance-change-requests';
import ERPNavbar from '@/components/erp/ERPNavbar';
import AttendanceChangeRequestsManagementTable from '@/components/erp/AttendanceChangeRequestsManagementTable';

export default async function AttendanceChangeRequestsPage() {
  const session = await getSession();
  if (!session) {
    redirect('/erp/login');
  }

  const allRequests = await getAllAttendanceChangeRequests();
  const pendingRequests = await getAllAttendanceChangeRequests({
    status: 'pending',
  });

  return (
    <div className='min-h-screen'>
      <ERPNavbar userEmail={session.email} userRole={session.role} />
      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <div className='space-y-6'>
          {/* Header */}
          <div>
            <h1 className='text-2xl font-bold text-white'>
              Attendance Change Requests
            </h1>
            <p className='text-gray-400 mt-1'>
              Review and approve employee attendance change requests
            </p>
          </div>

          {/* Stats */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div className='bg-[#1a1a1a] border border-gray-800 rounded-lg p-4'>
              <p className='text-sm text-gray-400'>Pending Requests</p>
              <p className='text-3xl font-bold text-yellow-400 mt-2'>
                {pendingRequests.length}
              </p>
            </div>
            <div className='bg-[#1a1a1a] border border-gray-800 rounded-lg p-4'>
              <p className='text-sm text-gray-400'>Total Requests</p>
              <p className='text-3xl font-bold text-[var(--cyan)] mt-2'>
                {allRequests.length}
              </p>
            </div>
            <div className='bg-[#1a1a1a] border border-gray-800 rounded-lg p-4'>
              <p className='text-sm text-gray-400'>Approval Rate</p>
              <p className='text-3xl font-bold text-green-400 mt-2'>
                {allRequests.length > 0
                  ? Math.round(
                      (allRequests.filter((r) => r.status === 'approved')
                        .length /
                        allRequests.length) *
                        100,
                    )
                  : 0}
                %
              </p>
            </div>
          </div>

          {/* Requests Table */}
          <div className='bg-[#1a1a1a] border border-gray-800 rounded-lg p-6'>
            <AttendanceChangeRequestsManagementTable
              requests={allRequests}
              userId={session.userId}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
