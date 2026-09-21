import { getSession, erpPageRedirect } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getLedgerEntries, getFinanceSummary } from '@/lib/erp/finance';
import { getCompanyAccounts } from '@/lib/erp/company-accounts';
import { getClients } from '@/lib/erp/clients';
import { getAllEmployees } from '@/lib/erp/employees';
import { getTodayIST } from '@/lib/erp/utils';
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
    year?: string;
    all?: string;
    mode?: string;
    client?: string;
    employeeId?: string;
    payee?: string;
    /** 'claimed' | 'unclaimed' — GST input-tax-credit claim filter. */
    gst?: string;
  }>;
}) {
  const session = await getSession();
  if (!session) {
    redirect('/erp/login');
  }
  // Accountants may READ this page (read-only — FinanceManager hides every
  // write control for them and the write actions reject them server-side).
  // Every other role keeps its existing access.
  const denied = erpPageRedirect(session, { allowAccountant: true });
  if (denied) {
    redirect(denied);
  }

  const params = await searchParams;
  const tab = params.tab || 'overview';

  // Re-map the tabs dynamically so filters query the ledger correctly
  const queryType =
    tab === 'income' ? 'income' :
    tab === 'investments' ? 'investment' :
    params.type || undefined;

  // Overview/Analytics compute their own KPIs, trends and breakdowns
  // client-side from a broader slice, so month is deliberately left off
  // their server query in month mode (a trend chart needs more than one
  // month of data); FinanceManager applies the month filter itself for
  // those two tabs. Year mode doesn't need this trick — a bounded
  // full-year fetch already has everything a within-year trend needs.
  const isAnalyticalTab = tab === 'overview' || tab === 'reports';

  // Default period is "now", computed in IST (not the server runtime's
  // timezone — see lib/erp/utils.ts) so the page opens scoped to the
  // current month rather than dumping the whole company history into
  // every tab. Passed down as `defaultMonth`/`defaultYear` so the client
  // initializes from the exact same resolved value instead of
  // recomputing "today" itself, which could drift a day at midnight.
  const { year: todayYear, month: todayMonth } = getTodayIST();
  const defaultMonth = `${todayYear}-${String(todayMonth).padStart(2, '0')}`;
  const defaultYear = String(todayYear);

  // "all" (entire history since the beginning) takes precedence over year,
  // which takes precedence over the month default — all three are mutually
  // exclusive in the URL, same as month/year already were.
  const periodType: 'month' | 'year' | 'all' = params.all ? 'all' : params.year ? 'year' : 'month';
  const effectiveMonth = periodType === 'month' ? params.month || defaultMonth : undefined;
  const effectiveYear = periodType === 'year' ? params.year || defaultYear : undefined;

  const filters = {
    type: queryType,
    direction: tab === 'expenses' ? 'outflow' : undefined,
    category: params.category || undefined,
    // The Status filter's options (pending/approved/rejected/paid) are
    // approval_status vocabulary, not payment_status (which is
    // pending/completed/failed/cancelled/refunded) — this was previously
    // wired to the wrong column, so picking e.g. "Approved" matched zero rows.
    approval_status: params.status || undefined,
    payment_mode: params.mode || undefined,
    // "all" mode deliberately sets neither bound below — every tab (not
    // just Overview/Analytics) gets the complete unfiltered history.
    month: periodType === 'month' && !isAnalyticalTab ? effectiveMonth : undefined,
    dateFrom: periodType === 'year' ? `${effectiveYear}-01-01` : undefined,
    dateTo: periodType === 'year' ? `${effectiveYear}-12-31` : undefined,
    client: params.client || undefined,
    employeeId: params.employeeId ? parseInt(params.employeeId, 10) : undefined,
    payee: params.payee || undefined,
    // gst_claim is a boolean column, so this can't be the usual `x || undefined`
    // — `false` is a legitimate filter value ("Not Claimed"), not an absent one.
    gstClaim:
      params.gst === 'claimed' ? true : params.gst === 'unclaimed' ? false : undefined,
  };

  const [initialEntries, employees, accounts, clients, financeSummary] = await Promise.all([
    getLedgerEntries(session.userId, session.role, filters),
    // Not fetched for accountants. getAllEmployees is `select('*')`, so each
    // row carries salary, phone, date of birth and the password hash, and the
    // whole array is serialized into this page's payload for the client
    // component. Accountants are read-only here and only ever needed the list
    // to fill the create forms they cannot open — the cost is that employee
    // names in the details modal fall back to "#id" for them.
    session.role === 'accountant' ? Promise.resolve([]) : getAllEmployees({ status: 'active' }),
    getCompanyAccounts(),
    getClients(),
    // Deliberately unfiltered — the actual account balance the company has,
    // not scoped to whatever period the user happens to be viewing. Shown
    // as "Net Balance" and must never swing negative just because a single
    // month's outflow briefly exceeded that month's inflow.
    getFinanceSummary(session.userId, session.role),
  ]);

  // Fetch all account-linked transactions for CompanyAccountManager
  const accountTransactions = accounts.length > 0
    ? await getLedgerEntries(session.userId, session.role, {})
    : [];

  // Consolidate all standard categories. 'Maintenance' is deliberately
  // listed once even though it applies to both income and expense entries —
  // this list backs a single <select>, so a repeated value would produce a
  // duplicate React key and a duplicate option in the dropdown.
  const categories = [
    ...new Set([
      // Income
      'Service Fee', 'Consulting', 'Development', 'Marketing Services', 'Design Services', 'Maintenance', 'Subscription', 'License Fee', 'Other Income',
      // Expenses
      'Salary', 'Office Rent', 'Utilities', 'Internet', 'Software Subscription', 'Marketing Ads', 'Freelancer Payment', 'Travel', 'Food', 'Equipment', 'Client Project Cost', 'Maintenance', 'Tax', 'Bank Charges', 'Miscellaneous',
      // Investments
      'Founder Investment', 'Partner Capital', 'External Funding', 'Business Reserve',
    ]),
  ];

  return (
    <ERPLayoutWrapper userEmail={session.email} userRole={session.role}>
      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full'>
        <FinanceManager
          initialEntries={initialEntries}
          employees={employees}
          categories={categories}
          accounts={accounts}
          accountTransactions={accountTransactions}
          clients={clients}
          userRole={session.role}
          userId={session.userId}
          defaultMonth={defaultMonth}
          defaultYear={defaultYear}
          trueNetBalance={financeSummary.netBalance}
        />
      </main>
    </ERPLayoutWrapper>
  );
}
