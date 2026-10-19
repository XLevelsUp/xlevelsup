/**
 * The single person allowed to write attendance directly (single-day edits,
 * deletes, bulk attendance). Identified by employee ID; their admin login is
 * the `users` row linked via employees.user_id.
 *
 * Approvals are NOT limited to this person: any admin can approve leave and
 * attendance change requests, payroll, expenses, ledger entries, salary
 * structures and career changes — just never their own (see
 * lib/erp/approver.ts).
 */
export const APPROVER_EMPLOYEE_ID = 'XLU001';
