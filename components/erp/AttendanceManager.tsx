'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { m as motion } from 'framer-motion';
import { Table, TableRow, TableCell } from './Table';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import AttendanceForm from './AttendanceForm';
import type { Employee, Attendance } from '@/types/erp';
import { formatDisplayDate, getMonthName } from '@/lib/erp/utils';
import toast from 'react-hot-toast';
import { deleteAttendanceAction } from '@/actions/erp/attendance';

interface AttendanceManagerProps {
  employees: Employee[];
  attendance: Attendance[];
  initialMonth: string;
  initialEmployeeId?: number;
}

export default function AttendanceManager({
  employees,
  attendance,
  initialMonth,
  initialEmployeeId,
}: AttendanceManagerProps) {
  const router = useRouter();
  const [showAddModal, setShowAddModal] = useState(false);
  const [month, setMonth] = useState(initialMonth);
  const [employeeId, setEmployeeId] = useState<number | undefined>(
    initialEmployeeId,
  );

  const handleFilterChange = () => {
    const params = new URLSearchParams();
    params.set('month', month);
    if (employeeId) params.set('employee_id', employeeId.toString());

    router.push(`/erp/attendance?${params.toString()}`);
  };

  const handleDelete = async (record: Attendance) => {
    if (!confirm('Are you sure you want to delete this attendance record?')) {
      return;
    }

    const result = await deleteAttendanceAction(
      record.employee_id,
      record.date,
    );
    if (result.success) {
      toast.success('Attendance deleted successfully');
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to delete attendance');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-500/20 text-green-400';
      case 'absent':
        return 'bg-red-500/20 text-red-400';
      case 'half-day':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'paid-leave':
        return 'bg-blue-500/20 text-blue-400';
      case 'unpaid-leave':
        return 'bg-orange-500/20 text-orange-400';
      case 'holiday':
        return 'bg-purple-500/20 text-purple-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const employeeMap = new Map(employees.map((e) => [e.id, e]));

  return (
    <div>
      {/* Header */}
      <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8'>
        <div>
          <h1 className='text-3xl font-bold gradient-text'>
            Attendance Management
          </h1>
          <p className='text-gray-400 mt-2'>
            Track daily attendance for all employees
          </p>
        </div>
        <Button 
          variant='primary' 
          onClick={() => setShowAddModal(true)}
          className='whitespace-nowrap'
        >
          + Add Attendance
        </Button>
      </div>

      {/* Filters */}
      <div className='glass p-4 rounded-lg mb-6'>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <div>
            <label className='block text-sm font-medium mb-2'>Month</label>
            <input
              type='month'
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
            />
          </div>
          <div>
            <label className='block text-sm font-medium mb-2'>Employee</label>
            <select
              value={employeeId || ''}
              onChange={(e) =>
                setEmployeeId(
                  e.target.value ? parseInt(e.target.value) : undefined,
                )
              }
              className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
            >
              <option value=''>All Employees</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.employee_id})
                </option>
              ))}
            </select>
          </div>
          <div className='flex items-end'>
            <Button
              variant='secondary'
              onClick={handleFilterChange}
              className='w-full'
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-6'>
        <div className='glass p-4 rounded-lg'>
          <p className='text-sm text-gray-400'>Total Records</p>
          <p className='text-2xl font-bold text-white mt-1'>
            {attendance.length}
          </p>
        </div>
        <div className='glass p-4 rounded-lg'>
          <p className='text-sm text-gray-400'>Present</p>
          <p className='text-2xl font-bold text-green-400 mt-1'>
            {attendance.filter((a) => a.status === 'present').length}
          </p>
        </div>
        <div className='glass p-4 rounded-lg'>
          <p className='text-sm text-gray-400'>Absent</p>
          <p className='text-2xl font-bold text-red-400 mt-1'>
            {attendance.filter((a) => a.status === 'absent').length}
          </p>
        </div>
        <div className='glass p-4 rounded-lg'>
          <p className='text-sm text-gray-400'>Leaves</p>
          <p className='text-2xl font-bold text-blue-400 mt-1'>
            {
              attendance.filter(
                (a) => a.status === 'paid-leave' || a.status === 'unpaid-leave',
              ).length
            }
          </p>
        </div>
      </div>

      {/* Attendance Table */}
      <div className='glass rounded-lg overflow-hidden'>
        {attendance.length === 0 ? (
          <div className='text-center py-12'>
            <p className='text-gray-400 mb-4'>No attendance records found</p>
            <Button variant='primary' onClick={() => setShowAddModal(true)}>
              Add First Record
            </Button>
          </div>
        ) : (
          <Table
            headers={[
              'Date',
              'Employee',
              'Department',
              'Status',
              'Notes',
              'Actions',
            ]}
          >
            {attendance.map((record) => {
              const employee = employeeMap.get(record.employee_id);
              return (
                <TableRow key={`${record.employee_id}-${record.date}`}>
                  <TableCell>
                    <div className='font-medium text-white'>
                      {formatDisplayDate(record.date)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className='font-medium text-white'>
                      {employee?.name}
                    </div>
                    <div className='text-xs text-gray-500'>
                      {employee?.employee_id}
                    </div>
                  </TableCell>
                  <TableCell>{employee?.department}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        record.status,
                      )}`}
                    >
                      {record.status.replace('-', ' ')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className='text-xs text-gray-400'>
                      {record.notes || '-'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => handleDelete(record)}
                      className='text-red-400 hover:text-red-300 transition-colors text-sm'
                    >
                      Delete
                    </button>
                  </TableCell>
                </TableRow>
              );
            })}
          </Table>
        )}
      </div>

      {/* Add Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title='Add Attendance Record'
      >
        <AttendanceForm
          employees={employees}
          onSuccess={() => {
            setShowAddModal(false);
            router.refresh();
          }}
        />
      </Modal>
    </div>
  );
}
