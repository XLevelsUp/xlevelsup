import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getLedgerEntries, getFinanceSummary } from '@/lib/erp/finance';
import { getCompanyAccounts } from '@/lib/erp/company-accounts';
import { getClients } from '@/lib/erp/clients';
import { getAllEmployees } from '@/lib/erp/employees';
import ERPLayoutWrapper from '@/components/erp/ERPLayoutWrapper';
import FinanceManager from '@/components/erp/FinanceManager';

export default async function FinancesPage({
  searchParams,
}: {
  searchParams: Promise<{
    tab?: string;
    type?: string;
    category?: string;
    status?: string;
    month?: string;
    client?: string;
    employeeId?: string;
    payee?: string;
  }>;
}) {
  const session = await getSession();
  if (!session) {
    redirect('/erp/login');
  }

  const params = await searchParams;
  const tab = params.tab || 'overview';
  
  // Re-map the tabs dynamically so filters query the ledger correctly
  const queryType = 
    tab === 'income' ? 'income' : 
    tab === 'investments' ? 'investment' : 
    params.type || undefined;

  const filters = {
    type: queryType,
    direction: tab === 'expenses' ? 'outflow' : undefined,
    category: params.category || undefined,
    payment_status: params.status || undefined,
    month: params.month || undefined,
    client: params.client || undefined,
    employeeId: params.employeeId ? parseInt(params.employeeId, 10) : undefined,
    payee: params.payee || undefined,
  };

  const [initialEntries, summary, employees, accounts, clients] = await Promise.all([
    getLedgerEntries(session.userId, session.role, filters),
    getFinanceSummary(session.userId, session.role, { month: params.month }),
    getAllEmployees({ status: 'active' }),
    getCompanyAccounts(),
    getClients(),
  ]);

  // Fetch all account-linked transactions for CompanyAccountManager
  const accountTransactions = accounts.length > 0
    ? await getLedgerEntries(session.userId, session.role, {})
    : [];

  // Consolidate all standard categories
  const categories = [
    // Income
    'Service Fee', 'Consulting', 'Development', 'Marketing Services', 'Design Services', 'Maintenance', 'Subscription', 'License Fee', 'Other Income',
    // Expenses
    'Salary', 'Office Rent', 'Utilities', 'Internet', 'Software Subscription', 'Marketing Ads', 'Freelancer Payment', 'Travel', 'Food', 'Equipment', 'Client Project Cost', 'Maintenance', 'Tax', 'Bank Charges', 'Miscellaneous',
    // Investments
    'Founder Investment', 'Partner Capital', 'External Funding', 'Business Reserve',
  ];

  return (
    <ERPLayoutWrapper userEmail={session.email} userRole={session.role}>
      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full'>
        <FinanceManager
          initialEntries={initialEntries}
          summary={summary}
          employees={employees}
          categories={categories}
          accounts={accounts}
          accountTransactions={accountTransactions}
          clients={clients}
          userRole={session.role}
          userId={session.userId}
        />
      </main>
    </ERPLayoutWrapper>
  );
}

