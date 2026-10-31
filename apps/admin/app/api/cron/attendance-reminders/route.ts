/**
 * POST /api/cron/attendance-reminders?type=clock-in|clock-out
 * Sends the day's attendance reminder. Called by the Supabase schedule (see
 * db/migrations/schedule-attendance-reminders.sql), which holds CRON_SECRET.
 * Lives outside middleware.ts's /erp matcher, so this check is its only gate.
 */

import { createHash, timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { sendAttendanceReminders } from '@/lib/erp/notifications';

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  // No secret configured means nobody gets in, not everybody.
  if (!secret) return false;

  // Hashed so the comparison is constant-time whatever length was sent.
  const hash = (value: string) => createHash('sha256').update(value).digest();
  return timingSafeEqual(
    hash(request.headers.get('authorization') ?? ''),
    hash(`Bearer ${secret}`),
  );
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const kind = request.nextUrl.searchParams.get('type');
  if (kind !== 'clock-in' && kind !== 'clock-out') {
    return NextResponse.json({ error: 'type must be clock-in or clock-out' }, { status: 400 });
  }

  try {
    return NextResponse.json(await sendAttendanceReminders(kind));
  } catch (error) {
    console.error('Attendance reminders failed:', error);
    return NextResponse.json({ error: 'Failed to send reminders' }, { status: 500 });
  }
}
