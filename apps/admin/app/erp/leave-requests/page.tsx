/**
 * ERP Admin - Leave Management Page
 */

import { getSession, erpPageRedirect } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getAllLeaveRequests } from '@/lib/erp/leave-requests';
import ERPLayoutWrapper from '@/components/erp/ERPLayoutWrapper';
import LeaveManagementTable from '@/components/erp/LeaveManagementTable';

export default async function LeaveManagementPage() {
  const session = await getSession();
  if (!session) {
    redirect('/erp/login');
  }
  // Accountants are invoice-only; every other role keeps its existing access.
  const denied = erpPageRedirect(session);
  if (denied) {
    redirect(denied);
  }

  // Get all leave requests
  const leaveRequests = await getAllLeaveRequests();

  return (
    <ERPLayoutWrapper userEmail={session.email} userRole={session.role}>
      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 w-full min-w-0'>
        {/* Header, view switch and list all live in LeaveManagementTable —
            the header's "Recalculate earned leave" button needs its handler. */}
        <LeaveManagementTable requests={leaveRequests} />
      </main>
    </ERPLayoutWrapper>
  );
}
