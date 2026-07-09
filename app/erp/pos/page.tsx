import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getClients } from '@/lib/erp/clients';
import ERPLayoutWrapper from '@/components/erp/ERPLayoutWrapper';
import PosTerminal from '@/components/erp/PosTerminal';

export default async function PosPage() {
  const session = await getSession();
  if (!session) {
    redirect('/erp/login');
  }
  if (session.role === 'employee') {
    redirect('/erp/dashboard');
  }

  const clients = await getClients();
  const knownClients = clients.map((client) => client.name);

  return (
    <ERPLayoutWrapper userEmail={session.email} userRole={session.role}>
      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full'>
        <PosTerminal knownClients={knownClients} />
      </main>
    </ERPLayoutWrapper>
  );
}
