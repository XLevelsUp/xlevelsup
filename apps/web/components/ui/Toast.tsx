'use client';

/**
 * The one visual for every toast in the app. ToastProvider renders this for
 * each toast react-hot-toast queues, so the library's default white pill never
 * shows. Enter/exit motion is the `toast-enter`/`toast-exit` keyframes in
 * globals.css, keyed off `t.visible` — the engine keeps a dismissed toast
 * mounted for a beat so the exit can play.
 */
import { resolveValue, type Toast as QueuedToast } from 'react-hot-toast';
import { toast, toneOf, type ToastTone } from '@/lib/toast';

const TONE_STYLES: Record<ToastTone, { accent: string; badge: string }> = {
  success: { accent: 'border-l-emerald-400', badge: 'bg-emerald-500/15 text-emerald-400' },
  error: { accent: 'border-l-red-400', badge: 'bg-red-500/15 text-red-400' },
  warning: { accent: 'border-l-amber-400', badge: 'bg-amber-500/15 text-amber-400' },
  info: { accent: 'border-l-[var(--cyan)]', badge: 'bg-[var(--cyan)]/15 text-[var(--cyan)]' },
  loading: { accent: 'border-l-[var(--cyan)]', badge: 'bg-[var(--cyan)]/15 text-[var(--cyan)]' },
};

// Outline icons on a 24px grid, drawn with currentColor so the badge's text
// colour tints them.
const TONE_PATHS: Record<Exclude<ToastTone, 'loading'>, string> = {
  success: 'M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  error: 'm9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  warning:
    'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z',
  info: 'm11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z',
};

function ToneIcon({ tone }: { tone: ToastTone }) {
  if (tone === 'loading') {
    return (
      <svg className='h-[18px] w-[18px] animate-spin' viewBox='0 0 24 24' fill='none' aria-hidden='true'>
        <circle cx='12' cy='12' r='9' stroke='currentColor' strokeOpacity='0.25' strokeWidth='2.5' />
        <path d='M21 12a9 9 0 0 0-9-9' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' />
      </svg>
    );
  }
  return (
    <svg
      className='h-[18px] w-[18px]'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='1.8'
      strokeLinecap='round'
      strokeLinejoin='round'
      aria-hidden='true'
    >
      <path d={TONE_PATHS[tone]} />
    </svg>
  );
}

export default function Toast({ t }: { t: QueuedToast }) {
  const tone = toneOf(t);
  const styles = TONE_STYLES[tone];

  return (
    <div
      {...t.ariaProps}
      className={`${t.visible ? 'toast-enter' : 'toast-exit'} pointer-events-auto flex w-[min(24rem,calc(100vw-2rem))] items-start gap-3 rounded-xl border border-white/10 border-l-[3px] ${styles.accent} bg-[#141420]/95 p-3 pr-2 shadow-2xl shadow-black/50 backdrop-blur-md`}
    >
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${styles.badge}`}>
        <ToneIcon tone={tone} />
      </span>

      <div className='min-w-0 flex-1 break-words pt-1.5 text-sm leading-snug text-gray-100'>
        {resolveValue(t.message, t)}
      </div>

      {tone !== 'loading' && (
        <button
          type='button'
          onClick={() => toast.dismiss(t.id)}
          aria-label='Dismiss notification'
          className='shrink-0 rounded-md p-1 text-gray-500 transition-colors hover:bg-white/10 hover:text-white'
        >
          <svg
            className='h-4 w-4'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            aria-hidden='true'
          >
            <path d='M6 18 18 6M6 6l12 12' />
          </svg>
        </button>
      )}
    </div>
  );
}
