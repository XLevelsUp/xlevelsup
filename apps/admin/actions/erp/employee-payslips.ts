'use server';

/**
 * Self-service payslip access for the employee portal.
 *
 * Deliberately separate from actions/erp/payroll.ts, which is entirely
 * admin/hr-gated via the ERP session (requireRole) — mixing an
 * employee-session-gated export into that file risked someone reading the
 * requireRole guards nearby and assuming every export there was equally
 * gated. Kept minimal on purpose: read-only, an employee's own payslips only.
 */

import { getEmployeeSession } from '@/lib/erp/employee-portal-auth';
import { getEmployeePayslips, getEmployeePayslipPath, type EmployeePayslip } from '@/lib/erp/payroll';
import { getPayslipSignedUrl } from '@/lib/erp/payslips';

/**
 * The caller's own payslips, newest first. Identity comes from the
 * employee-portal session, not a client-supplied id — there is no argument
 * to tamper with to see someone else's list.
 */
export async function getMyPayslipsAction(): Promise<EmployeePayslip[]> {
  const session = await getEmployeeSession();
  if (!session) return [];
  return getEmployeePayslips(session.id);
}

/**
 * A short-lived signed URL to view/download one of the caller's own
 * payslips. Takes the ledger row id, not a storage path — ownership is
 * re-checked against the database on every call (see
 * getEmployeePayslipPath), so a tampered request can't be pointed at
 * another employee's file by passing a different id or path.
 */
export async function getMyPayslipUrlAction(
  ledgerEntryId: number,
): Promise<{ url: string | null }> {
  const session = await getEmployeeSession();
  if (!session) return { url: null };

  const path = await getEmployeePayslipPath(ledgerEntryId, session.id);
  if (!path) return { url: null };

  const url = await getPayslipSignedUrl(path);
  return { url };
}
