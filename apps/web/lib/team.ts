/**
 * Team data for the public /team page.
 *
 * Reads from the admin app's public endpoint rather than from Supabase
 * directly. The employee table is ERP-owned, and going through admin keeps
 * SUPABASE_SERVICE_ROLE_KEY out of this deployment entirely — the marketing
 * server holds no database credentials at all.
 *
 * Sorting, hierarchy inference and specialty parsing all happen admin-side in
 * lib/erp/team.ts; what arrives here is already in display order.
 */

/**
 * Contract with apps/admin/app/api/public/team/route.ts.
 * Mirrors TeamMember in apps/admin/lib/erp/team.ts — change both together.
 */
export interface TeamMember {
  id: number;
  employee_id: string;
  name: string;
  role: string;
  department: string;
  employment_type: string;
  joining_date: string;
  hierarchy_level: number;
  exec_order: number;
  specialty: string | null;
}

const ADMIN_URL =
  process.env.NEXT_PUBLIC_ADMIN_URL ?? 'https://admin.xlevelsup.com';

/**
 * Fetch the public team roster.
 *
 * Returns [] on any failure. The /team page is marketing copy plus a roster —
 * an admin outage should degrade it to the copy, not take the page down with a
 * 500, so this never throws.
 */
export async function getTeamMembers(): Promise<TeamMember[]> {
  try {
    const res = await fetch(`${ADMIN_URL}/api/public/team`, {
      // Matches `revalidate = 300` on the page. Explicit here because the
      // default for an absolute-URL fetch is no-store in Next 16.
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      console.error(`[team] admin responded ${res.status}`);
      return [];
    }

    const data = (await res.json()) as { members?: TeamMember[] };
    return data.members ?? [];
  } catch (error) {
    console.error('[team] fetch failed:', error);
    return [];
  }
}

/** Unique department list, preserving the display order of the sorted roster. */
export function getUniqueDepartments(members: TeamMember[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const m of members) {
    if (!seen.has(m.department)) {
      seen.add(m.department);
      result.push(m.department);
    }
  }
  return result;
}
