/**
 * Employee Attendance Page
 * View attendance records and request changes / regularisation
 */

import { requireEmployeeAuth } from '@/lib/erp/employee-portal-auth';
import { getEmployeeAttendanceWithRequests } from '@/lib/erp/attendance-change-requests';
import { getEmployeeAttendanceChangeRequests } from '@/lib/erp/attendance-change-requests';
import { supabase } from '@/lib/supabase';
import type {
  AttendanceChangeRequest,
  AttendanceWithChangeRequest,
  TimeLog,
} from '@/types/erp';
import AttendanceRecordsTable from '@/components/erp/employee/AttendanceRecordsTable';
import AttendanceChangeRequestForm from '@/components/erp/employee/AttendanceChangeRequestForm';
import AttendanceChangeRequestsList from '@/components/erp/employee/AttendanceChangeRequestsList';
import RegularisationRequestForm from '@/components/erp/employee/RegularisationRequestForm';
import { getTimeLogsByRange, getTimeLogSummary } from '@/lib/erp/time-logs';
import { employeeLogoutAction } from '@/actions/erp/employee-auth';
import ClockInOut from '@/components/erp/employee/ClockInOut';
import Link from 'next/link';
import SubmitButton from '@/components/ui/SubmitButton';
import LinkPendingSpinner from '@/components/ui/LinkPendingSpinner';

