/**
 * Employee Profile Page
 */

import { requireFullPortalAccess } from '@/lib/erp/employee-portal-auth';
import { getEmployeeById } from '@/lib/erp/employees';
import EmployeeProfileForm from '@/components/erp/employee/EmployeeProfileForm';
import ChangePasswordCard from '@/components/erp/employee/ChangePasswordCard';
import ChangeOwnPasswordForm from '@/components/erp/ChangeOwnPasswordForm';
import Link from 'next/link';

export default async function EmployeeProfilePage() {
  const session = await requireFullPortalAccess();
  const employee = await getEmployeeById(session.id);

  return (
    <div className='min-h-screen bg-gradient-to-br from-[#0a0a0a] to-[#1a1a1a]'>
      {/* Header */}
      <header className='bg-[#1a1a1a] border-b border-gray-800'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4'>
          <div className='flex items-center justify-between'>
            <div>
              <Link
                href='/employee/dashboard'
                className='text-gray-400 hover:text-white text-sm mb-2 inline-block'
              >
                ← Back to Dashboard
              </Link>
              <h1 className='text-2xl font-bold text-white'>My Profile</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className='max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6'>
        {employee ? (
          <EmployeeProfileForm employee={employee} />
        ) : (
          <p className='text-gray-400'>Unable to load your profile. Please try again later.</p>
        )}

        {/* Signed in through the admin login (see getEmployeeSession): the
            password they log in with is their admin one, so that's the one
            changed here — same form as the admin panel's account menu. */}
        {session.viaAdminSession ? (
          <div className='bg-[#1a1a1a] border border-gray-800 rounded-lg p-6'>
            <h2 className='text-xl font-bold text-white mb-1'>Change Password</h2>
            <p className='text-sm text-gray-400 mb-4'>
              You&apos;re signed in with your admin account, so this changes your admin login
              password.
            </p>
            <ChangeOwnPasswordForm />
          </div>
        ) : (
          <ChangePasswordCard />
        )}
      </main>
    </div>
  );
}
