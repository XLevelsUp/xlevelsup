/**
 * Sole-approver gate. Every approval in the ERP, and every direct attendance
 * write, is restricted to the admin login linked to APPROVER_EMPLOYEE_ID —
 * other admin/HR users can still view and raise things, but not approve them.
 *
 * Kept out of lib/auth.ts on purpose: that module is imported by
 * middleware.ts (edge runtime) and must stay free of the database client.
 */

import { supabaseServer as supabase } from '@/lib/supabase-server';
import { requireRole, type SessionPayload } from '@/lib/auth';
import { APPROVER_EMPLOYEE_ID } from '@/config/approvals.config';

export const APPROVER_ONLY_ERROR = `Only the designated approver (${APPROVER_EMPLOYEE_ID}) can do this.`;

/** The `users.id` of the approver's admin login, or null if not linked. */
async function getApproverUserId(): Promise<number | null> {
  const { data, error } = await supabase
    .from('employees')
    .select('user_id')
    .eq('employee_id', APPROVER_EMPLOYEE_ID)
    .maybeSingle();
  if (error) throw error;
  return data?.user_id ?? null;
}

/** Whether this ERP session belongs to the approver. */
export async function isApprover(session: Pick<SessionPayload, 'userId'> | null): Promise<boolean> {
  if (!session) return false;
  const approverUserId = await getApproverUserId();
  return approverUserId !== null && approverUserId === session.userId;
}

/**
 * Require the approver's admin session. Throws (like requireRole) otherwise,
 * so callers' existing catch blocks surface the message.
 */
export async function requireApprover(): Promise<SessionPayload> {
  const session = await requireRole(['admin', 'hr']);
  if (!(await isApprover(session))) {
    throw new Error(APPROVER_ONLY_ERROR);
  }
  return session;
}
