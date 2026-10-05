'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { EditIcon, DeleteIcon } from './ActionIcons';
import DeleteConfirmButton from './DeleteConfirmButton';
import { PageHeader, PRIMARY_ACTION_CLASS, ROW_ACTION_CLASS } from './PageChrome';
import type { CompanyHoliday } from '@/lib/erp/holidays';
import {
  createHolidayAction,
  updateHolidayAction,
  setHolidayActiveAction,
  deleteHolidayAction,
} from '@/actions/erp/holidays';

interface HolidaysManagerProps {
  holidays: CompanyHoliday[];
  initialYear: number;
  userRole: string;
  /** Today as 'YYYY-MM-DD' in IST, resolved on the server so the
   * past/next marking can't differ between server and client render. */
  today: string;
}

const HOLIDAY_TYPE_INFO: Record<
  CompanyHoliday['holiday_type'],
  // `short` is the badge text — the full label wrapped onto three lines in
  // a narrow column; it stays in the badge's tooltip and the form.
  { label: string; short: string; icon: string; badge: string; dot: string }
> = {
  public: { label: 'Mandatory / Government Holiday', short: 'Mandatory', icon: '🏛️', badge: 'bg-red-500/20 text-red-400', dot: 'bg-red-400' },
  floater: { label: 'Floater Holiday', short: 'Floater', icon: '🎈', badge: 'bg-amber-500/20 text-amber-400', dot: 'bg-amber-400' },
  company: { label: 'Company Holiday', short: 'Company', icon: '🏢', badge: 'bg-blue-500/20 text-blue-400', dot: 'bg-blue-400' },
  optional: { label: 'Company Holiday', short: 'Company', icon: '🏢', badge: 'bg-blue-500/20 text-blue-400', dot: 'bg-blue-400' },
};

const CREATABLE_TYPES: CompanyHoliday['holiday_type'][] = ['public', 'floater', 'company'];

const emptyForm = {
  name: '',
  date: '',
  holiday_type: 'public' as CompanyHoliday['holiday_type'],
  description: '',
  is_active: true,
};

