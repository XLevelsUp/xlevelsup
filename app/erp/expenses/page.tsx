import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getAllExpenses, getAllExpenseCategories } from '@/lib/erp/expenses';
import { getAllEmployees } from '@/lib/erp/employees';
import ERPNavbar from '@/components/erp/ERPNavbar';
import ExpenseManager from '@/components/erp/ExpenseManager';
import { getCurrentMonth } from '@/lib/erp/utils';

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{
    month?: string;
    status?: string;
    category?: string;
    paidBy?: string;
  }>;
}) {
  const session = await getSession();
  if (!session) {
    redirect('/erp/login');
  }

  const params = await searchParams;
  const month = params.month || getCurrentMonth();
  const status = params.status;
  const category = params.category;
  const paidBy = params.paidBy;

  const expenses = await getAllExpenses({ month, status, category, paidBy });
  const categories = await getAllExpenseCategories();
  const employees = await getAllEmployees({ status: 'active' });

  return (
    <div className='min-h-screen'>
      <ERPNavbar userEmail={session.email} userRole={session.role} />
      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <ExpenseManager
          expenses={expenses}
          categories={categories}
          employees={employees}
          initialMonth={month}
          initialStatus={status}
          initialCategory={category}
          initialPaidBy={paidBy}
        />
      </main>
    </div>
  );
}
