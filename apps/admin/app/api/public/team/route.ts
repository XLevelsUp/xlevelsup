/**
 * GET /api/public/team
 *
 * The cross-app boundary for the marketing site's /team page.
 *
 * Before the monorepo split this page imported lib/erp/team.ts directly, which
 * meant the public-facing marketing server needed SUPABASE_SERVICE_ROLE_KEY in
 * its environment. Serving it from here instead keeps that key confined to the
 * internal admin deployment.
 *
 * The payload is exactly what the public team page already renders in the
 * browser today, so this exposes nothing that wasn't already public. It is
 * unauthenticated by design — apps/web calls it server-side during ISR, and an
 * auth check would only add a secret to rotate for no confidentiality gain.
 *
 * NOTE: the response shape is a contract. apps/web/lib/team.ts declares a
 * matching TeamMember interface; change one and you must change the other.
 */

import { NextResponse } from 'next/server';
import { getTeamMembers } from '@/lib/erp/team';

// Recomputed at most every 5 minutes — matches the `revalidate` on the
// marketing /team page, so a new employee shows up within one window rather
// than two stacked ones.
export const revalidate = 300;

export async function GET() {
  try {
    const members = await getTeamMembers();

    return NextResponse.json(
      { members },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      },
    );
  } catch (error) {
    console.error('[api/public/team] failed:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team members' },
      { status: 500 },
    );
  }
}
