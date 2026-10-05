import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getClients } from '@/lib/erp/clients';
import { getOrdersAction } from '@/actions/erp/billing';
import { getCurrentMonth } from '@/lib/erp/utils';
import ERPLayoutWrapper from '@/components/erp/ERPLayoutWrapper';
import BillingTerminal from '@/components/erp/BillingTerminal';
import InvoiceHistory from '@/components/erp/InvoiceHistory';
import { PageHeader, PageTabs } from '@/components/erp/PageChrome';

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; month?: string }>;
}) {
  const session = await getSession();
  if (!session) {
    redirect('/erp/login');
  }
  if (session.role === 'employee') {
    redirect('/erp/dashboard');
  }

  // Accountants may read invoice history but never create or edit one, so the
  // "New Invoice" tab does not exist for them — including via a hand-typed
  // ?tab=new. The server actions behind that form are separately guarded by
  // requireRole(['admin','hr']), so this is presentation, not the only defence.
  const isReadOnly = session.role === 'accountant';

  const params = await searchParams;
  const activeTab = isReadOnly
    ? 'history'
    : params.tab === 'history'
      ? 'history'
      : 'new';
  // `month` is absent on first load (defaults to the current month), but an
  // explicitly empty value means the user cleared the filter to see every
  // invoice — those two cases must stay distinguishable.
  const month = params.month !== undefined ? params.month : getCurrentMonth();

  const clients = await getClients();
  const knownClients = clients.map((client) => client.name);

  const orders =
    activeTab === 'history' ? await getOrdersAction({ month: month || undefined }) : [];

  return (
    <ERPLayoutWrapper userEmail={session.email} userRole={session.role}>
      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 w-full min-w-0'>
        {/* @container: Billing's layouts size against this column, not the
            viewport — see components/erp/PageChrome.tsx. */}
        <div className='@container pb-20'>
          <PageHeader
            title='Billing'
            description={
              isReadOnly
                ? 'Look up, view and reprint client invoices.'
                : 'Raise GST invoices for client services, and look up past ones.'
            }
          />
          <PageTabs
            label='Billing sections'
            active={activeTab}
            tabs={[
              ...(isReadOnly ? [] : [{ id: 'new', label: 'New Invoice', href: '/erp/billing?tab=new' }]),
              { id: 'history', label: 'Invoice History', href: '/erp/billing?tab=history' },
            ]}
          />

          {activeTab === 'new' ? (
            <BillingTerminal knownClients={knownClients} />
          ) : (
            <InvoiceHistory orders={orders} initialMonth={month} />
          )}
        </div>
      </main>
    </ERPLayoutWrapper>
  );
}
