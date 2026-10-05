'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Table, TableRow, TableCell } from './Table';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { DeleteIcon } from './ActionIcons';
import MonthPicker from './MonthPicker';
import SensitiveValue from './SensitiveValue';
import DeleteConfirmButton from './DeleteConfirmButton';
import { StatTile } from './charts/FinanceCharts';
import {
  PageHeader,
  PageTabs,
  FilterField,
  FIELD_CLASS,
  FILTER_GRID_CLASS,
  PRIMARY_ACTION_CLASS,
  DANGER_ACTION_CLASS,
  ROW_ACTION_CLASS,
  type PageTab,
} from './PageChrome';
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

/** Both Payroll-page tabs; shared with SalaryStructureManager. */
export const PAYROLL_TABS: PageTab[] = [
  { id: 'payroll', label: 'Payroll', href: '/erp/payroll' },
  { id: 'salary-structures', label: 'Salary Structures', href: '/erp/payroll?tab=salary-structures' },
];

/** The order a payroll month moves through, with each stage's bar colour —
 * the same green/blue the status badges and old count tiles used. */
const RUN_STAGES = [
  { id: 'draft', label: 'Draft', bar: 'bg-gray-500' },
  { id: 'approved', label: 'Approved', bar: 'bg-green-500' },
  { id: 'paid', label: 'Paid', bar: 'bg-blue-400' },
] as const;

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
  const stageCounts = Object.fromEntries(
    RUN_STAGES.map((stage) => [stage.id, payroll.filter((p) => p.status === stage.id).length]),
  ) as Record<(typeof RUN_STAGES)[number]['id'], number>;

  const openGenerate = () => {
    setGenerateMonth(month);
    setShowGenerateModal(true);
  };

  // ── Record renderers ────────────────────────────────────────────────────
  // Shared by the wide-screen table and the narrow-screen cards, so the two
  // layouts can't drift apart on what a record shows or allows.

  const renderEmployee = (record: PayrollWithEmployee) => (
    <div className='min-w-0'>
      <p className='font-medium text-white [overflow-wrap:anywhere]'>{record.employee_name}</p>
      <p className='text-xs text-gray-500 [overflow-wrap:anywhere]'>{record.employee_role}</p>
    </div>
  );

  const renderDays = (record: PayrollWithEmployee) => (
    <div>
      <p className='tabular-nums whitespace-nowrap'>
        <span className='text-gray-200'>{record.payable_days.toFixed(1)}</span>
        <span className='text-gray-500'> of {record.total_working_days}</span>
      </p>
      <p className='text-[11px] text-gray-500 tabular-nums whitespace-nowrap' title='Present · Half days · Paid leave · Absent (unpaid)'>
        P:{record.present_days} H:{record.half_days} L:{record.paid_leave_days}
        {lopDaysOf(record) > 0 && ` A:${lopDaysOf(record).toFixed(1)}`}
      </p>
    </div>
  );

  const renderGross = (record: PayrollWithEmployee) => (
    <div className='min-w-0'>
      <p className='tabular-nums whitespace-nowrap'>
        <SensitiveValue>{formatCurrency(record.gross_salary)}</SensitiveValue>
      </p>
      {record.basic_salary != null && (
        <p className='text-[11px] text-gray-500 tabular-nums'>
          <SensitiveValue>
            B:{formatCurrency(record.basic_salary || 0)} H:{formatCurrency(record.hra || 0)} S:
            {formatCurrency(record.special_allowance || 0)} O:
            {formatCurrency(record.other_allowance || 0)}
          </SensitiveValue>
        </p>
      )}
    </div>
  );

  /** What sits between gross and net — LOP, statutory deductions, bonus and
   * one-off deductions. Null when nothing does. */
  const renderAdjustments = (record: PayrollWithEmployee) => {
    if (
      !(record.bonus > 0 || record.deduction > 0 || lopDeductionOf(record) > 0 || totalStructuredDeductionsOf(record) > 0)
    ) {
      return null;
    }
    return (
      <p className='text-[11px] text-gray-500 tabular-nums'>
        <SensitiveValue>
          {lopDeductionOf(record) > 0 && `-${formatCurrency(lopDeductionOf(record))} LOP `}
          {totalStructuredDeductionsOf(record) > 0 &&
            `-${formatCurrency(totalStructuredDeductionsOf(record))} deductions `}
          {record.bonus > 0 && `+${formatCurrency(record.bonus)} `}
          {record.deduction > 0 && `-${formatCurrency(record.deduction)}`}
        </SensitiveValue>
      </p>
    );
  };

  const renderEditDeductions = (record: PayrollWithEmployee, asChip = false) =>
    record.status !== 'paid' && (
      <button
        type='button'
        onClick={() => setDeductionsRecord(record)}
        className={
          asChip
            ? `${ROW_ACTION_CLASS} border-gray-700 text-gray-300 hover:text-white hover:border-gray-500`
            : 'text-xs text-cyan hover:text-cyan/80 transition-colors whitespace-nowrap'
        }
      >
        Edit deductions
      </button>
    );

  const renderStatus = (record: PayrollWithEmployee) =>
    record.status === 'paid' ? (
      <span
        className='inline-block px-2 py-1 rounded text-xs font-medium bg-blue-500/10 text-blue-300 border border-blue-500/30 whitespace-nowrap'
        title='Paid — the payslip is finalized and its figures can no longer change'
      >
        Paid · Finalized
      </span>
    ) : (
      <select
        value={record.status}
        aria-label={`Status for ${record.employee_name}`}
        onChange={(e) => {
          const newStatus = e.target.value as 'draft' | 'approved' | 'paid';
          if (newStatus === 'paid') {
            setMarkPaidRecord(record);
            setReferenceNumber('');
          } else {
            handleStatusChange(record.id, newStatus);
          }
        }}
        className='px-2 py-1 rounded text-xs font-medium bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-[var(--cyan)]'
      >
        <option value='draft'>Draft</option>
        <option value='approved'>Approved</option>
        <option value='paid'>Paid</option>
      </select>
    );

  const renderRowActions = (record: PayrollWithEmployee, asChip = false) => (
    <>
      <button
        type='button'
        onClick={() => handleOpenPayslip(record.id)}
        disabled={openingPayslipId === record.id}
        title={record.status === 'paid' ? 'View / download the final payslip' : 'Preview the payslip (not yet paid)'}
        className={
          asChip
            ? `${ROW_ACTION_CLASS} bg-cyan/10 text-cyan border-cyan/30 hover:bg-cyan/20`
            : 'text-cyan hover:text-cyan/80 text-xs font-medium whitespace-nowrap transition-colors disabled:opacity-50'
        }
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
          className='p-1 text-red-400 hover:text-red-300 transition-colors'
        >
          <DeleteIcon />
        </DeleteConfirmButton>
      )}
    </>
  );

  return (
    <div className='@container pb-20'>
      <PageHeader
        title='Payroll'
        description='Generate each month’s salaries, review them, then record payment.'
        actions={
          <>
            <button
              type='button'
              onClick={() => {
                setDeleteMonthValue(month);
                setShowDeleteMonthModal(true);
              }}
              className={DANGER_ACTION_CLASS}
            >
              Delete month
            </button>
            <button type='button' onClick={openGenerate} className={PRIMARY_ACTION_CLASS}>
              Generate payroll
            </button>
          </>
        }
      />

      <PageTabs label='Payroll sections' active='payroll' tabs={PAYROLL_TABS} />

      {/* Filters */}
      <div className='glass p-4 rounded-lg mb-6'>
        <div className={FILTER_GRID_CLASS}>
          <FilterField label='Month'>
            <MonthPicker
              compact
              value={month}
              onChange={(next) => {
                setMonth(next);
                applyFilters({ month: next });
              }}
              required
            />
          </FilterField>
          <FilterField label='Status'>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                applyFilters({ status: e.target.value });
              }}
              className={FIELD_CLASS}
            >
              <option value=''>All Statuses</option>
              <option value='draft'>Draft</option>
              <option value='approved'>Approved</option>
              <option value='paid'>Paid</option>
            </select>
          </FilterField>
        </div>
      </div>

      {/* Totals + the month's run. A payroll month moves strictly
          draft → approved → paid, so the third tile shows exactly that: one
          bar split by stage, read left to right, with the paid share as the
          headline. It replaces two loose "Approved"/"Paid" count tiles that
          couldn't say how far along the month was. */}
      <div className='grid grid-cols-2 @3xl:grid-cols-4 gap-3 @xl:gap-4 mb-6'>
        <StatTile label='Records' value={payroll.length.toLocaleString('en-IN')} sublabel={getMonthName(month)} />
        <StatTile
          label='Net payable'
          value={<span className='text-cyan'><SensitiveValue>{formatCurrency(totalPayable)}</SensitiveValue></span>}
          sublabel='After LOP and deductions'
        />
        <div className='glass p-4 @xl:p-5 rounded-lg col-span-2 min-w-0'>
          <div className='flex items-baseline justify-between gap-3'>
            <p className='text-[11px] @xl:text-xs font-semibold text-gray-500 uppercase tracking-wider truncate'>
              Month’s run
            </p>
            <p className='text-xs text-gray-400 tabular-nums whitespace-nowrap'>
              <span className='text-white font-semibold'>{stageCounts.paid}</span> of {payroll.length} paid
            </p>
          </div>
          <div
            role='img'
            aria-label={RUN_STAGES.map((stage) => `${stageCounts[stage.id]} ${stage.label.toLowerCase()}`).join(', ')}
            className='mt-3 flex gap-0.5 h-2.5 rounded-full overflow-hidden bg-gray-800'
          >
            {RUN_STAGES.map(
              (stage) =>
                stageCounts[stage.id] > 0 && (
                  <div key={stage.id} className={`${stage.bar} transition-all duration-500`} style={{ flexGrow: stageCounts[stage.id] }} />
                ),
            )}
          </div>
          <ol className='mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-400'>
            {RUN_STAGES.map((stage, i) => (
              <li key={stage.id} className='flex items-center gap-2'>
                {i > 0 && <span aria-hidden='true' className='text-gray-600'>→</span>}
                <span className={`w-2 h-2 rounded-full ${stage.bar}`} aria-hidden='true' />
                <span>
                  <span className='text-white font-semibold tabular-nums'>{stageCounts[stage.id]}</span> {stage.label}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Records */}
      <div className='glass rounded-lg overflow-hidden'>
        {payroll.length === 0 ? (
          <div className='text-center py-14 px-4'>
            <p className='text-gray-300 font-medium'>No payroll for {getMonthName(month)}{status ? ` with status “${status}”` : ''}</p>
            <p className='text-sm text-gray-500 mt-1'>Generate it once every working day’s attendance is recorded.</p>
            <button type='button' onClick={openGenerate} className={`${PRIMARY_ACTION_CLASS} mt-5`}>
              Generate payroll
            </button>
          </div>
        ) : (
          <>
            {/* Wide containers: the table. Working and payable days share one
                "Days" column ("20.0 of 20"), which keeps it to seven. */}
            <div className={`hidden @min-[60rem]:block`}>
              <Table compact headers={['Employee', 'Department', 'Days', 'Gross', 'Net', 'Status', 'Actions']}>
                {payroll.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className='min-w-40'>{renderEmployee(record)}</TableCell>
                    <TableCell className='whitespace-nowrap'>{record.employee_department}</TableCell>
                    <TableCell>{renderDays(record)}</TableCell>
                    <TableCell className='min-w-32 max-w-52'>{renderGross(record)}</TableCell>
                    <TableCell className='min-w-32 max-w-52'>
                      <p className='font-medium text-white tabular-nums whitespace-nowrap'>
                        <SensitiveValue>{formatCurrency(record.net_salary)}</SensitiveValue>
                      </p>
                      {renderAdjustments(record)}
                      <div className='mt-1'>{renderEditDeductions(record)}</div>
                    </TableCell>
                    <TableCell>{renderStatus(record)}</TableCell>
                    <TableCell>
                      <div className='flex items-center gap-3'>{renderRowActions(record)}</div>
                    </TableCell>
                  </TableRow>
                ))}
              </Table>
            </div>

            {/* Narrow containers: one card per employee — who and their net
                pay on top, days and gross beneath, every table action in a
                wrapping footer. Two-up once there's room. */}
            <ul className={`@min-[60rem]:hidden grid grid-cols-1 @3xl:grid-cols-2 -mb-px`}>
              {payroll.map((record) => (
                <li key={record.id} className='p-4 min-w-0 border-b border-gray-800/70 @3xl:odd:border-r'>
                  <div className='flex items-start justify-between gap-3'>
                    <div className='min-w-0'>
                      <p className='font-semibold text-white [overflow-wrap:anywhere]'>{record.employee_name}</p>
                      <p className='text-xs text-gray-500 [overflow-wrap:anywhere]'>
                        {record.employee_role}
                        {record.employee_department && <> · {record.employee_department}</>}
                      </p>
                    </div>
                    <div className='text-right shrink-0'>
                      <p className='text-sm font-bold text-white tabular-nums'>
                        <SensitiveValue>{formatCurrency(record.net_salary)}</SensitiveValue>
                      </p>
                      <p className='text-[11px] text-gray-500'>Net pay</p>
                    </div>
                  </div>

                  <dl className='mt-3 grid grid-cols-2 gap-3 text-sm text-gray-400'>
                    <div className='min-w-0'>
                      <dt className='text-[11px] uppercase tracking-wide text-gray-500 mb-0.5'>Payable days</dt>
                      <dd>{renderDays(record)}</dd>
                    </div>
                    <div className='min-w-0'>
                      <dt className='text-[11px] uppercase tracking-wide text-gray-500 mb-0.5'>Gross</dt>
                      <dd>{renderGross(record)}</dd>
                    </div>
                  </dl>
                  {renderAdjustments(record) && <div className='mt-2'>{renderAdjustments(record)}</div>}

                  <div className='mt-3 flex flex-wrap items-center gap-2'>
                    {renderStatus(record)}
                    {renderEditDeductions(record, true)}
                    <span className='ml-auto flex items-center gap-2'>{renderRowActions(record, true)}</span>
                  </div>
                </li>
              ))}
            </ul>
          </>
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
