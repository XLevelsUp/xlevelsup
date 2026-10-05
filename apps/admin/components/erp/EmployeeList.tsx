'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Table, TableRow, TableCell } from './Table';
import Modal from '@/components/ui/Modal';
import EmployeeForm from './EmployeeForm';
import CareerChangeModal from './CareerChangeModal';
import EmployeeCareerHistoryComponent from './EmployeeCareerHistory';
import AdminEmployeePayslips from './AdminEmployeePayslips';
import { EditIcon, DeleteIcon } from './ActionIcons';
import SensitiveValue from './SensitiveValue';
import type { Employee, EmployeeCareerHistory, EmployeeCareerChangeType } from '@/types/erp';
import { formatCurrency, formatDisplayDate } from '@/lib/erp/utils';
import toast from 'react-hot-toast';
import { deleteEmployeeAction } from '@/actions/erp/employees';
import { getEmployeeCareerHistoryAction } from '@/actions/erp/employee-career';
import { getEmployeePayrollHistoryAction } from '@/actions/erp/payroll';
import type { EmployeePayrollHistoryRow } from '@/lib/erp/payroll';
import DeleteConfirmButton from './DeleteConfirmButton';
import {
  PageHeader,
  FilterField,
  FIELD_CLASS,
  FILTER_GRID_CLASS,
  PRIMARY_ACTION_CLASS,
  ROW_ACTION_CLASS,
} from './PageChrome';

interface EmployeeListProps {
  employees: Employee[];
  departments: string[];
  initialFilters: {
    status?: 'active' | 'inactive' | 'all';
    department?: string;
    employment_type?: string;
    search?: string;
  };
}

