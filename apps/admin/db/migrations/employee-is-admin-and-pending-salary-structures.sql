-- Migration: employees.is_admin + pending salary structures
-- Safe to run multiple times.

-- 1. is_admin on every employee. The approval flow will be built on it next;
--    nothing reads it yet. Seeded true for XLU001, today's sole approver
--    (config/approvals.config.ts), so it starts out matching current rules.
ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

UPDATE employees SET is_admin = true WHERE employee_id = 'XLU001' AND is_admin = false;

COMMENT ON COLUMN employees.is_admin IS
  'Employees treated as admins by the approval flow. Defaults to false.';

-- 2. Salary structures raised by a career change that the approver hasn't
--    applied yet are stored as 'pending' — payroll only reads 'active' — and
--    become 'active' when the approver applies the change.
ALTER TABLE employee_salary_structure
  DROP CONSTRAINT IF EXISTS employee_salary_structure_status_check;
ALTER TABLE employee_salary_structure
  ADD CONSTRAINT employee_salary_structure_status_check
  CHECK (status IN ('active', 'pending', 'cancelled'));
