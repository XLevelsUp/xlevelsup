/**
 * The single person allowed to approve anything in the ERP — leave, attendance
 * change / status change / regularisation requests, payroll, career changes,
 * expenses, ledger entries — and to write attendance directly (single-day
 * edits, deletes, bulk attendance). Identified by employee ID; their admin
 * login is the `users` row linked via employees.user_id.
 */
export const APPROVER_EMPLOYEE_ID = 'XLU001';