export default function EmployeeList({
  employees,
  departments,
  initialFilters,
}: EmployeeListProps) {
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCareerModal, setShowCareerModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [careerChangeType, setCareerChangeType] = useState<EmployeeCareerChangeType | undefined>();
  const [careerHistory, setCareerHistory] = useState<EmployeeCareerHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showPayslipsModal, setShowPayslipsModal] = useState(false);
  const [payslips, setPayslips] = useState<EmployeePayrollHistoryRow[]>([]);
  const [loadingPayslips, setLoadingPayslips] = useState(false);
  const [filters, setFilters] = useState(initialFilters);

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value || undefined };
    setFilters(newFilters);

    const params = new URLSearchParams();
    // Active is the default, so it stays out of the URL.
    if (newFilters.status && newFilters.status !== 'active') params.set('status', newFilters.status);
    if (newFilters.department) params.set('department', newFilters.department);
    if (newFilters.employment_type)
      params.set('employment_type', newFilters.employment_type);
    if (newFilters.search) params.set('search', newFilters.search);

    router.push(`/erp/employees?${params.toString()}`);
  };

  const handleEdit = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowEditModal(true);
  };

  const handleDelete = async (employee: Employee) => {
    const result = await deleteEmployeeAction(employee.id);
    if (result.success) {
      toast.success('Employee deleted successfully');
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to delete employee');
    }
  };

  const handleCareerChange = (employee: Employee, changeType?: EmployeeCareerChangeType) => {
    setSelectedEmployee(employee);
    setCareerChangeType(changeType);
    setShowCareerModal(true);
  };

  const handleViewHistory = async (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowHistoryModal(true);
    setLoadingHistory(true);
    try {
      const history = await getEmployeeCareerHistoryAction(employee.id);
      setCareerHistory(history);
    } catch {
      toast.error('Failed to load career history');
      setCareerHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleViewPayslips = async (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowPayslipsModal(true);
    setLoadingPayslips(true);
    try {
      const result = await getEmployeePayrollHistoryAction(employee.id);
      setPayslips(result);
    } catch {
      toast.error('Failed to load payslips');
      setPayslips([]);
    } finally {
      setLoadingPayslips(false);
    }
  };

  // ── Employee renderers ──────────────────────────────────────────────────
  // Shared by the wide-screen table and the narrow-screen cards.

  const renderEmployment = (employee: Employee) => (
    <div>
      <span
        className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium capitalize whitespace-nowrap ${
          employee.employment_type === 'intern' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-blue-500/20 text-blue-300'
        }`}
      >
        {employee.employment_type?.replace('-', ' ') || 'Full-Time'}
      </span>
      {employee.end_date && (
        <p className='text-xs text-gray-500 mt-0.5 whitespace-nowrap'>Until {formatDisplayDate(employee.end_date)}</p>
      )}
    </div>
  );

  const renderSalary = (employee: Employee) => (
    <div className='tabular-nums'>
      <p className='font-medium text-white whitespace-nowrap'>
        {employee.monthly_salary !== null && employee.monthly_salary !== undefined ? (
          <SensitiveValue>{formatCurrency(employee.monthly_salary)}</SensitiveValue>
        ) : (
          'Unpaid'
        )}
      </p>
      <p className='text-xs text-gray-500 capitalize whitespace-nowrap'>
        {employee.salary_type}
        {employee.hourly_rate && ` · ₹${employee.hourly_rate}/hr`}
      </p>
    </div>
  );

  const renderStatus = (employee: Employee) => (
    <span
      className={`inline-block px-2 py-1 rounded-full text-xs font-medium capitalize whitespace-nowrap ${
        employee.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
      }`}
    >
      {employee.status}
    </span>
  );

  const renderEditDelete = (employee: Employee) => (
    <>
      <button
        type='button'
        onClick={() => handleEdit(employee)}
        title='Edit'
        aria-label={`Edit ${employee.name}`}
        className='p-1 text-cyan-400 hover:text-cyan-300 transition-colors'
      >
        <EditIcon className='w-3.5 h-3.5' />
      </button>
      <DeleteConfirmButton
        onConfirm={() => handleDelete(employee)}
        message={`Are you sure you want to delete ${employee.name}?`}
        title='Delete'
        ariaLabel={`Delete ${employee.name}`}
        className='p-1 text-red-400 hover:text-red-300 transition-colors'
      >
        <DeleteIcon className='w-3.5 h-3.5' />
      </DeleteConfirmButton>
    </>
  );

  /** Career actions — what can happen next in this person's record. */
  const renderCareerActions = (employee: Employee) => {
    const isIntern = employee.employment_type === 'intern';
    const isActive = employee.status === 'active';
    return (
      <>
        {isIntern && isActive && (
          <button
            type='button'
            onClick={() => handleCareerChange(employee, 'intern_conversion')}
            className={`${ROW_ACTION_CLASS} bg-yellow-500/15 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/25`}
          >
            Convert
          </button>
        )}
        {!isIntern && isActive && (
          <button
            type='button'
            onClick={() => handleCareerChange(employee, 'promotion')}
            className={`${ROW_ACTION_CLASS} bg-green-500/15 text-green-400 border-green-500/30 hover:bg-green-500/25`}
          >
            Promote
          </button>
        )}
        {isActive && (
          <button
            type='button'
            onClick={() => handleCareerChange(employee, 'salary_revision')}
            className={`${ROW_ACTION_CLASS} bg-cyan-500/15 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/25`}
          >
            Salary
          </button>
        )}
        <button
          type='button'
          onClick={() => handleViewHistory(employee)}
          className={`${ROW_ACTION_CLASS} border-gray-700 text-gray-300 hover:text-white hover:border-gray-500`}
        >
          History
        </button>
        <button
          type='button'
          onClick={() => handleViewPayslips(employee)}
          className={`${ROW_ACTION_CLASS} border-gray-700 text-gray-300 hover:text-white hover:border-gray-500`}
        >
          Payslips
        </button>
      </>
    );
  };

  return (
    <div className='@container pb-20'>
      <PageHeader
        title='Employees'
        description='Everyone on the team — their records, promotions, salary changes and payslips.'
        actions={
          <button type='button' onClick={() => setShowCreateModal(true)} className={PRIMARY_ACTION_CLASS}>
            + Add employee
          </button>
        }
      />

      {/* Filters */}
      <div className='glass p-4 rounded-lg mb-6'>
        <div className={FILTER_GRID_CLASS}>
          <FilterField label='Search'>
            <input
              type='search'
              placeholder='Name, email or ID…'
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className={FIELD_CLASS}
            />
          </FilterField>
          <FilterField label='Status'>
            <select
              value={filters.status || 'active'}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className={FIELD_CLASS}
            >
              <option value='active'>Active</option>
              <option value='inactive'>Inactive</option>
              <option value='all'>All Statuses</option>
            </select>
          </FilterField>
          <FilterField label='Department'>
            <select
              value={filters.department || ''}
              onChange={(e) => handleFilterChange('department', e.target.value)}
              className={FIELD_CLASS}
            >
              <option value=''>All Departments</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </FilterField>
          <FilterField label='Employment Type'>
            <select
              value={filters.employment_type || ''}
              onChange={(e) => handleFilterChange('employment_type', e.target.value)}
              className={FIELD_CLASS}
            >
              <option value=''>All Types</option>
              <option value='full-time'>Full-Time</option>
              <option value='part-time'>Part-Time</option>
              <option value='contract'>Contract</option>
              <option value='temporary'>Temporary</option>
              <option value='freelancer'>Freelancer</option>
              <option value='intern'>Intern</option>
              <option value='consultant'>Consultant</option>
            </select>
          </FilterField>
        </div>
      </div>

      {/* Employees */}
      <div className='glass rounded-lg overflow-hidden'>
        {employees.length === 0 ? (
          <div className='text-center py-14 px-4'>
            <p className='text-gray-300 font-medium'>No employees match these filters</p>
            <p className='text-sm text-gray-500 mt-1'>Try another status or department, or clear the search.</p>
            <button type='button' onClick={() => setShowCreateModal(true)} className={`${PRIMARY_ACTION_CLASS} mt-5`}>
              + Add employee
            </button>
          </div>
        ) : (
          <>
            {/* Wide containers: the table. ID and email ride under the
                name and department under the role, which takes it from
                eight columns to six. */}
            <div className='hidden @min-[58rem]:block'>
              <Table compact headers={['Employee', 'Role', 'Employment', 'Salary', 'Status', 'Actions']}>
                {employees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className='min-w-48'>
                      <p className='font-medium text-white'>{employee.name}</p>
                      <p className='text-xs text-gray-500'>
                        {employee.employee_id} · {employee.email}
                      </p>
                      <p className='text-xs text-gray-600'>
                        Joined {formatDisplayDate(employee.joining_date)}
                        {employee.date_of_birth && <> · DOB {formatDisplayDate(employee.date_of_birth)}</>}
                      </p>
                    </TableCell>
                    <TableCell className='min-w-36'>
                      <p className='text-gray-300'>{employee.role}</p>
                      <p className='text-xs text-gray-500'>{employee.department}</p>
                    </TableCell>
                    <TableCell>{renderEmployment(employee)}</TableCell>
                    <TableCell>{renderSalary(employee)}</TableCell>
                    <TableCell>{renderStatus(employee)}</TableCell>
                    <TableCell className='min-w-44'>
                      <div className='flex flex-col gap-1.5'>
                        <div className='flex gap-1'>{renderEditDelete(employee)}</div>
                        <div className='flex gap-1.5 flex-wrap'>{renderCareerActions(employee)}</div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </Table>
            </div>

            {/* Narrow containers: one card per person — who and their
                status on top, role/employment/salary beneath, every action
                the table row offers in the footer. */}
            <ul className='@min-[58rem]:hidden grid grid-cols-1 @3xl:grid-cols-2 -mb-px'>
              {employees.map((employee) => (
                <li key={employee.id} className='p-4 min-w-0 border-b border-gray-800/70 @3xl:odd:border-r'>
                  <div className='flex items-start justify-between gap-3'>
                    <div className='min-w-0'>
                      <p className='font-semibold text-white [overflow-wrap:anywhere]'>{employee.name}</p>
                      <p className='text-xs text-gray-500 [overflow-wrap:anywhere]'>
                        {employee.employee_id} · {employee.email}
                      </p>
                    </div>
                    <div className='shrink-0'>{renderStatus(employee)}</div>
                  </div>
                  <p className='mt-2 text-sm text-gray-300'>
                    {employee.role}
                    <span className='text-gray-500'> · {employee.department}</span>
                  </p>
                  <div className='mt-3 flex items-start justify-between gap-3'>
                    {renderEmployment(employee)}
                    <div className='text-right'>{renderSalary(employee)}</div>
                  </div>
                  <p className='mt-2 text-xs text-gray-600'>
                    Joined {formatDisplayDate(employee.joining_date)}
                    {employee.date_of_birth && <> · DOB {formatDisplayDate(employee.date_of_birth)}</>}
                  </p>
                  <div className='mt-3 flex flex-wrap items-center gap-1.5'>
                    {renderCareerActions(employee)}
                    <span className='ml-auto flex items-center gap-1'>{renderEditDelete(employee)}</span>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title='Add New Employee'
      >
        <EmployeeForm
          onSuccess={() => {
            setShowCreateModal(false);
            router.refresh();
          }}
          departments={departments}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedEmployee(null);
        }}
        title='Edit Employee'
      >
        {selectedEmployee && (
          <EmployeeForm
            employee={selectedEmployee}
            onSuccess={() => {
              setShowEditModal(false);
              setSelectedEmployee(null);
              router.refresh();
            }}
            departments={departments}
          />
        )}
      </Modal>

      {/* Career Change Modal */}
      {selectedEmployee && (
        <CareerChangeModal
          isOpen={showCareerModal}
          onClose={() => {
            setShowCareerModal(false);
            setSelectedEmployee(null);
            setCareerChangeType(undefined);
          }}
          employee={selectedEmployee}
          defaultChangeType={careerChangeType}
          departments={departments}
          onSuccess={() => {
            setShowCareerModal(false);
            setSelectedEmployee(null);
            setCareerChangeType(undefined);
            router.refresh();
          }}
        />
      )}

      {/* Career History Modal */}
      <Modal
        isOpen={showHistoryModal}
        onClose={() => {
          setShowHistoryModal(false);
          setSelectedEmployee(null);
          setCareerHistory([]);
        }}
        title={`Career History — ${selectedEmployee?.name || ''}`}
      >
        {loadingHistory ? (
          <div className='text-center py-10'>
            <div className='w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-3' />
            <p className='text-gray-400 text-sm'>Loading history…</p>
          </div>
        ) : (
          <div className='max-h-[70vh] overflow-y-auto pr-1'>
            {/* Quick action inside history modal */}
            {selectedEmployee && (
              <div className='flex gap-2 mb-5 flex-wrap'>
                {selectedEmployee.employment_type === 'intern' && (
                  <button
                    onClick={() => {
                      setShowHistoryModal(false);
                      handleCareerChange(selectedEmployee, 'intern_conversion');
                    }}
                    className='text-xs px-3 py-1.5 rounded-lg bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 transition-colors font-medium border border-yellow-500/30'
                  >
                    🎓 Convert Intern
                  </button>
                )}
                {selectedEmployee.employment_type !== 'intern' && selectedEmployee.status === 'active' && (
                  <button
                    onClick={() => {
                      setShowHistoryModal(false);
                      handleCareerChange(selectedEmployee, 'promotion');
                    }}
                    className='text-xs px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors font-medium border border-green-500/30'
                  >
                    🚀 Promote
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowHistoryModal(false);
                    handleCareerChange(selectedEmployee, 'salary_revision');
                  }}
                  className='text-xs px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition-colors font-medium border border-cyan-500/30'
                >
                  💰 Revise Salary
                </button>
                <button
                  onClick={() => {
                    setShowHistoryModal(false);
                    handleCareerChange(selectedEmployee, 'department_change');
                  }}
                  className='text-xs px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors font-medium border border-purple-500/30'
                >
                  🏢 Change Dept
                </button>
              </div>
            )}
            <EmployeeCareerHistoryComponent
              history={careerHistory}
              employeeName={selectedEmployee?.name || ''}
            />
          </div>
        )}
      </Modal>

      {/* Payslips Modal */}
      <Modal
        isOpen={showPayslipsModal}
        onClose={() => {
          setShowPayslipsModal(false);
          setSelectedEmployee(null);
          setPayslips([]);
        }}
        title={`Payslips — ${selectedEmployee?.name || ''}`}
      >
        {loadingPayslips ? (
          <div className='text-center py-10'>
            <div className='w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-3' />
            <p className='text-gray-400 text-sm'>Loading payslips…</p>
          </div>
        ) : (
          selectedEmployee && (
            <div className='max-h-[70vh] overflow-y-auto pr-1'>
              <AdminEmployeePayslips
                history={payslips}
                onChanged={() => getEmployeePayrollHistoryAction(selectedEmployee.id).then(setPayslips)}
              />
            </div>
          )
        )}
      </Modal>
    </div>
  );
}
