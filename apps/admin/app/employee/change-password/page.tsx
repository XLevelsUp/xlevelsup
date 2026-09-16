/**
 * Force Password Change Page (First Login)
 */

import { redirect } from 'next/navigation';
import { getEmployeeSession } from '@/lib/erp/employee-portal-auth';
import ChangePasswordForm from './ChangePasswordForm';

export default async function ChangePasswordPage() {
  // Get the employee session
  const session = await getEmployeeSession();

  // If no session, redirect to login
  if (!session) {
    redirect('/employee/login');
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a0a] to-[#1a1a1a] p-4'>
      <div className='w-full max-w-md'>
        {/* Header */}
        <div className='text-center mb-8'>
          <div className='w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-4'>
            <svg
              className='w-8 h-8 text-yellow-500'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
              />
            </svg>
          </div>
          <h1 className='text-2xl font-bold text-white mb-2'>
            Change Password Required
          </h1>
          <p className='text-gray-400'>Please set a new password to continue</p>
        </div>

        {/* Password Change Form */}
        <div className='bg-[#1a1a1a] border border-gray-800 rounded-lg p-6 shadow-xl'>
          <ChangePasswordForm
            employeeId={session.id}
            employeeName={session.name}
          />
        </div>
      </div>
    </div>
  );
}
