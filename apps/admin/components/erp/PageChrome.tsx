'use client';

/**
 * Shared page furniture for ERP module pages: the title header, the section
 * tab strip, filter fields and the compact action-button styles.
 *
 * Everything here sizes against the nearest `@container` — put
 * `className='@container pb-20'` on the module's root element. Container
 * width, not viewport width, is what matters inside this layout: the sidebar
 * takes 72–260px of the screen, so "1280px viewport" can mean anything from
 * ~950px to ~1150px of actual room. (pb-20 keeps the page's last row clear
 * of the fixed QuickActionFAB in the bottom-right corner.)
 */

import { useEffect, useRef, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

/** Text inputs and selects in a filter panel or toolbar. */
export const FIELD_CLASS =
  'w-full min-w-0 px-3 py-1.5 text-sm rounded-lg bg-dark-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-[var(--cyan)]';

// Compact action buttons. The shared ui/Button is sized for the marketing
// site (px-8 py-4 text-lg) — two or three of them side by side were wider
// than a phone and pushed the whole page sideways.
export const PRIMARY_ACTION_CLASS =
  'inline-flex items-center justify-center whitespace-nowrap px-4 py-2 text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-cyan to-purple hover:shadow-lg hover:shadow-purple/50 transition-shadow disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cyan)]';
export const SECONDARY_ACTION_CLASS =
  'inline-flex items-center justify-center whitespace-nowrap px-3 py-1.5 text-sm font-semibold rounded-lg border border-gray-700 bg-dark-800 text-gray-300 hover:text-white hover:border-[var(--cyan)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cyan)]';
/** Destructive page-level actions (e.g. "Delete month") — same footprint as
 * the primary button so the two sit level in a header row. */
export const DANGER_ACTION_CLASS =
  'inline-flex items-center justify-center whitespace-nowrap px-4 py-2 text-sm font-semibold rounded-lg border border-red-500/40 bg-red-500/5 text-red-400 hover:border-red-400 hover:text-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400';

/** Small uppercase chip-buttons used for per-row actions in tables and cards. */
export const ROW_ACTION_CLASS =
  'inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase whitespace-nowrap border transition-colors disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--cyan)]';

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: React.ReactNode;
  /** Header buttons. On narrow containers they share one row in equal
   * columns (with tighter padding so three fit a phone); wide containers
   * put them beside the title at their natural width. */
  actions?: React.ReactNode;
}) {
  return (
    <div className='flex flex-col @3xl:flex-row @3xl:items-end justify-between gap-4 mb-6'>
      <div className='min-w-0'>
        <h1 className='text-2xl @xl:text-3xl font-bold gradient-text'>{title}</h1>
        {description && (
          <p className='text-sm @xl:text-base text-gray-400 mt-1.5 max-w-2xl'>{description}</p>
        )}
      </div>
      {actions && (
        <div className='grid grid-flow-col auto-cols-fr gap-2 *:min-w-0 *:px-2 @md:*:px-4 @3xl:flex @3xl:shrink-0'>
          {actions}
        </div>
      )}
    </div>
  );
}

export interface PageTab {
  id: string;
  label: string;
  href: string;
}

/**
 * Section tabs under a PageHeader. Scrolls sideways on narrow containers,
 * with a fade on the right edge so it reads as scrollable, and brings the
 * active tab into view so landing on a later tab doesn't hide its highlight.
 */
