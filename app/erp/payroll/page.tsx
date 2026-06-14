import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getAllPayroll } from '@/lib/erp/payroll';
import ERPNavbar from '@/components/erp/ERPNavbar';
import PayrollManager from '@/components/erp/PayrollManager';
import { getCurrentMonth } from '@/lib/erp/utils';

export default async function PayrollPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; status?: string }>;
}) {
  const session = await getSession();
  if (!session) {
    redirect('/erp/login');
  }

  const params = await searchParams;
  const month = params.month || getCurrentMonth();
  const status = params.status;

  const payroll = await getAllPayroll({ month, status });

  return (
    <div className='min-h-screen'>
      <ERPNavbar userEmail={session.email} userRole={session.role} />
      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <PayrollManager
          payroll={payroll}
          initialMonth={month}
          initialStatus={status}
        />
      </main>
    </div>
  );
}
