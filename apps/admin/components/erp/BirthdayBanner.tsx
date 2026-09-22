'use client';

/**
 * Birthday banner for the ERP admin dashboard — shows whoever's date_of_birth
 * matches today (IST). Data comes from the same getTodaysBirthdays() the
 * employee portal already uses (components/employee/CelebrationBanners.tsx),
 * so "today" and the birthday match are computed identically in both places.
 *
 * Deliberately its own small component rather than reusing
 * CelebrationBanners directly: that component also handles festivals and
 * work anniversaries (not asked for here) and needs currentEmployeeId to
 * personalize the message for "it's YOUR birthday" — meaningful in the
 * employee portal, where the viewer has one, but not on the admin
 * dashboard, where the viewer is admin/hr staff looking at this on behalf
 * of the team, not necessarily an employee themselves.
 *
 * Same one-dismiss-per-day pattern as the employee portal's banners, keyed
 * separately so dismissing one does not dismiss the other.
 */

import { useEffect, useState } from 'react';
import type { CelebrationEmployee } from '@/lib/erp/employees';

function joinNames(names: string[]): string {
  if (names.length === 0) return '';
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} & ${names[1]}`;
  return `${names.slice(0, -1).join(', ')} & ${names[names.length - 1]}`;
}

export default function BirthdayBanner({
  dateKey,
  birthdays,
}: {
  /** YYYY-MM-DD (IST) — scopes the dismissal to today only. */
  dateKey: string;
  birthdays: CelebrationEmployee[];
}) {
  const storageKey = `erp-birthday-dismissed-${dateKey}`;
  const [dismissed, setDismissed] = useState(true); // start hidden; localStorage read is client-only

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage is unavailable during SSR, so the dismissed flag cannot be read in render or a useState initializer without a hydration mismatch. Mount is the first point it is knowable.
      setDismissed(localStorage.getItem(storageKey) === '1');
    } catch {
      setDismissed(false);
    }
  }, [storageKey]);

  if (birthdays.length === 0 || dismissed) return null;

  const names = birthdays.map((b) => b.name);

  const dismiss = () => {
    try {
      localStorage.setItem(storageKey, '1');
    } catch {
      // localStorage unavailable (private browsing etc.) — just hide for this render
    }
    setDismissed(true);
  };

  return (
    <div className="relative mb-6 flex items-start gap-3 rounded-xl border border-pink-500/30 bg-gradient-to-r from-pink-500/20 via-purple-500/10 to-pink-500/20 px-4 py-3 sm:items-center">
      <span className="text-2xl leading-none" aria-hidden>
        🎂
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-white">{`Happy Birthday, ${joinNames(names)}!`}</p>
        <p className="text-sm text-gray-300">
          {`Wishing ${joinNames(names)} a birthday full of good food, great company and well-earned cake! 🎂`}
        </p>
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="shrink-0 rounded-full p-1 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
      >
        ✕
      </button>
    </div>
  );
}
