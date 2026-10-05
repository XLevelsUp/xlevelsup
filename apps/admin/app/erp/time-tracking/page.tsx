/**
 * Admin Time Tracking Page
 * Full page view with more detailed controls and history
 */

import { getSession, erpPageRedirect } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ERPLayoutWrapper from '@/components/erp/ERPLayoutWrapper';
import {
  getAllEmployeesTimeStatus,
  getTimeTrackingStats,
} from '@/lib/erp/time-tracking-admin';
import TimeTrackingOverview from '@/components/erp/admin/TimeTrackingOverview';
import { PageHeader, RefreshButton } from '@/components/erp/PageChrome';
import { StatTile } from '@/components/erp/charts/FinanceCharts';
import type { Metadata } from 'next';
import { formatDuration } from '@/lib/erp/utils';

export const metadata: Metadata = {
  title: 'Time Tracking Dashboard | XLEVELSUP ERP',
  description:
    'Real-time employee clock in/out tracking and attendance monitoring',
};

export default async function TimeTrackingPage() {
  const session = await getSession();
  if (!session) {
    redirect('/erp/login');
  }
  // Accountants are invoice-only; every other role keeps its existing access.
  const denied = erpPageRedirect(session);
  if (denied) {
    redirect(denied);
  }

  const employeesTimeStatus = await getAllEmployeesTimeStatus();
  const timeTrackingStats = await getTimeTrackingStats();

  // In IST, not the server runtime's timezone. "As of" replaces the old
  // "Auto-refresh every 60s" label — nothing ever auto-refreshed; the figures
  // are as of this render, and the Refresh button re-fetches them in place.
  const now = new Date();
  const currentDate = now.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  const asOf = now.toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <ERPLayoutWrapper userEmail={session.email} userRole={session.role}>
      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 w-full min-w-0'>
        {/* @container: layouts below size against this column — see
            components/erp/PageChrome.tsx. */}
        <div className='@container pb-20'>
          <PageHeader
            title='Time Tracking'
            description={
              <>
                {currentDate} — who’s clocked in and the hours logged so far.{' '}
                <span className='text-gray-500 whitespace-nowrap'>As of {asOf}.</span>
              </>
            }
            actions={<RefreshButton />}
          />

          {/* Two headline figures; the team breakdown (working / paused /
              completed / on leave / not started) is the bar beside them,
              rendered by TimeTrackingOverview from the same list it filters. */}
          <TimeTrackingOverview
            employees={employeesTimeStatus}
            tiles={
              <>
                <StatTile
                  label='Working now'
                  value={<span className='text-green-400'>{timeTrackingStats.currently_working}</span>}
                  sublabel={`${
                    timeTrackingStats.total_employees > 0
                      ? ((timeTrackingStats.currently_working / timeTrackingStats.total_employees) * 100).toFixed(0)
                      : 0
                  }% of ${timeTrackingStats.total_employees} people`}
                />
                <StatTile
                  label='Hours today'
                  value={<span className='text-purple'>{formatDuration(timeTrackingStats.total_hours_today, true)}</span>}
                  sublabel={`Avg ${formatDuration(timeTrackingStats.average_hours, true)} / person`}
                />
              </>
            }
          />
        </div>
      </main>
    </ERPLayoutWrapper>
  );
}
