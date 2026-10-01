-- Migration: Salary Structure & Structured Payslip Deductions
-- Adds effective-dated Basic/HRA/Special/Other salary structures for
-- full-time employees, reusable salary templates, and a real deductions
-- section (PF/ESI/Professional Tax/TDS/Other) on the existing payroll table.
-- Safe to run multiple times (uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS).

-- Per-employee, effective-dated salary structure. "Current" is always the
-- row with the latest effective_from <= as-of-date (see
-- getEffectiveSalaryStructure in lib/erp/salary-structure.ts) — there is no
-- effective_to/superseded bookkeeping to maintain when a new revision is
-- added; history views derive the display range from ordering instead.
CREATE TABLE IF NOT EXISTS employee_salary_structure (
  id SERIAL PRIMARY KEY,

  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,

  basic_salary      NUMERIC(10, 2) NOT NULL CHECK (basic_salary >= 0),
  hra               NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (hra >= 0),
  special_allowance NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (special_allowance >= 0),
  other_allowance   NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (other_allowance >= 0),
  gross_salary      NUMERIC(10, 2) NOT NULL CHECK (gross_salary >= 0),

  effective_from DATE NOT NULL,

  -- 'cancelled' = voided (e.g. its originating pending career change was
  -- cancelled before its effective date arrived); never edited in place.
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled')),

  -- Set when this row was created as a side effect of a career change
  -- (salary_revision / promotion / intern_conversion to full-time). Lets
  -- cancelCareerChangeById find and cancel the structure it spawned.
  source_career_history_id INTEGER REFERENCES employee_career_history(id) ON DELETE SET NULL,

  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CHECK (gross_salary = basic_salary + hra + special_allowance + other_allowance)
);

CREATE INDEX IF NOT EXISTS idx_salary_structure_employee
  ON employee_salary_structure(employee_id, effective_from DESC);

ALTER TABLE employee_salary_structure ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'employee_salary_structure'
      AND policyname = 'Enable all operations for authenticated users'
  ) THEN
    CREATE POLICY "Enable all operations for authenticated users"
      ON employee_salary_structure FOR ALL USING (true);
  END IF;
END $$;

-- Reusable, admin-configurable salary templates (e.g. "Standard ₹35,000").
-- Pre-fills the New Revision form; never read directly by payroll logic —
-- only the employee_salary_structure row it was used to create is.
CREATE TABLE IF NOT EXISTS salary_templates (
  id SERIAL PRIMARY KEY,

  name VARCHAR(100) NOT NULL UNIQUE,

  basic_salary      NUMERIC(10, 2) NOT NULL CHECK (basic_salary >= 0),
  hra               NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (hra >= 0),
  special_allowance NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (special_allowance >= 0),
  other_allowance   NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (other_allowance >= 0),
  gross_salary      NUMERIC(10, 2) NOT NULL CHECK (gross_salary >= 0),

  is_active BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CHECK (gross_salary = basic_salary + hra + special_allowance + other_allowance)
);

INSERT INTO salary_templates (name, basic_salary, hra, special_allowance, other_allowance, gross_salary)
VALUES ('Standard ₹35,000', 17500, 7000, 10000, 500, 35000)
ON CONFLICT (name) DO NOTHING;

ALTER TABLE salary_templates ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'salary_templates'
      AND policyname = 'Enable all operations for authenticated users'
  ) THEN
    CREATE POLICY "Enable all operations for authenticated users"
      ON salary_templates FOR ALL USING (true);
  END IF;
END $$;

-- Structured breakdown + deductions on the existing payroll table. All
-- nullable/defaulted so existing rows and non-full-time employees are
-- unaffected — a payroll row only gets these populated when it was
-- generated from an effective employee_salary_structure.
ALTER TABLE payroll
  ADD COLUMN IF NOT EXISTS salary_structure_id INTEGER REFERENCES employee_salary_structure(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS basic_salary NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS hra NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS special_allowance NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS other_allowance NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS pf_deduction NUMERIC(10, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS esi_deduction NUMERIC(10, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS professional_tax_deduction NUMERIC(10, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tds_deduction NUMERIC(10, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS other_structured_deduction NUMERIC(10, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS finalized_at TIMESTAMP;

COMMENT ON COLUMN payroll.salary_structure_id IS
  'The employee_salary_structure row this payslip''s breakdown was snapshotted from, if any. NULL for legacy/flat-salary rows.';
COMMENT ON COLUMN payroll.finalized_at IS
  'Set when the payroll row is marked paid — from that point its breakdown/net figures are immutable (see updatePayrollAdjustments/updatePayrollStatus in lib/erp/payroll.ts).';
