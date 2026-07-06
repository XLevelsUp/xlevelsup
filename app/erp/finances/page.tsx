import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getLedgerEntries, getFinanceSummary } from '@/lib/erp/finance';
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
    tab === 'expenses' ? 'expense' : 
    tab === 'investments' ? 'investment' : 
    params.type || undefined;

  const filters = {
    type: queryType,
    category: params.category || undefined,
    payment_status: params.status || undefined,
    month: params.month || undefined,
    client: params.client || undefined,
    employeeId: params.employeeId ? parseInt(params.employeeId, 10) : undefined,
  };

  const initialEntries = await getLedgerEntries(session.userId, session.role, filters);
  const summary = await getFinanceSummary(session.userId, session.role, { month: params.month });
  const employees = await getAllEmployees({ status: 'active' });

  // Consolidate all standard categories
  const categories = [
    // Income
    'Service Fee', 'Consulting', 'Development', 'Marketing Services', 'Design Services', 'Maintenance', 'Subscription', 'License Fee', 'Other Income',
    // Expenses
    'Office Rent', 'Utilities', 'Internet', 'Software Subscription', 'Marketing Ads', 'Freelancer Payment', 'Travel', 'Food', 'Equipment', 'Client Project Cost', 'Maintenance', 'Tax', 'Bank Charges', 'Miscellaneous',
    // Investments
    'Founder Investment', 'Partner Capital', 'External Funding', 'Business Reserve',
    // Reimbursements
    'Travel Reimbursement', 'Client Entertainment', 'Office Supplies', 'Hardware/Equipment', 'Software Tools', 'Other Reimbursement'
  ];

  return (
    <ERPLayoutWrapper userEmail={session.email} userRole={session.role}>
      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full'>
        <FinanceManager
          initialEntries={initialEntries}
          summary={summary}
          employees={employees}
          categories={categories}
          userRole={session.role}
          userId={session.userId}
        />
      </main>
    </ERPLayoutWrapper>
  );
}
