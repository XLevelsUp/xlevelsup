import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getAllExpenses, getAllExpenseCategories } from '@/lib/erp/expenses';
import ERPNavbar from '@/components/erp/ERPNavbar';
import ExpenseManager from '@/components/erp/ExpenseManager';
import { getCurrentMonth } from '@/lib/erp/utils';

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; status?: string; category?: string }>;
}) {
  const session = await getSession();
  if (!session) {
    redirect('/erp/login');
  }

  const params = await searchParams;
  const month = params.month || getCurrentMonth();
  const status = params.status;
  const category = params.category;

  const expenses = await getAllExpenses({ month, status, category });
  const categories = await getAllExpenseCategories();

  return (
    <div className='min-h-screen'>
      <ERPNavbar userEmail={session.email} userRole={session.role} />
      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <ExpenseManager
          expenses={expenses}
          categories={categories}
          initialMonth={month}
          initialStatus={status}
          initialCategory={category}
        />
      </main>
    </div>
  );
}
