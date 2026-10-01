'use client';

/**
 * Salary Structures tab of the Payroll page (/erp/payroll?tab=salary-structures).
 * Full-time employees only — see the eligibility rule in generatePayrollAction.
 */

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Table, TableRow, TableCell } from './Table';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import SensitiveValue from './SensitiveValue';
import DeleteConfirmButton from './DeleteConfirmButton';
import {
  createSalaryStructureAction,
  cancelSalaryStructureAction,
  getSalaryStructureHistoryAction,
  createSalaryTemplateAction,
} from '@/actions/erp/salary-structure';
import type { Employee, EmployeeSalaryStructure, EmployeeSalaryStructureWithRange, SalaryTemplate } from '@/types/erp';
import { formatCurrency, splitGrossByTemplate } from '@/lib/erp/utils';

interface SalaryStructureManagerProps {
  employees: Employee[];
  templates: SalaryTemplate[];
  currentStructureByEmployeeId: Record<number, EmployeeSalaryStructure | null>;
}

const emptyBreakdown = { basic_salary: '', hra: '', special_allowance: '', other_allowance: '' };

function sumBreakdown(b: typeof emptyBreakdown): number {
  return (
    (parseFloat(b.basic_salary) || 0) +
    (parseFloat(b.hra) || 0) +
    (parseFloat(b.special_allowance) || 0) +
    (parseFloat(b.other_allowance) || 0)
  );
}

/** A component's share of a template's gross, e.g. "50%" or "28.57%". */
function shareOf(part: number, gross: number): string {
  if (!gross) return '0%';
  return `${Math.round((part / gross) * 10000) / 100}%`;
}

/** A template's proportions applied to a different monthly gross, as form values. */
function scaleTemplate(template: SalaryTemplate, gross: number): typeof emptyBreakdown {
  const split = splitGrossByTemplate(gross, template);
  return {
    basic_salary: String(split.basic_salary),
    hra: String(split.hra),
    special_allowance: String(split.special_allowance),
    other_allowance: String(split.other_allowance),
  };
}

