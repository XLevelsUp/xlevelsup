/**
 * Team page data fetching for the public website.
 * Fetches active employees ordered by hierarchy (role seniority),
 * then department, then tenure (joining date ascending = more senior).
 */

import { supabaseServer as supabase } from '@/lib/supabase-server';

export interface TeamMember {
  id: number;
  employee_id: string;
  name: string;
  role: string;       // job designation e.g. "CEO", "Lead Engineer"
  department: string;
  employment_type: string;
  joining_date: string;
  hierarchy_level: number; // 1 = C-Suite, 2 = VP/Director/Head, 3 = Lead/Senior, 4 = mid, 5 = junior
  exec_order: number;      // within tier-1: CEO=0, CTO=1, CFO=2, others=99
  specialty: string | null; // secondary skill from compound roles e.g. "UI UX Engineer" from "CFO & UI UX Engineer"
}

/**
 * Employment types that should NOT appear on the public team page.
 * - temporary: short-term workers
 * - freelancer: external contractors (e.g. Prahal)
 * - intern:     trainees
 */
const EXCLUDED_EMPLOYMENT_TYPES = ['temporary', 'freelancer', 'intern'] as const;

/**
 * Keywords that define seniority tiers (case-insensitive, checked via includes).
 * Lower number = higher tier.
 */
const TIER_RULES: { keywords: string[]; level: number }[] = [
  { keywords: ['founder', 'ceo', 'cto', 'coo', 'cmo', 'cfo', 'chief', 'president', 'managing director', 'md'], level: 1 },
  { keywords: ['vp', 'vice president', 'director', 'head of', 'head -'], level: 2 },
  { keywords: ['lead', 'senior', 'sr.', 'principal', 'architect', 'manager', 'team lead'], level: 3 },
  { keywords: ['associate', 'specialist', 'executive', 'analyst', 'engineer', 'designer', 'developer', 'strategist'], level: 4 },
];

function getHierarchyLevel(role: string): number {
  const lower = role.toLowerCase();
  for (const tier of TIER_RULES) {
    if (tier.keywords.some((kw) => lower.includes(kw))) {
      return tier.level;
    }
  }
  return 5; // intern / junior / other
}

/**
 * Within the executive tier (level 1) enforce the fixed order:
 *   CEO → CTO → CFO → everything else (by joining date)
 */
const EXEC_ORDER_MAP: { keyword: string; order: number }[] = [
  { keyword: 'ceo',     order: 0 },
  { keyword: 'founder', order: 0 }, // co-founders share CEO slot
  { keyword: 'cto',     order: 1 },
  { keyword: 'cfo',     order: 2 },
  { keyword: 'coo',     order: 3 },
  { keyword: 'cmo',     order: 4 },
  { keyword: 'chief',   order: 5 },
  { keyword: 'president', order: 6 },
  { keyword: 'managing director', order: 7 },
];

function getExecOrder(role: string): number {
  const lower = role.toLowerCase();
  for (const { keyword, order } of EXEC_ORDER_MAP) {
    if (lower.includes(keyword)) return order;
  }
  return 99; // other C-level titles — fall to the end of tier-1
}

/**
 * Extract a secondary specialty from compound role titles.
 * e.g. "CFO & UI UX Engineer" → "UI UX Engineer"
 *      "CTO / Lead Developer"  → "Lead Developer"
 *      "CEO"                   → null
 */
function getSpecialty(role: string): string | null {
  // Split on common separators: &, /, |, –, —, +, " and "
  const parts = role.split(/[&\/|\-–—+]|\band\b/i).map((p) => p.trim()).filter(Boolean);
  if (parts.length < 2) return null;

  // The first part is the primary title; the rest form the specialty
  return parts.slice(1).join(' & ').trim() || null;
}

/**
 * Fetch active, non-temporary employees for the public team page.
 * Results are pre-sorted: by hierarchy level → department → joining_date.
 */
export async function getTeamMembers(): Promise<TeamMember[]> {
  const { data, error } = await supabase
    .from('employees')
    .select('id, employee_id, name, role, department, employment_type, joining_date')
    .eq('status', 'active')
    // Exclude employment types that should not appear publicly
    .not('employment_type', 'in', `(${EXCLUDED_EMPLOYMENT_TYPES.join(',')})`)
    .order('joining_date', { ascending: true });

  if (error) {
    console.error('[team] fetch error:', error.message);
    return [];
  }

  const members: TeamMember[] = (data ?? []).map((emp) => ({
    ...emp,
    hierarchy_level: getHierarchyLevel(emp.role),
    exec_order:      getExecOrder(emp.role),
    specialty:       getSpecialty(emp.role),
  }));

  // Sort:
  //  1. hierarchy_level asc  (tier-1 execs first)
  //  2. within tier-1: exec_order (CEO=0, CTO=1, CFO=2, …)
  //  3. department asc
  //  4. joining_date asc (longest-serving first within same dept)
  members.sort((a, b) => {
    if (a.hierarchy_level !== b.hierarchy_level) return a.hierarchy_level - b.hierarchy_level;
    if (a.hierarchy_level === 1 && a.exec_order !== b.exec_order) return a.exec_order - b.exec_order;
    if (a.department !== b.department) return a.department.localeCompare(b.department);
    return a.joining_date.localeCompare(b.joining_date);
  });

  return members;
}

/** Returns unique department list (preserving display order from sorted members) */
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
