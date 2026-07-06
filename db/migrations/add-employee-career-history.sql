-- Migration: Employee Career History Table
-- Tracks all career changes: intern conversion, promotions, salary revisions, etc.
-- Safe to run multiple times (uses IF NOT EXISTS)

CREATE TABLE IF NOT EXISTS employee_career_history (
  id SERIAL PRIMARY KEY,

  -- The employee this change belongs to
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,

  -- What kind of career change this is
  change_type TEXT NOT NULL CHECK (change_type IN (
    'intern_conversion',
    'promotion',
    'designation_change',
    'department_change',
    'salary_revision',
    'employment_type_change'
  )),

  -- Employment type change
  previous_employment_type TEXT,
  new_employment_type       TEXT,

  -- Designation change (maps to employees.role)
  previous_designation      TEXT,
  new_designation           TEXT,

  -- Department change
  previous_department       TEXT,
  new_department            TEXT,

  -- Salary change
  previous_salary_type      TEXT,
  new_salary_type           TEXT,
  previous_salary           NUMERIC(12, 2),
  new_salary                NUMERIC(12, 2),

  -- When this change takes effect
  effective_date DATE NOT NULL,

  -- Reason / context
  reason TEXT,
  notes  TEXT,

  -- Workflow status
  -- 'approved'         → change applied immediately (effective_date is today or past)
  -- 'pending_effective'→ change stored, will be applied on/after effective_date
  -- 'applied'          → was pending_effective, now applied
  -- 'rejected'         → rejected before being applied
  -- 'cancelled'        → cancelled before being applied
  status TEXT DEFAULT 'approved' CHECK (status IN (
    'pending',
    'approved',
    'pending_effective',
    'applied',
    'rejected',
    'cancelled'
  )),

  -- Audit trail (references users table which has INTEGER ids)
  requested_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  approved_by  INTEGER REFERENCES users(id) ON DELETE SET NULL,
  approved_at  TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_career_history_employee
  ON employee_career_history(employee_id);

CREATE INDEX IF NOT EXISTS idx_career_history_status
  ON employee_career_history(status);

CREATE INDEX IF NOT EXISTS idx_career_history_effective_date
  ON employee_career_history(effective_date);

CREATE INDEX IF NOT EXISTS idx_career_history_change_type
  ON employee_career_history(change_type);

-- Enable Row Level Security (consistent with other tables)
ALTER TABLE employee_career_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all operations for authenticated users"
  ON employee_career_history FOR ALL USING (true);

-- Comments
COMMENT ON TABLE employee_career_history IS
  'Tracks employee career changes: conversions, promotions, salary revisions, dept/designation changes';

COMMENT ON COLUMN employee_career_history.change_type IS
  'intern_conversion | promotion | designation_change | department_change | salary_revision | employment_type_change';

COMMENT ON COLUMN employee_career_history.status IS
  'approved = applied immediately; pending_effective = future date, not yet applied; applied = was pending, now done';

COMMENT ON COLUMN employee_career_history.previous_designation IS
  'Snapshot of employees.role before the change';

COMMENT ON COLUMN employee_career_history.new_designation IS
  'Target value for employees.role after the change is applied';
