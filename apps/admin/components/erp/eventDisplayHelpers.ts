/**
 * Shared display mapping for UpcomingEvent (actions/erp/events.ts) —
 * icons, badge/dot colors, and date-label formatting used by both the
 * header's UpcomingEventsPanel drawer and the dashboard's
 * UpcomingEventsSidebar. Kept in one place so the two views of the same
 * event data can't silently drift apart (e.g. a birthday rendering pink in
 * one and a different color in the other).
 */

import type { UpcomingEventType } from '@/actions/erp/events';

export const EVENT_META: Record<
  UpcomingEventType,
  { icon: string; badge: string; dot: string }
> = {
  birthday: { icon: '🎂', badge: 'bg-pink-500/20 text-pink-400', dot: 'bg-pink-500' },
  anniversary: { icon: '🎉', badge: 'bg-purple-500/20 text-purple-400', dot: 'bg-purple-500' },
  'holiday-public': { icon: '🏛️', badge: 'bg-red-500/20 text-red-400', dot: 'bg-red-500' },
  'holiday-floater': { icon: '🎈', badge: 'bg-amber-500/20 text-amber-400', dot: 'bg-amber-500' },
  'holiday-other': { icon: '📅', badge: 'bg-blue-500/20 text-blue-400', dot: 'bg-blue-500' },
};

export function formatWhen(daysUntil: number, date: string) {
  if (daysUntil === 0) return 'Today';
  if (daysUntil === 1) return 'Tomorrow';
  if (daysUntil === -1) return 'Yesterday';
  const d = new Date(`${date}T00:00:00Z`);
  const label = d.toLocaleDateString('en-US', {
    timeZone: 'UTC',
    month: 'short',
    day: 'numeric',
  });
  return daysUntil < 0 ? `${label} (past)` : label;
}

export function monthLabel(year: number, month: number) {
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString('en-US', {
    timeZone: 'UTC',
    month: 'long',
    year: 'numeric',
  });
}
