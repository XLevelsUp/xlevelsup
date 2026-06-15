import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import {
  getAllClientTransactions,
  getAllClients,
  getFinancialSummary,
} from '@/lib/erp/client-finances';
import ERPNavbar from '@/components/erp/ERPNavbar';
import ClientFinanceManager from '@/components/erp/ClientFinanceManager';
import { getCurrentMonth } from '@/lib/erp/utils';

export default async function ClientFinancesPage({
  searchParams,
}: {
  searchParams: Promise<{
    month?: string;
    type?: string;
    client?: string;
    category?: string;
    status?: string;
  }>;
}) {
  const session = await getSession();
  if (!session) {
    redirect('/erp/login');
  }

  const params = await searchParams;
  const month = params.month || getCurrentMonth();
  const type = params.type as 'income' | 'expense' | undefined;
  const client = params.client;
  const category = params.category;
  const status = params.status;

  const transactions = await getAllClientTransactions({
    month,
    type,
    client,
    category,
    status,
  });

  const clients = await getAllClients();
  const summary = await getFinancialSummary({ month });

  return (
    <div className='min-h-screen'>
      <ERPNavbar userEmail={session.email} userRole={session.role} />
      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <ClientFinanceManager
          transactions={transactions}
          clients={clients}
          initialMonth={month}
          initialType={type}
          initialClient={client}
          initialCategory={category}
          initialStatus={status}
          summary={summary}
        />
      </main>
    </div>
  );
}
