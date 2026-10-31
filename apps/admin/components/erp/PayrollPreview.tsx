'use client';

/**
 * Preview tab of the Payroll page (/erp/payroll?tab=preview): what each
 * employee would be paid if payroll ran now. Nothing is saved until Generate,
 * so attendance stays editable while the month is being checked. The figures
 * come from buildPayrollPlan, the same calculation Generate saves.
 */

import { Fragment, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Table, TableRow, TableCell } from './Table';
import MonthPicker from './MonthPicker';
import SensitiveValue from './SensitiveValue';
import { StatTile } from './charts/FinanceCharts';
import { PAYROLL_TABS } from './PayrollManager';
import {
  PageHeader,
  PageTabs,
  FilterField,
  RefreshButton,
  FILTER_GRID_CLASS,
  PRIMARY_ACTION_CLASS,
} from './PageChrome';
import Spinner from '@/components/ui/Spinner';
import { confirmDialog } from '@/components/ui/ConfirmDialog';
import { toast } from '@/lib/toast';
import {
  formatCurrency,
  formatDisplayDate,
  getMonthName,
  type PayrollCalculationDay,
} from '@/lib/erp/utils';
import { generatePayrollAction } from '@/actions/erp/payroll';
import type { PayrollPreviewData, PayrollPreviewRow } from '@/lib/erp/payroll-plan';

interface PayrollPreviewProps extends PayrollPreviewData {
  month: string;
}

/** Where a row stands: anything needing a person comes first on screen. */
type RowState = 'attention' | 'ready' | 'generated' | 'skipped';
const STATE_ORDER: RowState[] = ['attention', 'ready', 'generated', 'skipped'];

function stateOf(row: PayrollPreviewRow): RowState {
  if (row.outcome === 'generated' || row.outcome === 'skipped') return row.outcome;
  // A pending request can still change this pay, and can't be approved once
  // the month has a payroll row — so it isn't ready, even though Generate
  // itself wouldn't refuse it.
  if (row.outcome === 'blocked' || row.pendingLeave + row.pendingAttendance > 0) return 'attention';
  return 'ready';
}

function netOf(row: PayrollPreviewRow): number | null {
  if (row.outcome === 'ready') return row.payroll.net_salary;
  if (row.outcome === 'generated') return row.saved.net_salary;
  return null;
}

const plural = (count: number, noun: string) => `${count} ${noun}${count === 1 ? '' : 's'}`;

