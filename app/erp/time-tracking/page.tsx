/**
 * Admin Time Tracking Page
 * Full page view with more detailed controls and history
 */

import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ERPNavbar from '@/components/erp/ERPNavbar';
import {
  getAllEmployeesTimeStatus,
  getTimeTrackingStats,
} from '@/lib/erp/time-tracking-admin';
import TimeTrackingOverview from '@/components/erp/admin/TimeTrackingOverview';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Time Tracking Dashboard | XLEVELSUP ERP',
  description: 'Real-time employee clock in/out tracking and attendance monitoring',
};

export default async function TimeTrackingPage() {
  const session = await getSession();
  if (!session) {
    redirect('/erp/login');
  }

  const employeesTimeStatus = await getAllEmployeesTimeStatus();
  const timeTrackingStats = await getTimeTrackingStats();

  const currentDate = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className='min-h-screen'>
      <ERPNavbar userEmail={session.email} userRole={session.role} />
      <main className='max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Header */}
        <div className='mb-8'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-3xl font-bold gradient-text'>
                ⏰ Time Tracking Dashboard
              </h1>
              <p className='text-gray-400 mt-2'>
                Real-time employee attendance and working hours
              </p>
              <p className='text-sm text-gray-500 mt-1'>{currentDate}</p>
            </div>
            <Link
              href='/erp/dashboard'
              className='px-4 py-2 bg-[#1a1a1a] text-gray-300 hover:text-white rounded-lg transition-colors text-sm'
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Overview Stats */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8'>
          {/* Total Employees */}
          <div className='glass p-6 rounded-lg border-l-4 border-cyan'>
            <div className='text-xs text-gray-400 uppercase tracking-wider mb-2'>
              Total Employees
            </div>
            <div className='text-3xl font-bold text-white mb-1'>
              {timeTrackingStats.total_employees}
            </div>
            <div className='text-xs text-gray-500'>Active today</div>
          </div>

          {/* Currently Working */}
          <div className='glass p-6 rounded-lg border-l-4 border-green-500'>
            <div className='text-xs text-gray-400 uppercase tracking-wider mb-2'>
              Currently Working
            </div>
            <div className='text-3xl font-bold text-green-400 mb-1'>
              {timeTrackingStats.currently_working}
            </div>
            <div className='text-xs text-gray-500'>
              {timeTrackingStats.total_employees > 0
                ? (
                    (timeTrackingStats.currently_working /
                      timeTrackingStats.total_employees) *
                    100
                  ).toFixed(0)
                : 0}
              % of team
            </div>
          </div>

          {/* Completed Day */}
          <div className='glass p-6 rounded-lg border-l-4 border-blue-500'>
            <div className='text-xs text-gray-400 uppercase tracking-wider mb-2'>
              Completed Day
            </div>
            <div className='text-3xl font-bold text-blue-400 mb-1'>
              {timeTrackingStats.completed_day}
            </div>
            <div className='text-xs text-gray-500'>≥8 hours worked</div>
          </div>

          {/* Total Hours */}
          <div className='glass p-6 rounded-lg border-l-4 border-purple'>
            <div className='text-xs text-gray-400 uppercase tracking-wider mb-2'>
              Total Hours
            </div>
            <div className='text-3xl font-bold text-purple mb-1'>
              {timeTrackingStats.total_hours_today.toFixed(0)}
            </div>
            <div className='text-xs text-gray-500'>
              Avg: {timeTrackingStats.average_hours.toFixed(2)} hrs/employee
            </div>
          </div>

          {/* Not Started */}
          <div className='glass p-6 rounded-lg border-l-4 border-gray-500'>
            <div className='text-xs text-gray-400 uppercase tracking-wider mb-2'>
              Not Started
            </div>
            <div className='text-3xl font-bold text-gray-400 mb-1'>
              {timeTrackingStats.not_started}
            </div>
            <div className='text-xs text-gray-500'>Haven't clocked in</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className='glass p-6 rounded-lg mb-8'>
          <div className='flex items-center justify-between mb-3'>
            <h3 className='text-lg font-semibold text-white'>
              Team Productivity Overview
            </h3>
            <div className='text-sm text-gray-400'>
              {timeTrackingStats.completed_day} /{' '}
              {timeTrackingStats.total_employees} completed
            </div>
          </div>
          <div className='relative w-full h-6 bg-[#0a0a0a] rounded-full overflow-hidden'>
            <div
              className='absolute h-full bg-gradient-to-r from-green-500 to-blue-500 transition-all duration-500'
              style={{
                width: `${timeTrackingStats.total_employees > 0 ? (timeTrackingStats.completed_day / timeTrackingStats.total_employees) * 100 : 0}%`,
              }}
            />
          </div>
          <div className='flex justify-between text-xs text-gray-500 mt-2'>
            <span>0%</span>
            <span>
              {timeTrackingStats.total_employees > 0
                ? (
                    (timeTrackingStats.completed_day /
                      timeTrackingStats.total_employees) *
                    100
                  ).toFixed(1)
                : 0}
              % completed
            </span>
            <span>100%</span>
          </div>
        </div>

        {/* Employee Time Tracking Table */}
        <div className='glass p-6 rounded-lg'>
          <div className='flex items-center justify-between mb-6'>
            <h2 className='text-xl font-bold text-white'>
              Employee Status Details
            </h2>
            <div className='flex items-center gap-2'>
              <div className='text-xs text-gray-500'>
                Auto-refresh every 60s
              </div>
              <div className='w-2 h-2 rounded-full bg-green-500 animate-pulse' />
            </div>
          </div>
          <TimeTrackingOverview employees={employeesTimeStatus} />
        </div>

        {/* Info */}
        <div className='mt-8 glass p-4 rounded-lg'>
          <p className='text-sm text-gray-400'>
            💡 <strong>Tip:</strong> This dashboard shows real-time status. Employees
            can clock in/out from their portal. Data is refreshed when you reload
            the page. Hours are calculated automatically including all sessions
            throughout the day.
          </p>
        </div>
      </main>
    </div>
  );
}