export default function HolidaysManager({
  holidays,
  initialYear,
  userRole,
  today,
}: HolidaysManagerProps) {
  const router = useRouter();
  const [year, setYear] = useState(initialYear);
  const [showModal, setShowModal] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<CompanyHoliday | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canHardDelete = userRole === 'admin';

  const changeYear = (nextYear: number) => {
    setYear(nextYear);
    router.push(`/erp/holidays?year=${nextYear}`);
  };

  const openAddModal = () => {
    setEditingHoliday(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEditModal = (holiday: CompanyHoliday) => {
    setEditingHoliday(holiday);
    setForm({
      name: holiday.name,
      date: holiday.date,
      holiday_type: holiday.holiday_type,
      description: holiday.description || '',
      is_active: holiday.is_active,
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.date) {
      toast.error('Name and date are required');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        date: form.date,
        holiday_type: form.holiday_type,
        description: form.description.trim() || undefined,
        is_active: form.is_active,
      };

      const result = editingHoliday
        ? await updateHolidayAction(editingHoliday.id, payload)
        : await createHolidayAction(payload);

      if (result.success) {
        toast.success(editingHoliday ? 'Holiday updated' : 'Holiday added');
        setShowModal(false);
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to save holiday');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (holiday: CompanyHoliday) => {
    const nextActive = !holiday.is_active;
    if (
      !confirm(
        nextActive
          ? `Reactivate "${holiday.name}"? It will reappear on employee calendars.`
          : `Archive "${holiday.name}"? It will be hidden from employee calendars but kept on record.`,
      )
    ) {
      return;
    }
    const result = await setHolidayActiveAction(holiday.id, nextActive);
    if (result.success) {
      toast.success(nextActive ? 'Holiday reactivated' : 'Holiday archived');
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to update holiday status');
    }
  };

  const handleDelete = async (holiday: CompanyHoliday) => {
    const result = await deleteHolidayAction(holiday.id);
    if (result.success) {
      toast.success('Holiday permanently deleted');
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to delete holiday');
    }
  };

  // A year of holidays is a timeline, so the list is grouped by month in
  // date order. Past days are quieted and the next active one is marked —
  // "what's coming up" is the question this page usually gets opened for.
  const sorted = [...holidays].sort((a, b) => a.date.localeCompare(b.date));
  const nextHolidayId = sorted.find((h) => h.is_active && h.date >= today)?.id;
  const byMonth = sorted.reduce<{ month: string; items: CompanyHoliday[] }[]>((groups, holiday) => {
    const month = holiday.date.slice(0, 7);
    const last = groups[groups.length - 1];
    if (last && last.month === month) last.items.push(holiday);
    else groups.push({ month, items: [holiday] });
    return groups;
  }, []);
  const typeCounts = CREATABLE_TYPES.map((type) => ({
    type,
    count: holidays.filter(
      (h) => h.is_active && (h.holiday_type === type || (type === 'company' && h.holiday_type === 'optional')),
    ).length,
  }));

  const renderActions = (holiday: CompanyHoliday) => (
    <>
      <button
        type='button'
        onClick={() => openEditModal(holiday)}
        title='Edit'
        aria-label={`Edit ${holiday.name}`}
        className='p-1 text-cyan hover:text-cyan/80 transition-colors'
      >
        <EditIcon />
      </button>
      <button
        type='button'
        onClick={() => handleToggleActive(holiday)}
        className={`${ROW_ACTION_CLASS} border-gray-700 text-gray-300 hover:text-white hover:border-gray-500`}
      >
        {holiday.is_active ? 'Archive' : 'Reactivate'}
      </button>
      {canHardDelete && (
        <DeleteConfirmButton
          onConfirm={() => handleDelete(holiday)}
          message={`Permanently delete "${holiday.name}" (${holiday.date})? This cannot be undone — consider archiving instead.`}
          title='Delete permanently'
          ariaLabel={`Delete ${holiday.name} permanently`}
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
        title='Holidays'
        description='The company holiday calendar — mandatory, floater and company days that attendance and leave count as off.'
        actions={
          <button type='button' onClick={openAddModal} className={PRIMARY_ACTION_CLASS}>
            + Add holiday
          </button>
        }
      />

      {/* Year stepper + what the year holds */}
      <div className='glass p-4 rounded-lg mb-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-3'>
        <div className='flex items-center gap-3'>
          <span className='text-[11px] font-semibold text-gray-400 uppercase tracking-wider'>Year</span>
          <div className='flex items-center gap-1 bg-[#0a0a0a] border border-gray-800 rounded-lg p-1'>
            <button
              type='button'
              onClick={() => changeYear(year - 1)}
              className='px-3 py-1.5 text-sm text-gray-400 hover:text-white rounded-md hover:bg-gray-850 transition-colors'
              aria-label='Previous year'
            >
              ←
            </button>
            <span className='px-3 py-1.5 text-sm font-semibold text-white tabular-nums'>{year}</span>
            <button
              type='button'
              onClick={() => changeYear(year + 1)}
              className='px-3 py-1.5 text-sm text-gray-400 hover:text-white rounded-md hover:bg-gray-850 transition-colors'
              aria-label='Next year'
            >
              →
            </button>
          </div>
        </div>
        <ul className='flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400'>
          {typeCounts.map(({ type, count }) => (
            <li key={type} className='flex items-center gap-1.5'>
              <span className={`w-2 h-2 rounded-full ${HOLIDAY_TYPE_INFO[type].dot}`} aria-hidden='true' />
              <span className='text-white font-semibold tabular-nums'>{count}</span> {HOLIDAY_TYPE_INFO[type].short.toLowerCase()}
            </li>
          ))}
        </ul>
      </div>

      {holidays.length === 0 ? (
        <div className='glass rounded-lg text-center py-14 px-4'>
          <p className='text-gray-300 font-medium'>No holidays set for {year}</p>
          <p className='text-sm text-gray-500 mt-1'>Add the year’s mandatory and floater days so attendance and leave count them.</p>
          <button type='button' onClick={openAddModal} className={`${PRIMARY_ACTION_CLASS} mt-5`}>
            + Add holiday
          </button>
        </div>
      ) : (
        <div className='space-y-6'>
          {byMonth.map(({ month, items }) => (
            <section key={month} aria-labelledby={`holidays-${month}`}>
              <h2
                id={`holidays-${month}`}
                className='flex items-baseline gap-2 mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500'
              >
                {new Date(`${month}-01T00:00:00Z`).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'long' })}
                <span className='text-gray-600 tabular-nums'>{items.length}</span>
              </h2>
              <ul className='glass rounded-lg divide-y divide-gray-800/70 overflow-hidden'>
                {items.map((holiday) => {
                  const info = HOLIDAY_TYPE_INFO[holiday.holiday_type];
                  const isPast = holiday.date < today;
                  const isNext = holiday.id === nextHolidayId;
                  const date = new Date(`${holiday.date}T00:00:00Z`);
                  return (
                    <li
                      key={holiday.id}
                      className={`flex items-start gap-3 @xl:gap-4 p-3 @xl:p-4 ${
                        isNext ? 'bg-[var(--cyan)]/5 shadow-[inset_3px_0_0_var(--cyan)]' : ''
                      } ${!holiday.is_active ? 'opacity-50' : ''}`}
                    >
                      {/* Date block: weekday over the day number — reads like
                          a desk-calendar page, and lines every row up on the
                          same left edge whatever the holiday's name. */}
                      <div
                        className={`w-12 @xl:w-14 shrink-0 rounded-lg border text-center py-1.5 ${
                          isNext ? 'border-[var(--cyan)]/50' : 'border-gray-800'
                        }`}
                      >
                        <p className={`text-[10px] font-semibold uppercase tracking-wider ${isNext ? 'text-cyan' : 'text-gray-500'}`}>
                          {date.toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'short' })}
                        </p>
                        <p className={`text-xl @xl:text-2xl font-bold leading-tight tabular-nums ${isPast ? 'text-gray-500' : 'text-white'}`}>
                          {date.getUTCDate()}
                        </p>
                      </div>

                      <div className='min-w-0 flex-1'>
                        <p className={`font-semibold [overflow-wrap:anywhere] ${isPast ? 'text-gray-400' : 'text-white'}`}>
                          {holiday.name}
                          {isNext && (
                            <span className='ml-2 align-middle text-[10px] font-bold uppercase tracking-wider text-cyan'>Next</span>
                          )}
                        </p>
                        {holiday.description && (
                          <p className='text-xs text-gray-500 mt-0.5 [overflow-wrap:anywhere]'>{holiday.description}</p>
                        )}
                        <div className='mt-2 flex flex-wrap items-center gap-2'>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap ${info.badge}`}
                            title={info.label}
                          >
                            <span aria-hidden='true'>{info.icon}</span> {info.short}
                          </span>
                          {!holiday.is_active && (
                            <span className='px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-500/20 text-gray-400'>
                              Archived
                            </span>
                          )}
                        </div>
                        {/* Narrow: actions under the text so the name keeps
                            the full width beside the date block. */}
                        <div className='@xl:hidden mt-3 flex flex-wrap items-center gap-2'>{renderActions(holiday)}</div>
                      </div>

                      <div className='hidden @xl:flex items-center gap-3 shrink-0 self-center'>{renderActions(holiday)}</div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingHoliday ? 'Edit Holiday' : 'Add Holiday'}
      >
        <div className='space-y-4'>
          <div>
            <label className='block text-sm font-medium mb-2'>Name *</label>
            <input
              type='text'
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder='e.g., Independence Day'
              className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
            />
          </div>

          <div>
            <label className='block text-sm font-medium mb-2'>Date *</label>
            <input
              type='date'
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
            />
          </div>

          <div>
            <label className='block text-sm font-medium mb-2'>Type *</label>
            <select
              value={form.holiday_type}
              onChange={(e) =>
                setForm({ ...form, holiday_type: e.target.value as CompanyHoliday['holiday_type'] })
              }
              className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
            >
              {CREATABLE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {HOLIDAY_TYPE_INFO[type].label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className='block text-sm font-medium mb-2'>Description (Optional)</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
              placeholder='Any additional details...'
            />
          </div>

          <div className='flex items-center gap-2'>
            <input
              type='checkbox'
              id='holiday_is_active'
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              className='w-4 h-4 rounded border-gray-700 bg-dark-800 text-cyan focus:ring-cyan'
            />
            <label htmlFor='holiday_is_active' className='text-sm text-gray-300 select-none cursor-pointer'>
              Active (visible to employees)
            </label>
          </div>

          <Button
            type='button'
            variant='primary'
            className='w-full'
            disabled={isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting ? 'Saving...' : editingHoliday ? 'Save Changes' : 'Add Holiday'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
