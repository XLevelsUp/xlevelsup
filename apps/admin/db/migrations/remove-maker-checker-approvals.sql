-- Migration: Remove the maker-checker approval layer
--
-- Approvals now have a single approver (employee XLU001 — see
-- config/approvals.config.ts and lib/erp/approver.ts), who may approve
-- anything, including items they raised themselves. The database-level
-- leftovers of the old two-person rule are removed here.
--
-- Run manually in the Supabase SQL Editor. Safe to run more than once.

-- 1. The dual-control queue (attendance edits, bulk attendance, leave and
--    attendance-change reviews had to be approved by a second admin). No code
--    has read or written it since the 1 Sep 2026 payroll changes; it only
--    holds history of those old proposals. This permanently deletes that
--    history — export it first if you want to keep it:
--      SELECT * FROM admin_action_approvals ORDER BY id;
DROP TABLE IF EXISTS admin_action_approvals;

-- 2. Leave-balance trigger from migration-employee-auth-leave.sql. If it was
--    ever installed it adds leave_requests.total_days to used_days on every
--    approval — on top of reviewLeaveRequest (lib/erp/leave-requests.ts),
--    which already does that itself — so each approved leave would be counted
--    twice. The application is the single place balances change.
DROP TRIGGER IF EXISTS trigger_update_leave_balance ON leave_requests;
DROP FUNCTION IF EXISTS update_leave_balance();
