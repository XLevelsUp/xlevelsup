import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getClients, getClientFinancialSummaries } from '@/lib/erp/clients';
import ERPLayoutWrapper from '@/components/erp/ERPLayoutWrapper';
import ClientManager from '@/components/erp/ClientManager';

export default async function ClientsPage() {
  const session = await getSession();
  if (!session) {
    redirect('/erp/login');
  }
  if (session.role === 'employee') {
    redirect('/erp/dashboard');
  }

  const [clients, summaries] = await Promise.all([
    getClients(),
    getClientFinancialSummaries(),
  ]);

  return (
    <ERPLayoutWrapper userEmail={session.email} userRole={session.role}>
      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full'>
        <ClientManager clients={clients} summaries={summaries} userRole={session.role} />
      </main>
    </ERPLayoutWrapper>
  );
}
