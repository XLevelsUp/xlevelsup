'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Table, TableRow, TableCell } from './Table';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { DeleteIcon } from './ActionIcons';
import MonthPicker from './MonthPicker';
import SensitiveValue from './SensitiveValue';
import DeleteConfirmButton from './DeleteConfirmButton';
import type { PayrollWithEmployee } from '@/types/erp';
import { formatCurrency, formatDisplayDate, getMonthName, computeNetSalary } from '@/lib/erp/utils';
import toast from 'react-hot-toast';
import {
  generatePayrollAction,
  updatePayrollStatusAction,
  updatePayrollDeductionsAction,
  markPayrollPaidAction,
  deletePayrollAction,
  deletePayrollForMonthAction,
  getPayslipForPayrollAction,
  type MissingAttendance,
} from '@/actions/erp/payroll';

/** An employee who can be included in a payroll run (not intern/freelancer). */
export interface PayrollEligibleEmployee {
  id: number;
  name: string;
  employee_id: string;
  employment_type?: string;
}

interface PayrollManagerProps {
  payroll: PayrollWithEmployee[];
  initialMonth: string;
  initialStatus?: string;
  eligibleEmployees: PayrollEligibleEmployee[];
}

/**
 * Open a payroll row's payslip in a new tab: the stored final PDF for a paid
 * month, or an on-the-fly watermarked preview otherwise.
 */
