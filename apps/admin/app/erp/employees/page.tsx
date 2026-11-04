import { getSession, erpPageRedirect } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getAllEmployees, getAllDepartments } from '@/lib/erp/employees';
import { EMPLOYMENT_TYPES_BY_GROUP, type EmployeeGroup } from '@/lib/erp/utils';
import ERPLayoutWrapper from '@/components/erp/ERPLayoutWrapper';
import EmployeeList from '@/components/erp/EmployeeList';

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: Promise<{
    tab?: string;
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
  const group: EmployeeGroup = params.tab === 'temp' ? 'temp' : 'team';
  // Active employees only unless another status is picked — "All Statuses"
  // is sent as status=all, since no status at all now means active.
  const status: 'active' | 'inactive' | 'all' =
    params.status === 'inactive' || params.status === 'all' ? params.status : 'active';
  const filters = {
    status,
    department: params.department,
    // A type from the other tab isn't on offer in this tab's filter.
    employment_type: EMPLOYMENT_TYPES_BY_GROUP[group].some((type) => type.value === params.employment_type)
      ? params.employment_type
      : undefined,
    search: params.search,
  };

  const employees = await getAllEmployees({
    ...filters,
    status: status === 'all' ? undefined : status,
    group,
  });
  const departments = await getAllDepartments();

  return (
    <ERPLayoutWrapper userEmail={session.email} userRole={session.role}>
      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 w-full min-w-0'>
        {/* Keyed so switching tabs resets the filters held in client state. */}
        <EmployeeList
          key={group}
          group={group}
          employees={employees}
          departments={departments}
          initialFilters={filters}
        />
      </main>
    </ERPLayoutWrapper>
  );
}
