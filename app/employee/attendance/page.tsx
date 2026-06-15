/**
 * Employee Attendance Page
 * View attendance records and request changes
 */

import { requireEmployeeAuth } from '@/lib/erp/employee-portal-auth';
import { getEmployeeAttendanceWithRequests } from '@/lib/erp/attendance-change-requests';
import { getEmployeeAttendanceChangeRequests } from '@/lib/erp/attendance-change-requests';
import { supabase } from '@/lib/supabase';
import type { AttendanceChangeRequest, Attendance } from '@/types/erp';
import AttendanceRecordsTable from '@/components/erp/employee/AttendanceRecordsTable';
import AttendanceChangeRequestForm from '@/components/erp/employee/AttendanceChangeRequestForm';
import AttendanceChangeRequestsList from '@/components/erp/employee/AttendanceChangeRequestsList';

export default async function EmployeeAttendancePage() {
  const session = await requireEmployeeAuth();

  // Get attendance records for the last 3 months
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  const startDate = threeMonthsAgo.toISOString().split('T')[0];

  let attendanceRecords: any[] = [];
  let changeRequests: AttendanceChangeRequest[] = [];
  let isFeatureAvailable = true;

  try {
    // Check if the table exists by trying to query it
    const { data: testQuery, error: testError } = await supabase
      .from('attendance_change_requests')
      .select('id')
      .limit(1);

    if (testError && testError.code === '42P01') {
      // Table doesn't exist
      isFeatureAvailable = false;
    } else {
      // Table exists, fetch data
      attendanceRecords = await getEmployeeAttendanceWithRequests(
        session.id,
        startDate,
      );
      changeRequests = await getEmployeeAttendanceChangeRequests(session.id);
    }
  } catch (error) {
    console.error('Attendance page error:', error);
    isFeatureAvailable = false;
  }

  // Fallback: Get basic attendance if feature not available
  if (!isFeatureAvailable) {
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', session.id)
      .gte('date', startDate)
      .order('date', { ascending: false });

    if (!error && data) {
      attendanceRecords = data;
    }
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-[#0a0a0a] to-[#1a1a1a] text-white'>
      {/* Header */}
      <div className='border-b border-gray-800 bg-[#0a0a0a]/50 backdrop-blur-sm'>
        <div className='max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-2xl font-bold bg-gradient-to-r from-[var(--cyan)] to-[var(--purple)] bg-clip-text text-transparent'>
                My Attendance
              </h1>
              <p className='text-sm text-gray-400 mt-1'>
                View your attendance records and request changes
              </p>
            </div>
            <a
              href='/employee/dashboard'
              className='px-4 py-2 text-sm bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors'
            >
              ← Back to Dashboard
            </a>
          </div>
        </div>
      </div>

      <div className='max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8'>
        {!isFeatureAvailable && (
          <div className='mb-6 bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-6'>
            <div className='flex items-start gap-3'>
              <div className='text-2xl'>⚠️</div>
              <div>
                <h3 className='text-lg font-semibold text-yellow-300 mb-2'>
                  Feature Not Available Yet
                </h3>
                <p className='text-sm text-yellow-200 mb-3'>
                  The attendance change request feature requires a database
                  migration to be run by your administrator.
                </p>
                <p className='text-xs text-yellow-300 font-mono bg-yellow-900/30 p-2 rounded'>
                  Admin: Run migration-attendance-change-requests.sql in
                  Supabase
                </p>
              </div>
            </div>
          </div>
        )}

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Main Content - Attendance Records */}
          <div className='lg:col-span-2 space-y-6'>
            {/* Attendance Records Table */}
            <div className='bg-[#1a1a1a] border border-gray-800 rounded-lg p-6'>
              <h2 className='text-xl font-bold mb-4'>
                Attendance Records (Last 3 Months)
              </h2>
              <AttendanceRecordsTable
                records={attendanceRecords}
                employeeId={session.id}
              />
            </div>

            {/* Change Requests List */}
            {isFeatureAvailable && (
              <div className='bg-[#1a1a1a] border border-gray-800 rounded-lg p-6'>
                <h2 className='text-xl font-bold mb-4'>My Change Requests</h2>
                <AttendanceChangeRequestsList requests={changeRequests} />
              </div>
            )}
          </div>

          {/* Sidebar - Request Form */}
          {isFeatureAvailable && (
            <div className='lg:col-span-1'>
              <div className='bg-[#1a1a1a] border border-gray-800 rounded-lg p-6 sticky top-6'>
                <h2 className='text-xl font-bold mb-4'>Request Change</h2>
                <AttendanceChangeRequestForm employeeId={session.id} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