export default function SalaryStructureManager({
  employees,
  templates,
  currentStructureByEmployeeId,
}: SalaryStructureManagerProps) {
  const router = useRouter();
  const [revisionEmployee, setRevisionEmployee] = useState<Employee | null>(null);
  const [breakdown, setBreakdown] = useState(emptyBreakdown);
  const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);

  const [historyEmployee, setHistoryEmployee] = useState<Employee | null>(null);
  const [history, setHistory] = useState<EmployeeSalaryStructureWithRange[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [showTemplates, setShowTemplates] = useState(false);
  const [templateId, setTemplateId] = useState('');
  const [targetGross, setTargetGross] = useState('');

  const selectedTemplate = templates.find((t) => String(t.id) === templateId) || null;

  const openRevisionModal = (employee: Employee) => {
    setRevisionEmployee(employee);
    setBreakdown(emptyBreakdown);
    setTemplateId('');
    setTargetGross('');
    setEffectiveFrom(new Date().toISOString().split('T')[0]);
  };

  const applyTemplate = (id: string) => {
    setTemplateId(id);
    const template = templates.find((t) => String(t.id) === id);
    if (!template) return;
    setTargetGross(String(template.gross_salary));
    setBreakdown(scaleTemplate(template, template.gross_salary));
  };

  const applyTargetGross = (value: string) => {
    setTargetGross(value);
    const gross = parseFloat(value);
    if (selectedTemplate && gross > 0) {
      setBreakdown(scaleTemplate(selectedTemplate, Math.round(gross)));
    }
  };

  const handleCancelRevision = async (row: EmployeeSalaryStructureWithRange) => {
    const result = await cancelSalaryStructureAction(row.id);
    if (result.success) {
      toast.success('Salary revision cancelled');
      if (historyEmployee) {
        setHistory(await getSalaryStructureHistoryAction(historyEmployee.id));
      }
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to cancel revision');
    }
  };

  const handleCreateRevision = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!revisionEmployee) return;
    if (sumBreakdown(breakdown) <= 0) {
      toast.error('Gross salary must be greater than zero');
      return;
    }
    setSaving(true);

    const formData = new FormData(e.currentTarget);
    formData.set('employee_id', String(revisionEmployee.id));
    const result = await createSalaryStructureAction(formData);

    setSaving(false);
    if (result.success) {
      toast.success(`Salary structure updated for ${revisionEmployee.name}`);
      setRevisionEmployee(null);
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to create salary structure');
    }
  };

  const openHistory = async (employee: Employee) => {
    setHistoryEmployee(employee);
    setLoadingHistory(true);
    const rows = await getSalaryStructureHistoryAction(employee.id);
    setHistory(rows);
    setLoadingHistory(false);
  };

  const gross = sumBreakdown(breakdown);

  return (
    <div>
      {/* Header */}
      <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6'>
        <div>
          <h1 className='text-3xl font-bold gradient-text'>Payroll Management</h1>
          <p className='text-gray-400 mt-2'>Salary structures for full-time employees</p>
        </div>
        <Button variant='secondary' onClick={() => setShowTemplates(true)} className='whitespace-nowrap'>
          Manage Templates
        </Button>
      </div>

      {/* Tab Switcher */}
      <div className='flex gap-2 mb-6 border-b border-gray-800'>
        <Link
          href='/erp/payroll'
          className='px-4 py-2.5 text-sm font-medium text-gray-400 hover:text-white transition-colors'
        >
          Payroll
        </Link>
        <div className='px-4 py-2.5 text-sm font-medium text-cyan border-b-2 border-cyan -mb-px'>
          Salary Structures
        </div>
      </div>

      {/* Employee Table */}
      <div className='glass rounded-lg overflow-hidden'>
        {employees.length === 0 ? (
          <div className='text-center py-12 text-gray-400'>No full-time employees found</div>
        ) : (
          <Table
            headers={['Employee', 'Department', 'Monthly Gross', 'Basic', 'HRA', 'Special', 'Other', 'Effective From', 'Actions']}
          >
            {employees.map((employee) => {
              const current = currentStructureByEmployeeId[employee.id];
              return (
                <TableRow key={employee.id}>
                  <TableCell>
                    <div className='font-medium text-white'>{employee.name}</div>
                    <div className='text-xs text-gray-500'>{employee.role}</div>
                  </TableCell>
                  <TableCell>{employee.department}</TableCell>
                  <TableCell>
                    {current ? (
                      <span className='font-semibold text-white'>
                        <SensitiveValue>{formatCurrency(current.gross_salary)}</SensitiveValue>
                      </span>
                    ) : (
                      <span className='text-gray-500 text-sm'>Not configured</span>
                    )}
                  </TableCell>
                  {(['basic_salary', 'hra', 'special_allowance', 'other_allowance'] as const).map((key) => (
                    <TableCell key={key}>
                      {current ? (
                        <span className='text-gray-300'>
                          <SensitiveValue>{formatCurrency(current[key])}</SensitiveValue>
                        </span>
                      ) : (
                        <span className='text-gray-600'>—</span>
                      )}
                    </TableCell>
                  ))}
                  <TableCell>{current?.effective_from || '—'}</TableCell>
                  <TableCell>
                    <div className='flex gap-3'>
                      <button
                        type='button'
                        onClick={() => openHistory(employee)}
                        className='text-cyan hover:text-cyan/80 text-sm transition-colors'
                      >
                        History
                      </button>
                      <button
                        type='button'
                        onClick={() => openRevisionModal(employee)}
                        className='text-cyan hover:text-cyan/80 text-sm transition-colors'
                      >
                        New Revision
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </Table>
        )}
      </div>

      {/* New Revision Modal */}
      <Modal
        isOpen={!!revisionEmployee}
        onClose={() => setRevisionEmployee(null)}
        title='New Salary Structure Revision'
      >
        {revisionEmployee && (
          <form onSubmit={handleCreateRevision} className='space-y-4'>
            <div className='bg-dark-800/50 border border-gray-700 rounded-lg p-3'>
              <p className='text-sm font-medium text-white'>{revisionEmployee.name}</p>
              <p className='text-xs text-gray-400'>{revisionEmployee.employee_id} · {revisionEmployee.role}</p>
              {currentStructureByEmployeeId[revisionEmployee.id] && (
                <p className='text-xs text-gray-500 mt-1'>
                  Current: <SensitiveValue>{formatCurrency(currentStructureByEmployeeId[revisionEmployee.id]!.gross_salary)}</SensitiveValue>{' '}
                  from {currentStructureByEmployeeId[revisionEmployee.id]!.effective_from}. The new revision must take
                  effect after that date; months already paid keep their old figures.
                </p>
              )}
            </div>

            {templates.length > 0 && (
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                <div>
                  <label className='block text-sm font-medium mb-2'>Start from a template</label>
                  <select
                    value={templateId}
                    onChange={(e) => applyTemplate(e.target.value)}
                    className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
                  >
                    <option value=''>Custom</option>
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({formatCurrency(t.gross_salary)})
                      </option>
                    ))}
                  </select>
                </div>
                {selectedTemplate && (
                  <div>
                    <label className='block text-sm font-medium mb-2'>Monthly gross</label>
                    <input
                      type='number' min='1' step='1'
                      value={targetGross}
                      onChange={(e) => applyTargetGross(e.target.value)}
                      className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
                    />
                  </div>
                )}
                {selectedTemplate && (
                  <p className='sm:col-span-2 text-xs text-gray-500 -mt-1'>
                    Split: Basic {shareOf(selectedTemplate.basic_salary, selectedTemplate.gross_salary)} · HRA{' '}
                    {shareOf(selectedTemplate.hra, selectedTemplate.gross_salary)} · Special{' '}
                    {shareOf(selectedTemplate.special_allowance, selectedTemplate.gross_salary)} · Other{' '}
                    {shareOf(selectedTemplate.other_allowance, selectedTemplate.gross_salary)}. Amounts below can
                    still be edited for this employee.
                  </p>
                )}
              </div>
            )}

            <div className='grid grid-cols-2 gap-3'>
              <div>
                <label className='block text-xs font-medium text-gray-400 mb-1'>Basic Salary *</label>
                <input
                  type='number' name='basic_salary' min='0' step='0.01' required
                  value={breakdown.basic_salary}
                  onChange={(e) => setBreakdown({ ...breakdown, basic_salary: e.target.value })}
                  className='w-full px-3 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white text-sm'
                />
              </div>
              <div>
                <label className='block text-xs font-medium text-gray-400 mb-1'>HRA</label>
                <input
                  type='number' name='hra' min='0' step='0.01'
                  value={breakdown.hra}
                  onChange={(e) => setBreakdown({ ...breakdown, hra: e.target.value })}
                  className='w-full px-3 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white text-sm'
                />
              </div>
              <div>
                <label className='block text-xs font-medium text-gray-400 mb-1'>Special Allowance</label>
                <input
                  type='number' name='special_allowance' min='0' step='0.01'
                  value={breakdown.special_allowance}
                  onChange={(e) => setBreakdown({ ...breakdown, special_allowance: e.target.value })}
                  className='w-full px-3 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white text-sm'
                />
              </div>
              <div>
                <label className='block text-xs font-medium text-gray-400 mb-1'>Other Allowance</label>
                <input
                  type='number' name='other_allowance' min='0' step='0.01'
                  value={breakdown.other_allowance}
                  onChange={(e) => setBreakdown({ ...breakdown, other_allowance: e.target.value })}
                  className='w-full px-3 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white text-sm'
                />
              </div>
            </div>

            <div className='bg-cyan/5 border border-cyan/20 rounded-lg p-3 flex justify-between items-center'>
              <span className='text-sm text-gray-300'>Gross Salary</span>
              <span className='text-lg font-bold text-cyan'>{formatCurrency(gross)}</span>
            </div>

            <div>
              <label className='block text-sm font-medium mb-2'>Effective From *</label>
              <input
                type='date' name='effective_from' required
                value={effectiveFrom}
                onChange={(e) => setEffectiveFrom(e.target.value)}
                className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white [color-scheme:dark]'
              />
            </div>

            <Button type='submit' variant='primary' className='w-full' disabled={saving}>
              {saving ? 'Saving…' : 'Save Structure'}
            </Button>
          </form>
        )}
      </Modal>

      {/* History Modal */}
      <Modal
        isOpen={!!historyEmployee}
        onClose={() => setHistoryEmployee(null)}
        title={`Salary History — ${historyEmployee?.name || ''}`}
      >
        {loadingHistory ? (
          <p className='text-gray-400 text-sm'>Loading…</p>
        ) : history.length === 0 ? (
          <p className='text-gray-400 text-sm'>No salary structure configured yet.</p>
        ) : (
          <div className='space-y-3'>
            {history.map((row) => (
              <div key={row.id} className='border border-gray-800 rounded-lg p-3'>
                <div className='flex justify-between items-center gap-3 mb-2'>
                  <span className='text-sm font-medium text-white'>
                    {row.effective_from} → {row.effective_to || 'Present'}
                  </span>
                  <div className='flex items-center gap-3'>
                    <span className='text-cyan font-bold'>
                      <SensitiveValue>{formatCurrency(row.gross_salary)}</SensitiveValue>
                    </span>
                    <DeleteConfirmButton
                      onConfirm={() => handleCancelRevision(row)}
                      message={`Cancel the revision effective ${row.effective_from}? Use this to correct a mistake. It is refused if a paid payroll month already used it.`}
                      confirmLabel='Cancel revision'
                      confirmingLabel='Cancelling…'
                      cancelLabel='Keep'
                      title='Cancel this revision'
                      ariaLabel='Cancel this revision'
                      className='text-xs text-red-400 hover:text-red-300 transition-colors'
                    >
                      Cancel
                    </DeleteConfirmButton>
                  </div>
                </div>
                <div className='grid grid-cols-4 gap-2 text-xs text-gray-400'>
                  <div>Basic: <SensitiveValue>{formatCurrency(row.basic_salary)}</SensitiveValue></div>
                  <div>HRA: <SensitiveValue>{formatCurrency(row.hra)}</SensitiveValue></div>
                  <div>Special: <SensitiveValue>{formatCurrency(row.special_allowance)}</SensitiveValue></div>
                  <div>Other: <SensitiveValue>{formatCurrency(row.other_allowance)}</SensitiveValue></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Manage Templates Modal */}
      <TemplatesModal isOpen={showTemplates} onClose={() => setShowTemplates(false)} templates={templates} />
    </div>
  );
}

function TemplatesModal({
  isOpen,
  onClose,
  templates,
}: {
  isOpen: boolean;
  onClose: () => void;
  templates: SalaryTemplate[];
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ name: '', ...emptyBreakdown });
  const [saving, setSaving] = useState(false);

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const formData = new FormData(e.currentTarget);
    const result = await createSalaryTemplateAction(formData);
    setSaving(false);
    if (result.success) {
      toast.success('Template created');
      setAdding(false);
      setNewTemplate({ name: '', ...emptyBreakdown });
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to create template');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title='Salary Templates'>
      <div className='space-y-3'>
        {templates.map((t) => (
          <div key={t.id} className='border border-gray-800 rounded-lg p-3 flex justify-between items-center'>
            <div>
              <p className='text-sm font-medium text-white'>{t.name}</p>
              <p className='text-xs text-gray-400'>
                Basic {formatCurrency(t.basic_salary)} · HRA {formatCurrency(t.hra)} · Special{' '}
                {formatCurrency(t.special_allowance)} · Other {formatCurrency(t.other_allowance)}
              </p>
              <p className='text-xs text-gray-500'>
                {shareOf(t.basic_salary, t.gross_salary)} / {shareOf(t.hra, t.gross_salary)} /{' '}
                {shareOf(t.special_allowance, t.gross_salary)} / {shareOf(t.other_allowance, t.gross_salary)}
              </p>
            </div>
            <span className='text-cyan font-bold text-sm'>{formatCurrency(t.gross_salary)}</span>
          </div>
        ))}

        {adding ? (
          <form onSubmit={handleAdd} className='space-y-3 border border-gray-800 rounded-lg p-3'>
            <input
              type='text' name='name' placeholder='Template name (e.g. Standard ₹40,000)' required
              value={newTemplate.name}
              onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
              className='w-full px-3 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white text-sm'
            />
            <div className='grid grid-cols-2 gap-2'>
              <input type='number' name='basic_salary' placeholder='Basic' min='0' step='0.01' required
                value={newTemplate.basic_salary}
                onChange={(e) => setNewTemplate({ ...newTemplate, basic_salary: e.target.value })}
                className='px-3 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white text-sm' />
              <input type='number' name='hra' placeholder='HRA' min='0' step='0.01'
                value={newTemplate.hra}
                onChange={(e) => setNewTemplate({ ...newTemplate, hra: e.target.value })}
                className='px-3 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white text-sm' />
              <input type='number' name='special_allowance' placeholder='Special Allowance' min='0' step='0.01'
                value={newTemplate.special_allowance}
                onChange={(e) => setNewTemplate({ ...newTemplate, special_allowance: e.target.value })}
                className='px-3 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white text-sm' />
              <input type='number' name='other_allowance' placeholder='Other Allowance' min='0' step='0.01'
                value={newTemplate.other_allowance}
                onChange={(e) => setNewTemplate({ ...newTemplate, other_allowance: e.target.value })}
                className='px-3 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white text-sm' />
            </div>
            <div className='flex gap-2'>
              <Button type='button' variant='secondary' className='flex-1' onClick={() => setAdding(false)}>
                Cancel
              </Button>
              <Button type='submit' variant='primary' className='flex-1' disabled={saving}>
                {saving ? 'Saving…' : 'Add Template'}
              </Button>
            </div>
          </form>
        ) : (
          <Button type='button' variant='secondary' className='w-full' onClick={() => setAdding(true)}>
            + Add Template
          </Button>
        )}
      </div>
    </Modal>
  );
}
