/**
 * Root of admin.xlevelsup.com — the portal chooser.
 *
 * Every real route lives under /erp or /employee, so before this existed the
 * bare domain returned a 404. Now that logins moved off the marketing site,
 * this is the front door: the two portals used to be reachable from the
 * marketing footer, and this screen replaces that entry point.
 *
 * Anyone already signed in is sent straight through — making someone who has a
 * live session pick a portal again would be a step backwards. Only a visitor
 * with no session sees the choice.
 *
 * The ERP session is checked FIRST and deliberately so: getEmployeeSession()
 * bridges an admin's ERP session into an employee one (execs are both users and
 * employees), so asking it first would route every admin into the employee
 * portal.
 *
 * Kept as a page rather than folded into middleware.ts, whose matcher is scoped
 * to '/erp/:path*' and so never sees '/'. Widening that matcher would put every
 * asset request through a session check to serve one redirect.
 */
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getEmployeeSession } from '@/lib/erp/employee-portal-auth';

const PORTALS = [
  {
    href: '/employee/login',
    title: 'Employee Portal',
    description:
      'Clock in and out, view attendance, apply for leave and check your payslips.',
    // A person — this portal is about your own record.
    icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  },
  {
    href: '/erp/login',
    title: 'Admin / ERP',
    description:
      'Employees, attendance, payroll, billing, clients and company finances.',
    // A padlock — this portal is restricted to admin, HR and accountants.
    icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
  },
] as const;

export default async function AdminRootPage() {
  const erpSession = await getSession();
  if (erpSession) {
    // Accountants are invoice-only — the dashboard would render an empty shell
    // for them. Matches where erpPageRedirect() sends them.
    if (erpSession.role === 'accountant') redirect('/erp/billing?tab=history');
    redirect('/erp/dashboard');
  }

  const employeeSession = await getEmployeeSession();
  if (employeeSession) redirect('/employee/dashboard');

  return (
    <main className='min-h-screen flex items-center justify-center px-4 py-12'>
      <div className='w-full max-w-2xl'>
        <div className='text-center mb-10'>
          <h1 className='text-4xl font-bold mb-2'>
            <span className='gradient-text'>XLEVELSUP</span>
          </h1>
          <p className='text-gray-400'>Choose how you want to sign in</p>
        </div>

        <div className='grid gap-4 sm:grid-cols-2'>
          {PORTALS.map((portal) => (
            <Link
              key={portal.href}
              href={portal.href}
              className='glass group rounded-2xl p-6 border border-transparent transition-colors hover:border-cyan focus-visible:border-cyan focus-visible:outline-none'
            >
              <span className='inline-flex mb-4 rounded-lg p-2.5 bg-dark-800 text-cyan'>
                <svg
                  className='h-6 w-6'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                  strokeWidth='2'
                  aria-hidden='true'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    d={portal.icon}
                  />
                </svg>
              </span>

              <h2 className='text-lg font-semibold mb-1 text-white'>
                {portal.title}
              </h2>
              <p className='text-sm text-gray-400 leading-relaxed'>
                {portal.description}
              </p>

              <span className='mt-4 inline-flex items-center gap-1 text-sm font-medium text-cyan'>
                Continue
                <svg
                  className='h-4 w-4 transition-transform group-hover:translate-x-0.5'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                  strokeWidth='2'
                  aria-hidden='true'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    d='M9 5l7 7-7 7'
                  />
                </svg>
              </span>
            </Link>
          ))}
        </div>

        <p className='mt-8 text-center text-xs text-gray-600'>
          Internal systems. Access is logged.
        </p>
      </div>
    </main>
  );
}
