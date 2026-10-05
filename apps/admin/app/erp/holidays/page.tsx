import { getSession, erpPageRedirect } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getHolidaysForYear } from '@/lib/erp/holidays';
import ERPLayoutWrapper from '@/components/erp/ERPLayoutWrapper';
import HolidaysManager from '@/components/erp/HolidaysManager';
import { getTodayIST } from '@/lib/erp/utils';

export default async function HolidaysPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const session = await getSession();
  if (!session) {
    redirect('/erp/login');
  }
  if (session.role === 'employee') {
    redirect('/erp/dashboard');
  }
  // Accountants are invoice-only.
  const denied = erpPageRedirect(session);
  if (denied) {
    redirect(denied);
  }

  const params = await searchParams;
  const year = params.year ? parseInt(params.year) : new Date().getFullYear();

  const holidays = await getHolidaysForYear(year, { includeInactive: true });
  // IST "today", so the list's past/next marking matches the company's day.
  const t = getTodayIST();
  const today = `${t.year}-${String(t.month).padStart(2, '0')}-${String(t.day).padStart(2, '0')}`;

  return (
    <ERPLayoutWrapper userEmail={session.email} userRole={session.role}>
      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 w-full min-w-0'>
        <HolidaysManager holidays={holidays} initialYear={year} userRole={session.role} today={today} />
      </main>
    </ERPLayoutWrapper>
  );
}
