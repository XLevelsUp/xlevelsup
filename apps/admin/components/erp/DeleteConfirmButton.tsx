'use client';

/**
 * Delete trigger with a small confirmation popover anchored to itself,
 * instead of the browser's default window.confirm(). Replaces every
 * `if (!confirm('...')) return;` guard in front of a destructive action
 * across the ERP (payroll, employees, clients, expenses, holidays, finance,
 * attendance) — same idea in one place rather than reimplemented per file.
 *
 * Positioning/portal mechanics follow the same pattern already established
 * by MonthPicker.tsx: a body-portal escapes any ancestor's overflow/stacking
 * context (these triggers usually live in a scrollable table's rightmost
 * column), with live reposition on scroll/resize and outside-click-to-close.
 * Anchored to the trigger's RIGHT edge and flipped above when there is not
 * enough room below — MonthPicker doesn't need either, since it always
 * opens from a left-aligned filter field, never a table's last column.
 *
 * Two trigger shapes, since the actual call sites use both:
 *  - `variant="icon"` (default): a plain <button>, matching the icon-only
 *    delete buttons in every table row.
 *  - `variant="button"`: renders `children` through the shared ui/Button
 *    component instead, for the one call site (PayrollManager's "Delete
 *    Payroll for Month") that already uses it for a styled, full-width
 *    action. Button.tsx is a plain function component (no forwardRef), so
 *    this wraps it in a ref'd span for position measurement rather than
 *    modifying the shared component for one caller.
 */

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import Button from '@/components/ui/Button';

interface Position {
  top?: number;
  bottom?: number;
  right: number;
}

interface DeleteConfirmButtonProps {
  /** Confirmation copy — shown verbatim, same role as window.confirm()'s message. */
  message: string;
  /** Runs only after the user confirms. May be async; the popover disables
   * itself and shows `confirmingLabel` while it's pending. */
  onConfirm: () => void | Promise<void>;
  children: ReactNode;
  confirmLabel?: string;
  confirmingLabel?: string;
  cancelLabel?: string;
  className?: string;
  title?: string;
  ariaLabel?: string;
  disabled?: boolean;
  variant?: 'icon' | 'button';
  /** Runs before the popover opens; returning false cancels the click
   * silently (the callback is expected to have already surfaced its own
   * feedback, e.g. a toast) instead of showing a confirmation for an action
   * that isn't actually valid yet — e.g. "delete payroll for month" with no
   * month selected. */
  onBeforeOpen?: () => boolean;
}

export default function DeleteConfirmButton({
  message,
  onConfirm,
  children,
  confirmLabel = 'Delete',
  confirmingLabel = 'Deleting…',
  cancelLabel = 'Cancel',
  className,
  title,
  ariaLabel,
  disabled = false,
  variant = 'icon',
  onBeforeOpen,
}: DeleteConfirmButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [position, setPosition] = useState<Position | null>(null);
  const triggerRef = useRef<HTMLElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // SSR-safe portal gate (document doesn't exist during server render) —
  // same pattern as MonthPicker.tsx.
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUpward = spaceBelow < 180;
      setPosition({
        top: openUpward ? undefined : rect.bottom + 8,
        bottom: openUpward ? window.innerHeight - rect.top + 8 : undefined,
        right: window.innerWidth - rect.right,
      });
    };

    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target) || popoverRef.current?.contains(target)) {
        return;
      }
      setIsOpen(false);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleTriggerClick = () => {
    if (disabled || confirming) return;
    if (isOpen) {
      setIsOpen(false);
      return;
    }
    if (onBeforeOpen && !onBeforeOpen()) return;
    setIsOpen(true);
  };

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      await onConfirm();
    } finally {
      setConfirming(false);
      setIsOpen(false);
    }
  };

  const trigger =
    variant === 'button' ? (
      // Button.tsx has no forwardRef, so the ref for position measurement
      // goes on this tightly-fitting wrapper instead of the button itself.
      <span ref={triggerRef as React.Ref<HTMLSpanElement>} className='inline-block'>
        <Button
          type='button'
          variant='secondary'
          className={className}
          disabled={disabled || confirming}
          onClick={handleTriggerClick}
        >
          {confirming ? confirmingLabel : children}
        </Button>
      </span>
    ) : (
      <button
        ref={triggerRef as React.Ref<HTMLButtonElement>}
        type='button'
        onClick={handleTriggerClick}
        disabled={disabled || confirming}
        title={title}
        aria-label={ariaLabel}
        className={className}
      >
        {children}
      </button>
    );

  return (
    <>
      {trigger}

      {isOpen &&
        mounted &&
        position &&
        createPortal(
          <div
            ref={popoverRef}
            style={{ position: 'fixed', top: position.top, bottom: position.bottom, right: position.right }}
            className='z-[9999] w-64 glass rounded-lg border border-gray-700 p-3.5 shadow-xl'
          >
            <p className='text-sm text-gray-200 mb-3'>{message}</p>
            <div className='flex justify-end gap-2'>
              <button
                type='button'
                onClick={() => setIsOpen(false)}
                disabled={confirming}
                className='px-3 py-1.5 rounded-md text-xs font-semibold text-gray-300 hover:bg-gray-800 transition-colors disabled:opacity-50'
              >
                {cancelLabel}
              </button>
              <button
                type='button'
                onClick={handleConfirm}
                disabled={confirming}
                className='px-3 py-1.5 rounded-md text-xs font-semibold bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25 transition-colors disabled:opacity-50'
              >
                {confirming ? confirmingLabel : confirmLabel}
              </button>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