export default async function EmployeeAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{
    date?: string;
    missed?: string;
    tab?: string;
    attendanceId?: string;
    status?: string;
  }>;
}) {
  const session = await requireEmployeeAuth();
  const params = await searchParams;

  // Get attendance records for the last 3 months
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  const startDate = threeMonthsAgo.toISOString().split('T')[0];

  // Independent, so loaded side by side — this page is also what every clock
  // in/out and request submitted here re-renders, so its load time is part of
  // each click. loadAttendanceHistory never rejects.
  const [timeLogSummary, { attendanceRecords, changeRequests, timeLogs, isFeatureAvailable }] =
    await Promise.all([
      getTimeLogSummary(session.id),
      loadAttendanceHistory(session.id, startDate),
    ]);

  // Determine active form tab from URL param (default: regularisation)
  const activeTab = params?.tab === 'status' ? 'status' : 'regularisation';

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] to-[#1a1a1a] text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-[#0a0a0a]/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-[var(--cyan)] to-[var(--purple)] bg-clip-text text-transparent">
                My Attendance
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                View records and raise regularisation requests
              </p>
            </div>
            {session.employment_type === 'freelancer' ? (
              <form action={employeeLogoutAction}>
                <SubmitButton
                  pendingText="Logging out…"
                  className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  Logout
                </SubmitButton>
              </form>
            ) : (
              <Link
                href="/employee/dashboard"
                className="px-4 py-2 text-sm bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              >
                ← Back to Dashboard
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {!isFeatureAvailable && (
          <div className="mb-6 bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <div className="text-2xl">⚠️</div>
              <div>
                <h3 className="text-lg font-semibold text-yellow-300 mb-2">
                  Feature Not Available Yet
                </h3>
                <p className="text-sm text-yellow-200 mb-3">
                  The attendance regularisation feature requires a database migration to be run by
                  your administrator.
                </p>
                <p className="text-xs text-yellow-300 font-mono bg-yellow-900/30 p-2 rounded">
                  Admin: Run db/migrations/add-regularisation-fields.sql in Supabase
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left — Clock In/Out + Attendance Records + Requests History */}
          <div className="lg:col-span-2 space-y-6">
            {/* Clock In / Clock Out */}
            <ClockInOut employeeId={session.id} initialSummary={timeLogSummary} />

            {/* Attendance Calendar / Table */}
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Attendance Records (Last 3 Months)</h2>
              <AttendanceRecordsTable
                records={attendanceRecords}
                employeeId={session.id}
                timeLogs={timeLogs}
              />
            </div>

            {/* Change Requests List */}
            {isFeatureAvailable && (
              <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4">My Regularisation Requests</h2>
                <AttendanceChangeRequestsList requests={changeRequests} />
              </div>
            )}
          </div>

          {/* Right — Request Forms */}
          {isFeatureAvailable && (
            <div className="lg:col-span-1">
              <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6 sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto overscroll-contain">
                {/* Tab switcher */}
                {/* Soft navigations (was a full page reload per tab click),
                    with a spinner while the other form renders server-side. */}
                <div className="flex gap-1 mb-5 bg-[#0a0a0a] p-1 rounded-lg">
                  <Link
                    href="?tab=regularisation"
                    scroll={false}
                    className={`flex-1 inline-flex items-center justify-center gap-1.5 text-xs py-2 rounded-md transition-colors font-medium ${
                      activeTab === 'regularisation'
                        ? 'bg-[var(--cyan)] text-black'
                        : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    🕒 Time Regularisation
                    <LinkPendingSpinner />
                  </Link>
                  <Link
                    href="?tab=status"
                    scroll={false}
                    className={`flex-1 inline-flex items-center justify-center gap-1.5 text-xs py-2 rounded-md transition-colors font-medium ${
                      activeTab === 'status'
                        ? 'bg-[var(--cyan)] text-black'
                        : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    📋 Status Change
                    <LinkPendingSpinner />
                  </Link>
                </div>

                {activeTab === 'regularisation' ? (
                  <>
                    <h2 className="text-lg font-bold mb-1">Time Regularisation</h2>
                    <p className="text-xs text-gray-400 mb-4">
                      Request corrections for missed or incorrect clock-in / clock-out times
                    </p>
                    <RegularisationRequestForm
                      employeeId={session.id}
                      initialDate={params?.date}
                      initialType={
                        params?.missed === 'true' ? 'missed_clock_out' : undefined
                      }
                    />
                  </>
                ) : (
                  <>
                    <h2 className="text-lg font-bold mb-1">Attendance Status Change</h2>
                    <p className="text-xs text-gray-400 mb-4">
                      Request a change to your attendance status (present, leave, etc.)
                    </p>
                    <AttendanceChangeRequestForm
                      employeeId={session.id}
                      initialDate={params?.date}
                      initialIsMissed={params?.missed === 'true'}
                      initialAttendanceId={params?.attendanceId ? parseInt(params.attendanceId, 10) : null}
                      initialCurrentStatus={params?.status || null}
                    />
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * The page's attendance history. Regularisation needs the
 * attendance_change_requests table (db/migrations/add-regularisation-fields.sql);
 * if any of these queries fail — the joined one fails when that table is
 * missing — fall back to plain attendance rows and flag the feature as
 * unavailable. This used to spend an extra query on every render probing for
 * the table first; the failed join already says the same thing.
 */
async function loadAttendanceHistory(
  employeeId: number,
  startDate: string,
): Promise<{
  attendanceRecords: AttendanceWithChangeRequest[];
  changeRequests: AttendanceChangeRequest[];
  timeLogs: TimeLog[];
  isFeatureAvailable: boolean;
}> {
  try {
    const [attendanceRecords, changeRequests, timeLogs] = await Promise.all([
      getEmployeeAttendanceWithRequests(employeeId, startDate),
      getEmployeeAttendanceChangeRequests(employeeId),
      getTimeLogsByRange(employeeId, startDate, new Date().toISOString().split('T')[0]),
    ]);
    return { attendanceRecords, changeRequests, timeLogs, isFeatureAvailable: true };
  } catch (error) {
    console.error('Attendance page error:', error);
  }

  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .eq('employee_id', employeeId)
    .gte('date', startDate)
    .order('date', { ascending: false });

  return {
    attendanceRecords: !error && data ? data : [],
    changeRequests: [],
    timeLogs: [],
    isFeatureAvailable: false,
  };
}