export function PageTabs({ tabs, active, label }: { tabs: PageTab[]; active: string; label: string }) {
  const activeRef = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [active]);

  return (
    <nav
      aria-label={label}
      className='flex border-b border-gray-800 gap-1 overflow-x-auto mb-6 select-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pr-10 @4xl:pr-0 [mask-image:linear-gradient(to_right,black_calc(100%-2.5rem),transparent)] @4xl:[mask-image:none]'
    >
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <Link
            key={tab.id}
            href={tab.href}
            ref={isActive ? activeRef : undefined}
            aria-current={isActive ? 'page' : undefined}
            className={`shrink-0 px-3 @xl:px-5 py-2.5 @xl:py-3 border-b-2 text-sm font-semibold whitespace-nowrap transition-all duration-200 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--cyan)] ${
              isActive
                ? 'border-cyan text-cyan bg-cyan/5'
                : 'border-transparent text-gray-400 hover:text-white hover:bg-gray-900/40'
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

/**
 * One filter control with its label. The label row is its own flex line with
 * a fixed min-height, so a field with an inline control beside its label
 * (e.g. a Month/Year/All switch) lines up with plain ones instead of
 * colliding with the neighbouring field's label. Renders a <label> so the
 * text is tied to its control, except when `aside` holds its own buttons.
 */
export function FilterField({
  label,
  aside,
  className = '',
  children,
}: {
  label: string;
  aside?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  const Wrapper = aside ? 'div' : 'label';
  return (
    <Wrapper className={`block min-w-0 ${className}`}>
      <span className='flex items-center justify-between gap-2 mb-1.5 min-h-5'>
        <span className='text-[11px] font-semibold text-gray-400 uppercase tracking-wider truncate'>{label}</span>
        {aside}
      </span>
      {children}
    </Wrapper>
  );
}

// Active colour per chip tone — the same yellow/green/red/grey the status
// badges on these pages already use, so a chip and the rows it filters to
// read as the same thing.
const CHIP_TONES = {
  pending: 'bg-yellow-500 text-black border-yellow-500',
  approved: 'bg-green-500 text-black border-green-500',
  rejected: 'bg-red-500 text-white border-red-500',
  cancelled: 'bg-gray-500 text-white border-gray-500',
  all: 'bg-[var(--cyan)] text-black border-[var(--cyan)]',
  // For non-review statuses (e.g. time tracking's "Completed" / "On leave").
  info: 'bg-blue-500 text-black border-blue-500',
  warning: 'bg-orange-500 text-black border-orange-500',
} as const;

export interface StatusChipOption {
  value: string;
  label: string;
  count: number;
  tone: keyof typeof CHIP_TONES;
}

/**
 * Single-choice status filter with a count on each chip, for review queues
 * (leave, attendance requests). Wraps onto further rows rather than
 * overflowing; each chip keeps label and count together on one line.
 */
export function StatusChips({
  options,
  value,
  onChange,
  label,
}: {
  options: StatusChipOption[];
  value: string;
  onChange: (value: string) => void;
  label: string;
}) {
  return (
    <div role='group' aria-label={label} className='flex flex-wrap gap-2'>
      {options.map((opt) => {
        const isActive = opt.value === value;
        return (
          <button
            key={opt.value}
            type='button'
            onClick={() => onChange(opt.value)}
            aria-pressed={isActive}
            className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cyan)] ${
              isActive ? CHIP_TONES[opt.tone] : 'bg-dark-800 border-gray-700 text-gray-300 hover:text-white hover:border-gray-500'
            }`}
          >
            {opt.label}
            <span className={`tabular-nums ${isActive ? 'opacity-70' : 'text-gray-500'}`}>{opt.count}</span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * Re-fetches the current page's server data in place (router.refresh) — for
 * live views such as time tracking, where the alternative was telling people
 * to reload the browser tab.
 */
export function RefreshButton({ className = SECONDARY_ACTION_CLASS }: { className?: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  return (
    <button
      type='button'
      onClick={() => startTransition(() => router.refresh())}
      disabled={isPending}
      className={`${className} gap-2`}
    >
      <svg
        className={`w-3.5 h-3.5 ${isPending ? 'animate-spin' : ''}`}
        fill='none'
        viewBox='0 0 24 24'
        stroke='currentColor'
        strokeWidth='2'
        aria-hidden='true'
      >
        <path strokeLinecap='round' strokeLinejoin='round' d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' />
      </svg>
      {isPending ? 'Refreshing…' : 'Refresh'}
    </button>
  );
}

/** Grid for a FilterField panel: one column on phones, two on small
 * containers, then as many ~11rem fields per row as fit. */
export const FILTER_GRID_CLASS =
  'grid grid-cols-1 @md:grid-cols-2 @3xl:grid-cols-[repeat(auto-fill,minmax(11rem,1fr))] gap-x-3 gap-y-4 items-end';
