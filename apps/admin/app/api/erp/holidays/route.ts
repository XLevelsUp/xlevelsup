/**
 * GET /api/erp/holidays?year=2026
 * Returns active company holidays for a given year.
 * Used by the client-side DatePicker to highlight/block holiday dates.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getHolidaysForYear } from '@/lib/erp/holidays';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const yearParam = searchParams.get('year');
    const year = yearParam ? parseInt(yearParam) : new Date().getFullYear();

    const holidays = await getHolidaysForYear(year);

    return NextResponse.json({ holidays });
  } catch (error) {
    console.error('Failed to fetch holidays:', error);
    return NextResponse.json(
      { error: 'Failed to fetch holidays' },
      { status: 500 },
    );
  }
}
