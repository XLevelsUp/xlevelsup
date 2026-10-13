'use client';

/**
 * The app's replacement for window.confirm(). `await confirmDialog({...})`
 * resolves true/false exactly where `confirm()` returned it, so a guard keeps
 * its shape:
 *
 *   if (!(await confirmDialog({ title: 'Archive this?' }))) return;
 *
 * A module-level store plus one <ConfirmDialogHost /> in the root layout, so
 * no caller needs its own open/close state. Row-level deletes keep using
 * DeleteConfirmButton (a popover anchored to the trigger); this dialog is for
 * every other confirmation — applying, cancelling, archiving, bulk
 * recalculations — where the action isn't a delete or the copy is longer.
 */
import { useEffect, useSyncExternalStore } from 'react';
import { m as motion, AnimatePresence } from 'framer-motion';

export interface ConfirmOptions {
  /** The question itself, e.g. "Cancel this leave request?". */
  title: string;
  /** Optional consequence copy under the title. */
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** 'danger' paints the confirm button red, for cancellations and other
   * actions the user can't take back. */
  tone?: 'default' | 'danger';
}

interface PendingConfirm extends ConfirmOptions {
  resolve: (confirmed: boolean) => void;
  /** Whatever had focus when the dialog opened, usually the trigger button. */
  returnFocus: HTMLElement | null;
}

let pending: PendingConfirm | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function confirmDialog(options: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    // A newer request replaces an open one; the older caller gets the "no"
    // that dismissing it would have given.
    pending?.resolve(false);
    pending = {
      ...options,
      resolve,
      returnFocus: document.activeElement instanceof HTMLElement ? document.activeElement : null,
    };
    emit();
  });
}

function settle(confirmed: boolean) {
  if (!pending) return;
  const { resolve, returnFocus } = pending;
  pending = null;
  emit();
  returnFocus?.focus();
  resolve(confirmed);
}

export default function ConfirmDialogHost() {
  const request = useSyncExternalStore(
    subscribe,
    () => pending,
    () => null,
  );

  useEffect(() => {
    if (!request) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') settle(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [request]);

  const confirmClassName =
    request?.tone === 'danger'
      ? 'bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25'
      : 'bg-gradient-to-r from-[var(--cyan)] to-[var(--purple)] text-white hover:shadow-lg hover:shadow-[var(--purple)]/40';

  return (
    <AnimatePresence>
      {request && (
        // z-[60] keeps it above the z-50 ui/Modal it may be opened from.
        <div key='confirm-dialog' className='fixed inset-0 z-[60] flex items-center justify-center p-4'>
          <motion.div
            className='absolute inset-0 bg-black/70 backdrop-blur-md'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => settle(false)}
          />

          <motion.div
            role='alertdialog'
            aria-modal='true'
            aria-labelledby='confirm-dialog-title'
            aria-describedby={request.message ? 'confirm-dialog-message' : undefined}
            className='glass relative w-full max-w-md rounded-2xl p-5 sm:p-6 shadow-2xl'
            initial={{ scale: 0.95, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 12 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <h2 id='confirm-dialog-title' className='text-lg font-bold text-white'>
              {request.title}
            </h2>
            {request.message && (
              <p id='confirm-dialog-message' className='mt-2 text-sm leading-relaxed text-gray-300'>
                {request.message}
              </p>
            )}

            <div className='mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end'>
              <button
                type='button'
                onClick={() => settle(false)}
                className='px-4 py-2 rounded-lg text-sm font-semibold text-gray-300 hover:bg-white/10 transition-colors'
              >
                {request.cancelLabel ?? 'Cancel'}
              </button>
              <button
                type='button'
                // Enter confirms, as it does in the native dialog.
                autoFocus
                onClick={() => settle(true)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${confirmClassName}`}
              >
                {request.confirmLabel ?? 'Confirm'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