export async function openPayrollPayslip(payrollId: number): Promise<void> {
  // Opened synchronously, before the await, so the browser treats it as a
  // user-initiated popup rather than blocking it.
  const tab = window.open('', '_blank');
  const result = await getPayslipForPayrollAction(payrollId);
  if (!result.success) {
    tab?.close();
    toast.error(result.error || 'Could not open payslip');
    return;
  }
  let url = result.url;
  if (!url && result.previewBase64) {
    const bytes = Uint8Array.from(atob(result.previewBase64), (c) => c.charCodeAt(0));
    url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
  }
  if (!url) {
    tab?.close();
    toast.error('Could not open payslip');
    return;
  }
  if (tab) tab.location.href = url;
  else window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Unpaid days behind a record — working days the employee wasn't paid for.
 * Derived rather than stored: the payroll table has no lop column, so this
 * mirrors computeNetSalary() in lib/erp/utils.ts.
 */
function lopDaysOf(record: PayrollWithEmployee): number {
  return Math.max(0, record.total_working_days - record.payable_days);
}

/** Rupee value of those unpaid days — the gap between gross and net. */
function lopDeductionOf(record: PayrollWithEmployee): number {
  return computeNetSalary(record).lop_deduction;
}

export default function PayrollManager({
  payroll,
  initialMonth,
  initialStatus,
  eligibleEmployees,
}: PayrollManagerProps) {
  const router = useRouter();
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showDeleteMonthModal, setShowDeleteMonthModal] = useState(false);
  const [month, setMonth] = useState(initialMonth);
  const [status, setStatus] = useState(initialStatus || '');
  const [generating, setGenerating] = useState(false);
  const [generateMonth, setGenerateMonth] = useState(initialMonth);
  // Set when a generate run is refused for unrecorded attendance — shown in
  // the dialog so the gaps can be fixed (or those employees deselected).
  const [missingAttendance, setMissingAttendance] = useState<MissingAttendance[]>([]);
  const [deleteMonthValue, setDeleteMonthValue] = useState(initialMonth);
  const [deletingMonth, setDeletingMonth] = useState(false);
  const [markPaidRecord, setMarkPaidRecord] = useState<PayrollWithEmployee | null>(null);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [markingPaid, setMarkingPaid] = useState(false);
  const [deductionsRecord, setDeductionsRecord] = useState<PayrollWithEmployee | null>(null);
  const [savingDeductions, setSavingDeductions] = useState(false);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<Set<number>>(
    () => new Set(eligibleEmployees.map((e) => e.id)),
  );
  const [openingPayslipId, setOpeningPayslipId] = useState<number | null>(null);

  const toggleEmployee = (id: number) =>
    setSelectedEmployeeIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const handleOpenPayslip = async (id: number) => {
    setOpeningPayslipId(id);
    try {
      await openPayrollPayslip(id);
    } finally {
      setOpeningPayslipId(null);
    }
  };

  const applyFilters = (overrides?: Partial<{ month: string; status: string }>) => {
    const next = { month, status, ...overrides };
    const params = new URLSearchParams();
    params.set('month', next.month);
    if (next.status) params.set('status', next.status);

    router.push(`/erp/payroll?${params.toString()}`);
  };

  const handleGenerate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (selectedEmployeeIds.size === 0) {
      toast.error('Select at least one employee');
      return;
    }
    setGenerating(true);
    setMissingAttendance([]);

    const formData = new FormData(e.currentTarget);
    // All selected = no filter, so employees added later are never silently
    // left out of a "generate everyone" run.
    if (selectedEmployeeIds.size < eligibleEmployees.length) {
      selectedEmployeeIds.forEach((id) => formData.append('employee_ids', String(id)));
    }
    const result = await generatePayrollAction(formData);

    setGenerating(false);

    if (result.success) {
      toast.success(
        `Payroll generated! ${result.payroll?.generated ?? 0} records created, ${result.payroll?.skipped ?? 0} skipped`,
        { duration: 3000 },
      );
      setShowGenerateModal(false);
      router.refresh();
    } else {
      setMissingAttendance(result.payroll?.missingAttendance ?? []);
      toast.error(result.error || 'Failed to generate payroll');
    }
  };

  const handleStatusChange = async (
    id: number,
    newStatus: 'draft' | 'approved',
  ) => {
    const result = await updatePayrollStatusAction(id, newStatus);
    if (result.success) {
      toast.success('Status updated successfully');
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to update status');
    }
  };

  const handleMarkPaid = async () => {
    if (!markPaidRecord || !referenceNumber.trim()) return;

    setMarkingPaid(true);
    const result = await markPayrollPaidAction(markPaidRecord.id, referenceNumber.trim());
    setMarkingPaid(false);

    if (result.success) {
      toast.success('Marked as paid — recorded in the financial ledger');
      setMarkPaidRecord(null);
      setReferenceNumber('');
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to mark as paid');
    }
  };

  const handleDelete = async (id: number) => {
    const result = await deletePayrollAction(id);
    if (result.success) {
      toast.success('Payroll deleted successfully');
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to delete payroll');
    }
  };

  // Gates the confirmation popover itself: clicking "Delete Payroll for
  // Month" with nothing selected should surface the existing validation
  // toast, not a confirmation for a month that isn't chosen yet.
  const canDeleteMonth = () => {
    if (!deleteMonthValue) {
      toast.error('Select a month');
      return false;
    }
    return true;
  };

  const handleDeleteMonth = async () => {
    setDeletingMonth(true);
    const result = await deletePayrollForMonthAction(deleteMonthValue);
    setDeletingMonth(false);

    if (result.success) {
      const kept = result.payroll?.keptPaidCount ?? 0;
      toast.success(
        `Deleted ${result.payroll?.deletedCount ?? 0} payroll record(s) for ${getMonthName(deleteMonthValue)}.` +
          (kept > 0 ? ` ${kept} paid (finalized) record(s) were kept.` : '') +
          ' You can now generate fresh ones for this month.',
        { duration: 5000 },
      );
      setShowDeleteMonthModal(false);
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to delete payroll for month');
    }
  };

  const handleSaveDeductions = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!deductionsRecord) return;
    setSavingDeductions(true);

    const formData = new FormData(e.currentTarget);
    const result = await updatePayrollDeductionsAction(deductionsRecord.id, formData);

    setSavingDeductions(false);
    if (result.success) {
      toast.success('Deductions updated');
      setDeductionsRecord(null);
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to update deductions');
    }
  };

  const totalPayable = payroll.reduce((sum, p) => sum + p.net_salary, 0);
  const totalStructuredDeductionsOf = (record: PayrollWithEmployee) =>
    record.pf_deduction + record.esi_deduction + record.professional_tax_deduction +
    record.tds_deduction + record.other_structured_deduction;

  return (
    <div>
      {/* Header */}
      <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8'>
        <div>
          <h1 className='text-3xl font-bold gradient-text'>
            Payroll Management
          </h1>
          <p className='text-gray-400 mt-2'>
            Generate and manage employee salaries
          </p>
        </div>
        <div className='flex items-center gap-3'>
          <Button
            variant='secondary'
            onClick={() => {
              setDeleteMonthValue(month);
              setShowDeleteMonthModal(true);
            }}
            className='whitespace-nowrap !text-red-400 !outline-red-500/60 hover:!outline-red-400'
          >
            Delete Month
          </Button>
          <Button
            variant='primary'
            onClick={() => {
              setGenerateMonth(month);
              setShowGenerateModal(true);
            }}
            className='whitespace-nowrap'
          >
            Generate Payroll
          </Button>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className='flex gap-2 mb-6 border-b border-gray-800'>
        <div className='px-4 py-2.5 text-sm font-medium text-cyan border-b-2 border-cyan -mb-px'>
          Payroll
        </div>
        <Link
          href='/erp/payroll?tab=salary-structures'
          className='px-4 py-2.5 text-sm font-medium text-gray-400 hover:text-white transition-colors'
        >
          Salary Structures
        </Link>
      </div>

      {/* Filters */}
      <div className='glass p-4 rounded-lg mb-6'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <label className='block text-sm font-medium mb-2'>Month</label>
            <MonthPicker
              value={month}
              onChange={(next) => {
                setMonth(next);
                applyFilters({ month: next });
              }}
              required
            />
          </div>
          <div>
            <label className='block text-sm font-medium mb-2'>Status</label>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                applyFilters({ status: e.target.value });
              }}
              className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
            >
              <option value=''>All Statuses</option>
              <option value='draft'>Draft</option>
              <option value='approved'>Approved</option>
              <option value='paid'>Paid</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-6'>
        <div className='glass p-4 rounded-lg'>
          <p className='text-sm text-gray-400'>Total Records</p>
          <p className='text-2xl font-bold text-white mt-1'>{payroll.length}</p>
        </div>
        <div className='glass p-4 rounded-lg'>
          <p className='text-sm text-gray-400'>Total Payable</p>
          <p className='text-2xl font-bold text-cyan mt-1'>
            <SensitiveValue>{formatCurrency(totalPayable)}</SensitiveValue>
          </p>
        </div>
        <div className='glass p-4 rounded-lg'>
          <p className='text-sm text-gray-400'>Approved</p>
          <p className='text-2xl font-bold text-green-400 mt-1'>
            {payroll.filter((p) => p.status === 'approved').length}
          </p>
        </div>
        <div className='glass p-4 rounded-lg'>
          <p className='text-sm text-gray-400'>Paid</p>
          <p className='text-2xl font-bold text-blue-400 mt-1'>
            {payroll.filter((p) => p.status === 'paid').length}
          </p>
        </div>
      </div>

      {/* Payroll Table */}
      <div className='glass rounded-lg overflow-hidden'>
        {payroll.length === 0 ? (
          <div className='text-center py-12'>
            <p className='text-gray-400 mb-4'>No payroll records found</p>
            <Button
              variant='primary'
              onClick={() => setShowGenerateModal(true)}
            >
              Generate Payroll
            </Button>
          </div>
        ) : (
          <Table
            headers={[
              'Employee',
              'Department',
              'Working Days',
              'Payable Days',
              'Gross Salary',
              'Net Salary',
              'Status',
              'Actions',
            ]}
          >
            {payroll.map((record) => (
              <TableRow key={record.id}>
                <TableCell>
                  <div className='font-medium text-white'>
                    {record.employee_name}
                  </div>
                  <div className='text-xs text-gray-500'>
                    {record.employee_role}
                  </div>
                </TableCell>
                <TableCell>{record.employee_department}</TableCell>
                <TableCell>{record.total_working_days}</TableCell>
                <TableCell>
                  {record.payable_days.toFixed(1)}
                  <div className='text-xs text-gray-500'>
                    P:{record.present_days} H:{record.half_days} L:
                    {record.paid_leave_days}
                    {lopDaysOf(record) > 0 &&
                      ` A:${lopDaysOf(record).toFixed(1)}`}
                  </div>
                </TableCell>
                <TableCell>
                  <SensitiveValue>{formatCurrency(record.gross_salary)}</SensitiveValue>
                  {record.basic_salary != null && (
                    <div className='text-xs text-gray-500'>
                      <SensitiveValue>
                        B:{formatCurrency(record.basic_salary || 0)} H:{formatCurrency(record.hra || 0)} S:
                        {formatCurrency(record.special_allowance || 0)} O:
                        {formatCurrency(record.other_allowance || 0)}
                      </SensitiveValue>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className='font-medium text-white'>
                    <SensitiveValue>{formatCurrency(record.net_salary)}</SensitiveValue>
                  </div>
                  {(record.bonus > 0 ||
                    record.deduction > 0 ||
                    lopDeductionOf(record) > 0 ||
                    totalStructuredDeductionsOf(record) > 0) && (
                    <div className='text-xs text-gray-500'>
                      <SensitiveValue>
                        {lopDeductionOf(record) > 0 &&
                          `-${formatCurrency(lopDeductionOf(record))} LOP `}
                        {totalStructuredDeductionsOf(record) > 0 &&
                          `-${formatCurrency(totalStructuredDeductionsOf(record))} deductions `}
                        {record.bonus > 0 && `+${formatCurrency(record.bonus)} `}
                        {record.deduction > 0 &&
                          `-${formatCurrency(record.deduction)}`}
                      </SensitiveValue>
                    </div>
                  )}
                  {record.status !== 'paid' && (
                    <button
                      type='button'
                      onClick={() => setDeductionsRecord(record)}
                      className='text-xs text-cyan hover:text-cyan/80 transition-colors mt-1'
                    >
                      Edit Deductions
                    </button>
                  )}
                </TableCell>
                <TableCell>
                  {record.status === 'paid' ? (
                    <span
                      className='inline-block px-2 py-1 rounded text-xs font-medium bg-blue-500/10 text-blue-300 border border-blue-500/30 whitespace-nowrap'
                      title='Paid — the payslip is finalized and its figures can no longer change'
                    >
                      Paid · Finalized
                    </span>
                  ) : (
                  <select
                    value={record.status}
                    onChange={(e) => {
                      const newStatus = e.target.value as 'draft' | 'approved' | 'paid';
                      if (newStatus === 'paid') {
                        setMarkPaidRecord(record);
                        setReferenceNumber('');
                      } else {
                        handleStatusChange(record.id, newStatus);
                      }
                    }}
                    className='px-2 py-1 rounded text-xs font-medium bg-dark-800 border border-gray-700 text-white'
                  >
                    <option value='draft'>Draft</option>
                    <option value='approved'>Approved</option>
                    <option value='paid'>Paid</option>
                  </select>
                  )}
                </TableCell>
                <TableCell>
                  <div className='flex items-center gap-3'>
                    <button
                      type='button'
                      onClick={() => handleOpenPayslip(record.id)}
                      disabled={openingPayslipId === record.id}
                      title={record.status === 'paid' ? 'View / download the final payslip' : 'Preview the payslip (not yet paid)'}
                      className='text-cyan hover:text-cyan/80 text-xs font-medium whitespace-nowrap transition-colors disabled:opacity-50'
                    >
                      {openingPayslipId === record.id
                        ? 'Opening…'
                        : record.status === 'paid'
                          ? 'Payslip'
                          : 'Preview'}
                    </button>
                    {record.status !== 'paid' && (
                      <DeleteConfirmButton
                        onConfirm={() => handleDelete(record.id)}
                        message='Are you sure you want to delete this payroll record?'
                        title='Delete'
                        ariaLabel='Delete'
                        className='text-red-400 hover:text-red-300 transition-colors'
                      >
                        <DeleteIcon />
                      </DeleteConfirmButton>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </Table>
        )}
      </div>

      {/* Generate Modal */}
      <Modal
        isOpen={showGenerateModal}
        onClose={() => {
          setShowGenerateModal(false);
          setMissingAttendance([]);
        }}
        title='Generate Payroll'
      >
        <form onSubmit={handleGenerate} className='space-y-4'>
          <p className='text-gray-300'>
            Generates a draft payroll record for each selected employee, using
            the salary structure effective for that month. Employees who already
            have a record for the month are skipped, so nothing is duplicated.
            Interns and freelancers are never included. Every working day must
            have attendance recorded — nothing is generated until it does.
          </p>
          <div>
            <label className='block text-sm font-medium mb-2'>Month *</label>
            <MonthPicker
              value={generateMonth}
              onChange={(value) => {
                setGenerateMonth(value);
                setMissingAttendance([]);
              }}
              name='month'
              required
            />
          </div>
          <div>
            <div className='flex items-center justify-between mb-2'>
              <span className='block text-sm font-medium'>
                Employees ({selectedEmployeeIds.size}/{eligibleEmployees.length})
              </span>
              <button
                type='button'
                onClick={() =>
                  setSelectedEmployeeIds(
                    selectedEmployeeIds.size === eligibleEmployees.length
                      ? new Set()
                      : new Set(eligibleEmployees.map((e) => e.id)),
                  )
                }
                className='text-xs text-cyan hover:text-cyan/80 transition-colors'
              >
                {selectedEmployeeIds.size === eligibleEmployees.length ? 'Clear all' : 'Select all'}
              </button>
            </div>
            <div className='max-h-56 overflow-y-auto rounded-lg border border-gray-700 divide-y divide-gray-800'>
              {eligibleEmployees.map((employee) => (
                <label
                  key={employee.id}
                  className='flex items-center gap-3 px-3 py-2 text-sm cursor-pointer hover:bg-dark-800/60'
                >
                  <input
                    type='checkbox'
                    checked={selectedEmployeeIds.has(employee.id)}
                    onChange={() => toggleEmployee(employee.id)}
                    className='accent-cyan'
                  />
                  <span className='text-white'>{employee.name}</span>
                  <span className='text-xs text-gray-500 ml-auto'>
                    {employee.employee_id}
                    {employee.employment_type && employee.employment_type !== 'full-time'
                      ? ` · ${employee.employment_type}`
                      : ''}
                  </span>
                </label>
              ))}
            </div>
          </div>
          {missingAttendance.length > 0 && (
            <div className='bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-300 space-y-2'>
              <p className='font-medium'>
                Attendance not recorded — nothing was generated. Record these
                days on the Attendance page, or deselect the employee.
              </p>
              <ul className='space-y-1 max-h-40 overflow-y-auto'>
                {missingAttendance.map((m) => (
                  <li key={m.employee}>
                    <span className='text-white'>{m.employee}</span>
                    {m.dates.length > 0 && (
                      <div>No attendance: {m.dates.map((d) => formatDisplayDate(d)).join(', ')}</div>
                    )}
                    {m.offDayDates.length > 0 && (
                      <div>
                        Weekend/holiday with no clock-out or hours:{' '}
                        {m.offDayDates.map((d) => formatDisplayDate(d)).join(', ')}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <Button
            type='submit'
            variant='primary'
            className='w-full'
            disabled={generating}
          >
            {generating ? 'Generating...' : 'Generate Payroll'}
          </Button>
        </form>
      </Modal>

      {/* Delete Month Modal */}
      <Modal
        isOpen={showDeleteMonthModal}
        onClose={() => setShowDeleteMonthModal(false)}
        title='Delete Payroll for Month'
      >
        <div className='space-y-4'>
          <p className='text-gray-300'>
            This permanently deletes the draft and approved payroll records for
            the selected month. Use this when you need to re-run payroll for a
            month from scratch — after deleting, use{' '}
            <span className='font-medium text-white'>Generate Payroll</span> to
            create fresh records for the same month.
          </p>
          <div className='bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-300'>
            This cannot be undone. Paid records are finalized and are always
            kept — they back an issued payslip and a ledger payment, and
            deleting them would allow the month to be paid twice.
          </div>
          <div>
            <label className='block text-sm font-medium mb-2'>Month *</label>
            <MonthPicker
              value={deleteMonthValue}
              onChange={setDeleteMonthValue}
              required
            />
          </div>
          <DeleteConfirmButton
            variant='button'
            onConfirm={handleDeleteMonth}
            onBeforeOpen={canDeleteMonth}
            message={
              deleteMonthValue
                ? `This will permanently delete the draft and approved payroll records for ${getMonthName(deleteMonthValue)}. Paid records are kept. This cannot be undone. Continue?`
                : ''
            }
            confirmLabel='Delete'
            confirmingLabel='Deleting...'
            className='w-full !text-red-400 !outline-red-500/60 hover:!outline-red-400'
            disabled={deletingMonth}
          >
            Delete Payroll for Month
          </DeleteConfirmButton>
        </div>
      </Modal>

      {/* Mark Paid Modal */}
      <Modal
        isOpen={!!markPaidRecord}
        onClose={() => {
          setMarkPaidRecord(null);
          setReferenceNumber('');
        }}
        title='Mark Payroll as Paid'
      >
        {markPaidRecord && (
          <div className='space-y-4'>
            <div className='bg-dark-800/50 border border-gray-700 rounded-lg p-3'>
              <p className='text-sm font-medium text-white'>
                {markPaidRecord.employee_name}
              </p>
              <p className='text-xs text-gray-400'>
                {getMonthName(markPaidRecord.month)}
              </p>
              <p className='text-lg font-bold text-cyan mt-1'>
                <SensitiveValue>{formatCurrency(markPaidRecord.net_salary)}</SensitiveValue>
              </p>
            </div>
            <p className='text-sm text-gray-300'>
              This confirms the salary was paid by bank transfer and automatically
              records it in the financial ledger. A reference ID is required.
            </p>
            <div>
              <label className='block text-sm font-medium mb-2'>
                Bank Transfer Reference ID *
              </label>
              <input
                type='text'
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder='e.g. UTR / transaction reference number'
                disabled={markingPaid}
                className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
              />
            </div>
            <Button
              type='button'
              variant='primary'
              className='w-full'
              disabled={!referenceNumber.trim() || markingPaid}
              onClick={handleMarkPaid}
            >
              {markingPaid ? 'Marking as Paid...' : 'Confirm & Mark Paid'}
            </Button>
          </div>
        )}
      </Modal>

      {/* Deductions Modal */}
      <Modal
        isOpen={!!deductionsRecord}
        onClose={() => setDeductionsRecord(null)}
        title='Edit Deductions'
      >
        {deductionsRecord && (
          <form onSubmit={handleSaveDeductions} className='space-y-4'>
            <div className='bg-dark-800/50 border border-gray-700 rounded-lg p-3'>
              <p className='text-sm font-medium text-white'>{deductionsRecord.employee_name}</p>
              <p className='text-xs text-gray-400'>{getMonthName(deductionsRecord.month)}</p>
            </div>
            <p className='text-sm text-gray-300'>
              None of these apply automatically — leave any that don&apos;t apply to this employee at ₹0.
            </p>
            <div className='grid grid-cols-2 gap-3'>
              {[
                { name: 'pf_deduction', label: 'PF', value: deductionsRecord.pf_deduction },
                { name: 'esi_deduction', label: 'ESI', value: deductionsRecord.esi_deduction },
                { name: 'professional_tax_deduction', label: 'Professional Tax', value: deductionsRecord.professional_tax_deduction },
                { name: 'tds_deduction', label: 'TDS', value: deductionsRecord.tds_deduction },
                { name: 'other_structured_deduction', label: 'Other', value: deductionsRecord.other_structured_deduction },
              ].map((field) => (
                <div key={field.name}>
                  <label className='block text-xs font-medium text-gray-400 mb-1'>{field.label}</label>
                  <input
                    type='number'
                    name={field.name}
                    min='0'
                    step='0.01'
                    defaultValue={field.value}
                    className='w-full px-3 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white text-sm'
                  />
                </div>
              ))}
            </div>
            <Button type='submit' variant='primary' className='w-full' disabled={savingDeductions}>
              {savingDeductions ? 'Saving…' : 'Save Deductions'}
            </Button>
          </form>
        )}
      </Modal>
    </div>
  );
}
