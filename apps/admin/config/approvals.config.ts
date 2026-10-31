/**
 * The single person allowed to edit or delete one day's attendance directly.
 * Identified by employee ID; their admin login is the `users` row linked via
 * employees.user_id.
 *
 * Approvals are NOT limited to this person: any admin can approve leave and
 * attendance change requests, payroll, expenses, ledger entries, salary
 * structures and career changes — just never their own (see
 * lib/erp/approver.ts). Any admin can also bulk-update attendance, their own
 * included.
 */
export const APPROVER_EMPLOYEE_ID = 'XLU001';
