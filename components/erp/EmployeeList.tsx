'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { m as motion } from 'framer-motion';
import { Table, TableRow, TableCell } from './Table';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import EmployeeForm from './EmployeeForm';
import type { Employee } from '@/types/erp';
import { formatCurrency, formatDisplayDate } from '@/lib/erp/utils';
import toast from 'react-hot-toast';
import { deleteEmployeeAction } from '@/actions/erp/employees';

interface EmployeeListProps {
  employees: Employee[];
  departments: string[];
  initialFilters: {
    status?: 'active' | 'inactive';
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
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null,
  );
  const [filters, setFilters] = useState(initialFilters);

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value || undefined };
    setFilters(newFilters);

    // Build query string
    const params = new URLSearchParams();
    if (newFilters.status) params.set('status', newFilters.status);
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
    if (!confirm(`Are you sure you want to delete ${employee.name}?`)) {
      return;
    }

    const result = await deleteEmployeeAction(employee.id);
    if (result.success) {
      toast.success('Employee deleted successfully');
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to delete employee');
    }
  };

  return (
    <div>
      {/* Header */}
      <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8'>
        <div>
          <h1 className='text-3xl font-bold gradient-text'>
            Employee Management
          </h1>
          <p className='text-gray-400 mt-2'>
            Manage employee records and information
          </p>
        </div>
        <Button
          variant='primary'
          onClick={() => setShowCreateModal(true)}
          className='whitespace-nowrap'
        >
          + Add Employee
        </Button>
      </div>

      {/* Filters */}
      <div className='glass p-4 rounded-lg mb-6'>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <div>
            <label className='block text-sm font-medium mb-2'>Search</label>
            <input
              type='text'
              placeholder='Name, email, or ID...'
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
            />
          </div>
          <div>
            <label className='block text-sm font-medium mb-2'>Status</label>
            <select
              value={filters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
            >
              <option value=''>All Statuses</option>
              <option value='active'>Active</option>
              <option value='inactive'>Inactive</option>
            </select>
          </div>
          <div>
            <label className='block text-sm font-medium mb-2'>Department</label>
            <select
              value={filters.department || ''}
              onChange={(e) => handleFilterChange('department', e.target.value)}
              className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
            >
              <option value=''>All Departments</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className='block text-sm font-medium mb-2'>
              Employment Type
            </label>
            <select
              value={filters.employment_type || ''}
              onChange={(e) =>
                handleFilterChange('employment_type', e.target.value)
              }
              className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
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
          </div>
        </div>
      </div>

      {/* Employee Table */}
      <div className='glass rounded-lg overflow-hidden'>
        {employees.length === 0 ? (
          <div className='text-center py-12'>
            <p className='text-gray-400 mb-4'>No employees found</p>
            <Button variant='primary' onClick={() => setShowCreateModal(true)}>
              Add First Employee
            </Button>
          </div>
        ) : (
          <Table
            headers={[
              'ID',
              'Name',
              'Email',
              'Department',
              'Role',
              'Employment',
              'Salary',
              'Status',
              'Actions',
            ]}
          >
            {employees.map((employee) => (
              <TableRow key={employee.id}>
                <TableCell>{employee.employee_id}</TableCell>
                <TableCell>
                  <div className='font-medium text-white'>{employee.name}</div>
                  <div className='text-xs text-gray-500'>
                    Joined: {formatDisplayDate(employee.joining_date)}
                  </div>
                </TableCell>
                <TableCell>{employee.email}</TableCell>
                <TableCell>{employee.department}</TableCell>
                <TableCell>{employee.role}</TableCell>
                <TableCell>
                  <div className='text-sm text-white capitalize'>
                    {employee.employment_type?.replace('-', ' ') || 'Full-Time'}
                  </div>
                  {employee.end_date && (
                    <div className='text-xs text-gray-500'>
                      Until {formatDisplayDate(employee.end_date)}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className='font-medium text-white'>
                    {employee.monthly_salary !== null &&
                    employee.monthly_salary !== undefined
                      ? formatCurrency(employee.monthly_salary)
                      : 'Unpaid'}
                  </div>
                  <div className='text-xs text-gray-500 capitalize'>
                    {employee.salary_type}
                    {employee.hourly_rate && ` · ₹${employee.hourly_rate}/hr`}
                  </div>
                </TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      employee.status === 'active'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {employee.status}
                  </span>
                </TableCell>
                <TableCell>
                  <div className='flex gap-2'>
                    <button
                      onClick={() => handleEdit(employee)}
                      className='text-cyan hover:text-purple transition-colors text-sm'
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(employee)}
                      className='text-red-400 hover:text-red-300 transition-colors text-sm'
                    >
                      Delete
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </Table>
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
    </div>
  );
}
