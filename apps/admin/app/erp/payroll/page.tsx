import { getSession, erpPageRedirect } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getAllPayroll } from '@/lib/erp/payroll';
import { getAllEmployees } from '@/lib/erp/employees';
import { getSalaryTemplates, getEffectiveSalaryStructure } from '@/lib/erp/salary-structure';
import ERPLayoutWrapper from '@/components/erp/ERPLayoutWrapper';
import PayrollManager from '@/components/erp/PayrollManager';
import SalaryStructureManager from '@/components/erp/SalaryStructureManager';
import { getCurrentMonth } from '@/lib/erp/utils';

export default async function PayrollPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; status?: string; tab?: string }>;
}) {
  const session = await getSession();
  if (!session) {
    redirect('/erp/login');
  }
  // Accountants are invoice-only; every other role keeps its existing access.
  const denied = erpPageRedirect(session);
  if (denied) {
    redirect(denied);
  }

  const params = await searchParams;
  const month = params.month || getCurrentMonth();
  const status = params.status;
  const tab = params.tab === 'salary-structures' ? 'salary-structures' : 'payroll';

  if (tab === 'salary-structures') {
    const [fullTimeEmployees, templates] = await Promise.all([
      getAllEmployees({ status: 'active', employment_type: 'full-time' }),
      getSalaryTemplates(),
    ]);

    const today = new Date().toISOString().split('T')[0];
    const currentStructures = await Promise.all(
      fullTimeEmployees.map((e) => getEffectiveSalaryStructure(e.id, today)),
    );
    const currentStructureByEmployeeId = Object.fromEntries(
      fullTimeEmployees.map((e, i) => [e.id, currentStructures[i]]),
    );

    return (
      <ERPLayoutWrapper userEmail={session.email} userRole={session.role}>
        <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full'>
          <SalaryStructureManager
            employees={fullTimeEmployees}
            templates={templates}
            currentStructureByEmployeeId={currentStructureByEmployeeId}
          />
        </main>
      </ERPLayoutWrapper>
    );
  }

  const [payroll, activeEmployees] = await Promise.all([
    getAllPayroll({ month, status }),
    getAllEmployees({ status: 'active' }),
  ]);
  // Same eligibility rule as generatePayrollAction: interns are on a stipend
  // and freelancers are paid hourly — neither gets a salary payslip.
  const eligibleEmployees = activeEmployees
    .filter((e) => e.employment_type !== 'intern' && e.employment_type !== 'freelancer')
    .map((e) => ({
      id: e.id,
      name: e.name,
      employee_id: e.employee_id,
      employment_type: e.employment_type,
    }));

  return (
    <ERPLayoutWrapper userEmail={session.email} userRole={session.role}>
      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full'>
        <PayrollManager
          payroll={payroll}
          initialMonth={month}
          initialStatus={status}
          eligibleEmployees={eligibleEmployees}
        />
      </main>
    </ERPLayoutWrapper>
  );
}
