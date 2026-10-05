/**
 * Admin Attendance Change Requests Page
 * Review and approve/reject employee attendance change requests
 */

import { getSession, erpPageRedirect } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getAllAttendanceChangeRequests } from '@/lib/erp/attendance-change-requests';
import ERPLayoutWrapper from '@/components/erp/ERPLayoutWrapper';
import AttendanceChangeRequestsManagementTable from '@/components/erp/AttendanceChangeRequestsManagementTable';
import { PageHeader } from '@/components/erp/PageChrome';
import { StatTile } from '@/components/erp/charts/FinanceCharts';

export default async function AttendanceChangeRequestsPage() {
  const session = await getSession();
  if (!session) {
    redirect('/erp/login');
  }
  // Accountants are invoice-only; every other role keeps its existing access.
  const denied = erpPageRedirect(session);
  if (denied) {
    redirect(denied);
  }

  const allRequests = await getAllAttendanceChangeRequests();
  const pendingRequests = await getAllAttendanceChangeRequests({
    status: 'pending',
  });

  return (
    <ERPLayoutWrapper userEmail={session.email} userRole={session.role}>
      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 w-full min-w-0'>
        {/* @container: layouts below size against this column — see
            components/erp/PageChrome.tsx. */}
        <div className='@container pb-20'>
          <PageHeader
            title='Attendance Requests'
            description='Clock-in and clock-out corrections, and attendance status changes, waiting on your review.'
          />

          {/* Three short figures — they stay on one row even on a phone. */}
          <div className='grid grid-cols-3 gap-3 @xl:gap-4 mb-6'>
            <StatTile
              label='Pending'
              value={<span className='text-yellow-400'>{pendingRequests.length}</span>}
            />
            <StatTile label='Total' value={<span className='text-cyan'>{allRequests.length}</span>} />
            <StatTile
              label='Approved'
              value={
                <span className='text-green-400'>
                  {allRequests.length > 0
                    ? Math.round(
                        (allRequests.filter((r) => r.status === 'approved').length / allRequests.length) * 100,
                      )
                    : 0}
                  %
                </span>
              }
            />
          </div>

          <AttendanceChangeRequestsManagementTable requests={allRequests} />
        </div>
      </main>
    </ERPLayoutWrapper>
  );
}