const DAY_PARTS = [
  { key: 'present', code: 'P', label: 'Present', cell: 'bg-green-500/10 border-green-500/30 text-green-400' },
  { key: 'half', code: 'H', label: 'Half day', cell: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' },
  { key: 'paidLeave', code: 'PL', label: 'Paid leave', cell: 'bg-blue-500/10 border-blue-500/30 text-blue-400' },
  { key: 'unpaidLeave', code: 'UL', label: 'Unpaid leave', cell: 'bg-orange-500/10 border-orange-500/30 text-orange-400' },
  { key: 'absent', code: 'A', label: 'Absent', cell: 'bg-red-500/10 border-red-500/30 text-red-400' },
] as const;
const NOT_RECORDED = { code: '?', label: 'Not recorded', cell: 'border-dashed border-yellow-500/60 text-yellow-400' };
const NOT_EMPLOYED = { code: '–', label: 'Not employed', cell: 'border-gray-800/60 text-gray-600' };

/** A half-day leave can split a day in two, e.g. "PL+P". */
function describeDay(day: PayrollCalculationDay) {
  if (!day.employed) return NOT_EMPLOYED;
  const { share } = day;
  if (!share) return NOT_RECORDED;
  const parts = DAY_PARTS.filter((part) => share[part.key] > 0);
  return {
    code: parts.map((part) => part.code).join('+'),
    label: parts.map((part) => part.label).join(' + '),
    cell: parts[0]?.cell ?? NOT_EMPLOYED.cell,
  };
}

function Money({ amount }: { amount: number | null }) {
  if (amount === null) return <span className='text-gray-600'>—</span>;
  return <SensitiveValue>{formatCurrency(amount)}</SensitiveValue>;
}

export default function PayrollPreview({ month, rows, workingDayCount }: PayrollPreviewProps) {
  const router = useRouter();
  const [pickedMonth, setPickedMonth] = useState(month);
  const [isPending, startTransition] = useTransition();
  const [isGenerating, setIsGenerating] = useState(false);
  // Open the rows with gaps, so the missing days are visible straight away.
  const [openIds, setOpenIds] = useState(
    () => new Set(rows.filter((row) => row.outcome === 'blocked').map((row) => row.employee.id)),
  );

  const sorted = [...rows].sort(
    (a, b) => STATE_ORDER.indexOf(stateOf(a)) - STATE_ORDER.indexOf(stateOf(b)),
  );
  const inState = (state: RowState) => rows.filter((row) => stateOf(row) === state);
  const ready = inState('ready');
  const attention = inState('attention');
  const generated = inState('generated');
  const skipped = inState('skipped');

  const sumNet = (list: PayrollPreviewRow[]) => list.reduce((sum, row) => sum + (netOf(row) ?? 0), 0);
  const readyTotal = sumNet(ready);
  const monthTotal = readyTotal + sumNet(generated);

  const changeMonth = (next: string) => {
    setPickedMonth(next);
    startTransition(() => router.push(`/erp/payroll?tab=preview&month=${next}`));
  };

  const toggleRow = (id: number) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleGenerate = async () => {
    const confirmed = await confirmDialog({
      title: `Generate payroll for ${plural(ready.length, 'employee')}?`,
      message:
        `Their attendance and leave for ${getMonthName(month)} lock once this is saved.` +
        (attention.length > 0
          ? ` The other ${attention.length} can be generated after they're fixed.`
          : ''),
      confirmLabel: 'Generate payroll',
    });
    if (!confirmed) return;

    setIsGenerating(true);
    const formData = new FormData();
    formData.set('month', month);
    ready.forEach((row) => formData.append('employee_ids', String(row.employee.id)));

    try {
      const result = await generatePayrollAction(formData);
      if (!result.success) {
        // Attendance moved since this page loaded — show where it stands now.
        toast.error(result.error || 'Failed to generate payroll');
        setIsGenerating(false);
        startTransition(() => router.refresh());
        return;
      }

      toast.success(`Payroll generated for ${plural(result.payroll?.generated ?? 0, 'employee')}`);
      result.payroll?.errors?.forEach((message) => toast.error(message));
      // isGenerating stays on: approving and paying happen on the Payroll tab,
      // and this button shouldn't come back to life while that loads.
      startTransition(() => router.push(`/erp/payroll?month=${month}`));
    } catch (error) {
      console.error('Generate payroll failed:', error);
      toast.error('Failed to generate payroll');
      setIsGenerating(false);
    }
  };

  const hasDays = (row: PayrollPreviewRow) => row.outcome === 'ready' || row.outcome === 'blocked';

  const renderEmployee = (row: PayrollPreviewRow) => (
    <div className='flex items-start gap-2 min-w-0'>
      {hasDays(row) ? (
        <button
          type='button'
          onClick={() => toggleRow(row.employee.id)}
          aria-expanded={openIds.has(row.employee.id)}
          aria-label={`${openIds.has(row.employee.id) ? 'Hide' : 'Show'} days for ${row.employee.name}`}
          className='mt-0.5 p-0.5 rounded text-gray-500 hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-[var(--cyan)]'
        >
          <svg
            className={`w-3.5 h-3.5 transition-transform ${openIds.has(row.employee.id) ? 'rotate-90' : ''}`}
            fill='none'
            viewBox='0 0 24 24'
            stroke='currentColor'
            strokeWidth='2.5'
            aria-hidden='true'
          >
            <path strokeLinecap='round' strokeLinejoin='round' d='M9 5l7 7-7 7' />
          </svg>
        </button>
      ) : (
        <span className='w-[18px] shrink-0' aria-hidden='true' />
      )}
      <div className='min-w-0'>
        <p className='font-medium text-white [overflow-wrap:anywhere]'>{row.employee.name}</p>
        <p className='text-xs text-gray-500 [overflow-wrap:anywhere]'>
          {row.employee.employee_id}
          {row.employee.department && <> · {row.employee.department}</>}
        </p>
      </div>
    </div>
  );

  const renderDays = (row: PayrollPreviewRow) => {
    if (row.outcome === 'skipped') return <span className='text-gray-600'>—</span>;
    const days = row.outcome === 'generated' ? row.saved : row.calculation;
    return (
      <p className='tabular-nums whitespace-nowrap'>
        <span className='text-gray-200'>{days.payable_days.toFixed(1)}</span>
        <span className='text-gray-500'> of {days.total_working_days}</span>
      </p>
    );
  };

  const salaryOf = (row: PayrollPreviewRow): number | null => {
    if (row.outcome === 'skipped') return null;
    return row.outcome === 'generated' ? row.saved.gross_salary : row.calculation.gross_salary;
  };

  // Blocked rows have none yet: their missing days could still go either way.
  const lossOf = (row: PayrollPreviewRow): number | null => {
    if (row.outcome === 'ready') return row.calculation.lop_deduction;
    return row.outcome === 'generated' ? row.saved.lop_deduction : null;
  };

  const renderStatus = (row: PayrollPreviewRow) => {
    const link = 'text-xs text-[var(--cyan)] hover:underline whitespace-nowrap';
    const badge = 'inline-block px-2 py-1 rounded text-xs font-medium whitespace-nowrap';
    const attentionBadge = `${badge} bg-yellow-500/15 text-yellow-300`;
    const query = `month=${month}&employee_id=${row.employee.id}`;

    if (row.outcome === 'skipped') {
      return <span className='text-xs text-gray-500'>{row.reason}</span>;
    }
    if (row.outcome === 'generated') {
      const tones = {
        draft: 'bg-gray-500/20 text-gray-300',
        approved: 'bg-green-500/15 text-green-300',
        paid: 'bg-blue-500/15 text-blue-300',
      };
      return <span className={`${badge} capitalize ${tones[row.saved.status]}`}>{row.saved.status}</span>;
    }

    const unrecorded = row.outcome === 'blocked' ? row.calculation.unrecorded_dates.length : 0;
    const offDays = row.outcome === 'blocked' ? row.offDayDates.length : 0;
    const pending = row.pendingLeave + row.pendingAttendance;

    if (stateOf(row) === 'ready') {
      return <span className={`${badge} bg-green-500/15 text-green-300`}>Ready</span>;
    }
    return (
      <div className='space-y-1'>
        <div className='flex flex-wrap gap-1'>
          {unrecorded > 0 && <span className={attentionBadge}>{plural(unrecorded, 'day')} not recorded</span>}
          {offDays > 0 && <span className={attentionBadge}>{plural(offDays, 'off-day')} to fix</span>}
          {pending > 0 && <span className={attentionBadge}>{plural(pending, 'pending request')}</span>}
        </div>
        <div className='flex flex-wrap gap-x-3'>
          {unrecorded > 0 && (
            <Link href={`/erp/attendance?${query}`} className={link}>
              Fix in Attendance
            </Link>
          )}
          {offDays > 0 && (
            <Link href={`/erp/attendance/sessions?${query}`} className={link}>
              Fix in Sessions
            </Link>
          )}
          {row.pendingLeave > 0 && (
            <Link href='/erp/leave-requests' className={link}>
              Review leave
            </Link>
          )}
          {row.pendingAttendance > 0 && (
            <Link href='/erp/attendance-change-requests' className={link}>
              Review requests
            </Link>
          )}
        </div>
      </div>
    );
  };

  const renderDayStrip = (row: PayrollPreviewRow) => {
    if (row.outcome !== 'ready' && row.outcome !== 'blocked') return null;
    return (
      <div className='space-y-2'>
        <ol className='grid grid-cols-[repeat(auto-fill,minmax(2.75rem,1fr))] gap-1.5'>
          {row.calculation.days.map((day) => {
            const info = describeDay(day);
            return (
              <li
                key={day.date}
                title={`${formatDisplayDate(day.date)}: ${info.label}`}
                className={`rounded border px-1 py-1 text-center ${info.cell}`}
              >
                <span className='block text-[10px] tabular-nums text-gray-400'>{Number(day.date.slice(8))}</span>
                <span className='block text-[11px] font-bold leading-tight whitespace-nowrap'>{info.code}</span>
              </li>
            );
          })}
        </ol>
        {row.outcome === 'blocked' && row.offDayDates.length > 0 && (
          <p className='text-xs text-yellow-300/90'>
            Weekend or holiday work with no clock-out or hours:{' '}
            {row.offDayDates.map(formatDisplayDate).join(', ')}
          </p>
        )}
      </div>
    );
  };

  const isOpen = (row: PayrollPreviewRow) => hasDays(row) && openIds.has(row.employee.id);

  return (
    <div className='@container pb-20'>
      <PageHeader
        title='Payroll'
        description='See exactly what each employee will be paid before anything is saved.'
        actions={
          <>
            <RefreshButton />
            <button
              type='button'
              onClick={handleGenerate}
              disabled={ready.length === 0 || isGenerating || isPending}
              className={`${PRIMARY_ACTION_CLASS} gap-2`}
            >
              {isGenerating && <Spinner className='h-3.5 w-3.5' />}
              {isGenerating
                ? 'Generating…'
                : ready.length > 0
                  ? `Generate for ${ready.length} ready`
                  : 'Generate payroll'}
            </button>
          </>
        }
      />

      <PageTabs label='Payroll sections' active='preview' tabs={PAYROLL_TABS} />

      <div className='glass p-4 rounded-lg mb-6'>
        <div className={FILTER_GRID_CLASS}>
          <FilterField label='Month'>
            <MonthPicker compact value={pickedMonth} onChange={changeMonth} required />
          </FilterField>
          <p className='text-sm text-gray-400 @md:self-center flex items-center gap-2 whitespace-nowrap'>
            {isPending && <Spinner className='h-3.5 w-3.5 text-[var(--cyan)]' />}
            {plural(workingDayCount, 'working day')} in {getMonthName(month)}
          </p>
        </div>
      </div>

      <div className='grid grid-cols-2 @3xl:grid-cols-4 gap-3 @xl:gap-4 mb-6'>
        <StatTile
          label='Total payout'
          value={
            <span className='text-cyan'>
              <SensitiveValue>{formatCurrency(monthTotal)}</SensitiveValue>
            </span>
          }
          sublabel={
            attention.length > 0
              ? `Leaves out ${attention.length} still to fix`
              : plural(ready.length + generated.length, 'employee')
          }
        />
        <StatTile
          label='Ready to generate'
          value={<span className='text-green-400'>{ready.length}</span>}
          sublabel={<SensitiveValue>{formatCurrency(readyTotal)}</SensitiveValue>}
        />
        <StatTile
          label='Needs attention'
          value={<span className={attention.length > 0 ? 'text-yellow-400' : ''}>{attention.length}</span>}
          sublabel={attention.length > 0 ? 'Fix these first' : 'Nothing to fix'}
        />
        <StatTile
          label='Not in this run'
          value={generated.length + skipped.length}
          sublabel={`${generated.length} generated · ${skipped.length} skipped`}
        />
      </div>

      <div className={`glass rounded-lg overflow-hidden transition-opacity ${isPending ? 'opacity-60' : ''}`}>
        {rows.length === 0 ? (
          <div className='text-center py-14 px-4'>
            <p className='text-gray-300 font-medium'>No active employees</p>
          </div>
        ) : (
          <>
            {/* Wide containers: the table. */}
            <div className='hidden @min-[60rem]:block'>
              <Table compact headers={['Employee', 'Payable days', 'Salary', 'Loss of pay', 'Net pay', 'Status']}>
                {sorted.map((row) => (
                  <Fragment key={row.employee.id}>
                    <TableRow>
                      <TableCell className='min-w-48'>{renderEmployee(row)}</TableCell>
                      <TableCell>{renderDays(row)}</TableCell>
                      <TableCell className='whitespace-nowrap tabular-nums'>
                        <Money amount={salaryOf(row)} />
                      </TableCell>
                      <TableCell className='whitespace-nowrap tabular-nums'>
                        <Money amount={lossOf(row)} />
                      </TableCell>
                      <TableCell className='whitespace-nowrap tabular-nums font-semibold text-white'>
                        <Money amount={netOf(row)} />
                      </TableCell>
                      <TableCell>{renderStatus(row)}</TableCell>
                    </TableRow>
                    {isOpen(row) && (
                      <tr className='bg-black/20'>
                        <td colSpan={6} className='px-3 pb-3 pt-1'>
                          {renderDayStrip(row)}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </Table>
            </div>

            {/* Narrow containers: one card per employee. */}
            <ul className='@min-[60rem]:hidden grid grid-cols-1 -mb-px'>
              {sorted.map((row) => (
                <li key={row.employee.id} className='p-4 min-w-0 border-b border-gray-800/70'>
                  <div className='flex items-start justify-between gap-3'>
                    {renderEmployee(row)}
                    <div className='text-right shrink-0'>
                      <p className='text-sm font-bold text-white tabular-nums'>
                        <Money amount={netOf(row)} />
                      </p>
                      <p className='text-[11px] text-gray-500'>Net pay</p>
                    </div>
                  </div>

                  {row.outcome !== 'skipped' && (
                    <dl className='mt-3 grid grid-cols-3 gap-3 text-sm text-gray-400'>
                      <div className='min-w-0'>
                        <dt className='text-[11px] uppercase tracking-wide text-gray-500 mb-0.5'>Days</dt>
                        <dd>{renderDays(row)}</dd>
                      </div>
                      <div className='min-w-0'>
                        <dt className='text-[11px] uppercase tracking-wide text-gray-500 mb-0.5'>Salary</dt>
                        <dd className='tabular-nums [overflow-wrap:anywhere]'>
                          <Money amount={salaryOf(row)} />
                        </dd>
                      </div>
                      <div className='min-w-0'>
                        <dt className='text-[11px] uppercase tracking-wide text-gray-500 mb-0.5'>Loss of pay</dt>
                        <dd className='tabular-nums [overflow-wrap:anywhere]'>
                          <Money amount={lossOf(row)} />
                        </dd>
                      </div>
                    </dl>
                  )}

                  <div className='mt-3'>{renderStatus(row)}</div>
                  {isOpen(row) && <div className='mt-3'>{renderDayStrip(row)}</div>}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <div className='flex flex-wrap gap-x-4 gap-y-1 mt-3 px-1 text-xs text-gray-500'>
        {[...DAY_PARTS, NOT_RECORDED, NOT_EMPLOYED].map((part) => (
          <span key={part.code} className='whitespace-nowrap'>
            <span className='font-semibold text-gray-300'>{part.code}</span> {part.label}
          </span>
        ))}
      </div>
    </div>
  );
}
