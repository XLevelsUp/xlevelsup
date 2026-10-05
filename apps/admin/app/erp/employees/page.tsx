import { getSession, erpPageRedirect } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getAllEmployees, getAllDepartments } from '@/lib/erp/employees';
import ERPLayoutWrapper from '@/components/erp/ERPLayoutWrapper';
import EmployeeList from '@/components/erp/EmployeeList';

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    department?: string;
    employment_type?: string;
    search?: string;
  }>;
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
  // Active employees only unless another status is picked — "All Statuses"
  // is sent as status=all, since no status at all now means active.
  const status: 'active' | 'inactive' | 'all' =
    params.status === 'inactive' || params.status === 'all' ? params.status : 'active';
  const filters = {
    status,
    department: params.department,
    employment_type: params.employment_type,
    search: params.search,
  };

  const employees = await getAllEmployees({
    ...filters,
    status: status === 'all' ? undefined : status,
  });
  const departments = await getAllDepartments();

  return (
    <ERPLayoutWrapper userEmail={session.email} userRole={session.role}>
      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 w-full min-w-0'>
        <EmployeeList
          employees={employees}
          departments={departments}
          initialFilters={filters}
        />
      </main>
    </ERPLayoutWrapper>
  );
}
