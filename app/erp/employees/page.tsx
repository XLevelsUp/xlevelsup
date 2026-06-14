import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getAllEmployees, getAllDepartments } from '@/lib/erp/employees';
import ERPNavbar from '@/components/erp/ERPNavbar';
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

  const params = await searchParams;
  const filters = {
    status: params.status as 'active' | 'inactive' | undefined,
    department: params.department,
    employment_type: params.employment_type,
    search: params.search,
  };

  const employees = await getAllEmployees(filters);
  const departments = await getAllDepartments();

  return (
    <div className='min-h-screen'>
      <ERPNavbar userEmail={session.email} userRole={session.role} />
      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <EmployeeList
          employees={employees}
          departments={departments}
          initialFilters={filters}
        />
      </main>
    </div>
  );
}
