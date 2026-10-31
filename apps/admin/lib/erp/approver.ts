/**
 * Approval gates.
 *
 * - requireAdminApprover: every approval in the ERP — employees' leave and
 *   attendance change / regularisation requests, payroll, expenses, ledger
 *   entries, salary structures, career changes — can be given by ANY admin,
 *   so nothing queues up behind one person.
 * - assertNotOwn / isOwnEmployeeRecord: …but never for themselves. The execs
 *   are admins AND employees, so an admin can't approve anything that pays
 *   them or that they raised for approval, or change their own salary or
 *   role — another admin has to.
 * - requireApprover (sole approver): single-day attendance edits and deletes
 *   stay with the admin login linked to APPROVER_EMPLOYEE_ID. Bulk attendance
 *   is open to any admin, their own record included.
 *
 * Kept out of lib/auth.ts on purpose: that module is imported by
 * middleware.ts (edge runtime) and must stay free of the database client.
 */

import { supabaseServer as supabase } from '@/lib/supabase-server';
import { requireAuth, requireRole, type SessionPayload } from '@/lib/auth';
import type { UserRole } from '@/types/erp';
import { APPROVER_EMPLOYEE_ID } from '@/config/approvals.config';

export const APPROVER_ONLY_ERROR = `Only the designated approver (${APPROVER_EMPLOYEE_ID}) can do this.`;

/** Roles that may give approvals (see requireAdminApprover). */
export const ADMIN_APPROVER_ROLES: UserRole[] = ['admin'];

export const ADMIN_APPROVER_ONLY_ERROR = 'Only an admin can approve this.';

/** Changing your own salary or role — never allowed, approval or not. */
export const OWN_PAY_CHANGE_ERROR = 'Changes to your own salary or role need another admin.';

/** `You can't approve your own <what> — another admin has to.` */
export function ownApprovalError(what: string): string {
  return `You can't approve your own ${what} — another admin has to.`;
}

/** Whether this session may give approvals at all. */
export function isAdminApprover(session: Pick<SessionPayload, 'role'> | null): boolean {
  return !!session && ADMIN_APPROVER_ROLES.includes(session.role);
}

/**
 * Require a session that may give approvals — any admin. Throws (like
 * requireRole) otherwise, so callers' existing catch blocks surface the
 * message. Callers still apply assertNotOwn to the item being approved.
 */
export async function requireAdminApprover(): Promise<SessionPayload> {
  const session = await requireAuth();
  if (!isAdminApprover(session)) {
    throw new Error(ADMIN_APPROVER_ONLY_ERROR);
  }
  return session;
}

/**
 * The employees.id linked to this admin login (employees.user_id), or null
 * if the login isn't linked to an employee record. Same link the employee
 * portal's admin bridge uses (getEmployeeSession).
 */
export async function getLinkedEmployeeId(
  session: Pick<SessionPayload, 'userId'>,
): Promise<number | null> {
  const { data, error } = await supabase
    .from('employees')
    .select('id')
    .eq('user_id', session.userId)
    .maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
}

/** Whether `employeeId` is the employee record linked to this admin login. */
export async function isOwnEmployeeRecord(
  session: Pick<SessionPayload, 'userId'>,
  employeeId: number | null | undefined,
): Promise<boolean> {
  if (employeeId == null) return false;
  return (await getLinkedEmployeeId(session)) === employeeId;
}

/**
 * Two-person rule: throws when the item is the admin's own — raised by their
 * login (`raisedBy`, a users.id) or for their own employee record
 * (`forEmployeeId`) — so another admin has to approve it. Callers gate only
 * approving / paying out with this; rejecting, or moving something back to
 * pending or draft, stays open to them.
 */
export async function assertNotOwn(
  session: Pick<SessionPayload, 'userId'>,
  what: string,
  { raisedBy, forEmployeeId }: { raisedBy?: number | null; forEmployeeId?: number | null },
): Promise<void> {
  const own =
    (raisedBy != null && raisedBy === session.userId) ||
    (await isOwnEmployeeRecord(session, forEmployeeId));
  if (own) {
    throw new Error(ownApprovalError(what));
  }
}

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

/** Whether this ERP session belongs to the sole approver (single-day attendance writes). */
export async function isApprover(session: Pick<SessionPayload, 'userId'> | null): Promise<boolean> {
  if (!session) return false;
  const approverUserId = await getApproverUserId();
  return approverUserId !== null && approverUserId === session.userId;
}

/**
 * Require the sole approver's admin session — now only for single-day
 * attendance edits and deletes. Throws (like requireRole) otherwise, so
 * callers' existing catch blocks surface the message.
 */
export async function requireApprover(): Promise<SessionPayload> {
  const session = await requireRole(['admin', 'hr']);
  if (!(await isApprover(session))) {
    throw new Error(APPROVER_ONLY_ERROR);
  }
  return session;
}
