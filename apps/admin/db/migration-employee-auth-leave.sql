-- Migration: Add employee authentication and leave request system
-- Run this in Supabase SQL Editor after migration-employment-types.sql

-- IMPORTANT: After running this migration, if you have existing employees,
-- run the following command to generate their login credentials:
-- npm run create-employee-logins

-- Step 1: Add authentication fields to employees table
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255),
ADD COLUMN IF NOT EXISTS require_password_change BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP,
ADD COLUMN IF NOT EXISTS account_status VARCHAR(20) DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'locked'));

-- Step 2: Create leave_requests table
CREATE TABLE IF NOT EXISTS leave_requests (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  leave_type VARCHAR(50) NOT NULL CHECK (leave_type IN ('sick', 'casual', 'annual', 'unpaid', 'maternity', 'paternity', 'other')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days NUMERIC(4,1) NOT NULL, -- Supports half-days (e.g., 2.5 days)
  reason TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  reviewed_by INTEGER REFERENCES employees(id),
  reviewed_at TIMESTAMP,
  review_comments TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_date_range CHECK (end_date >= start_date),
  CONSTRAINT positive_days CHECK (total_days > 0)
);

-- Step 3: Create leave_balances table for tracking annual leave
CREATE TABLE IF NOT EXISTS leave_balances (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  leave_type VARCHAR(50) NOT NULL,
  total_allocated NUMERIC(4,1) DEFAULT 0,
  used_days NUMERIC(4,1) DEFAULT 0,
  remaining_days NUMERIC(4,1) GENERATED ALWAYS AS (total_allocated - used_days) STORED,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(employee_id, year, leave_type)
);

-- Step 4: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_leave_requests_employee ON leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_dates ON leave_requests(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_leave_balances_employee_year ON leave_balances(employee_id, year);
CREATE INDEX IF NOT EXISTS idx_employees_account_status ON employees(account_status);

-- Step 5: Create function to update leave balance when request is approved
CREATE OR REPLACE FUNCTION update_leave_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if status changed to 'approved'
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    INSERT INTO leave_balances (employee_id, year, leave_type, used_days)
    VALUES (NEW.employee_id, EXTRACT(YEAR FROM NEW.start_date), NEW.leave_type, NEW.total_days)
    ON CONFLICT (employee_id, year, leave_type)
    DO UPDATE SET 
      used_days = leave_balances.used_days + NEW.total_days,
      updated_at = CURRENT_TIMESTAMP;
  END IF;
  
  -- If status changed from 'approved' to something else, reduce used_days
  IF OLD.status = 'approved' AND NEW.status != 'approved' THEN
    UPDATE leave_balances
    SET 
      used_days = GREATEST(0, used_days - NEW.total_days),
      updated_at = CURRENT_TIMESTAMP
    WHERE employee_id = NEW.employee_id 
      AND year = EXTRACT(YEAR FROM NEW.start_date)
      AND leave_type = NEW.leave_type;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create trigger for leave balance updates
DROP TRIGGER IF EXISTS trigger_update_leave_balance ON leave_requests;
CREATE TRIGGER trigger_update_leave_balance
AFTER INSERT OR UPDATE OF status ON leave_requests
FOR EACH ROW
EXECUTE FUNCTION update_leave_balance();

-- Step 7: Add comments for documentation
COMMENT ON COLUMN employees.password_hash IS 'Bcrypt hashed password for employee login';
COMMENT ON COLUMN employees.require_password_change IS 'Force password change on next login (true after account creation)';
COMMENT ON COLUMN employees.last_login IS 'Timestamp of last successful login';
COMMENT ON COLUMN employees.account_status IS 'Account status: active (can login), suspended (temporarily blocked), locked (security)';

COMMENT ON TABLE leave_requests IS 'Employee leave/absence requests with approval workflow';
COMMENT ON COLUMN leave_requests.total_days IS 'Total days of leave (supports half-days: 0.5, 1.5, 2.5, etc.)';
COMMENT ON COLUMN leave_requests.status IS 'pending: awaiting approval, approved: granted, rejected: denied, cancelled: withdrawn by employee';

COMMENT ON TABLE leave_balances IS 'Annual leave balance tracking per employee per year';
COMMENT ON COLUMN leave_balances.remaining_days IS 'Auto-calculated: total_allocated - used_days';

-- Step 8: Enable RLS (Row Level Security) for employee portal
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_balances ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Employees can only see their own leave data
-- Note: These policies assume you'll use Supabase Auth or JWT with employee_id claim
-- You may need to adjust based on your auth implementation

-- For now, we'll keep it simple and handle access control in application code
-- The admin panel will have full access, employees will only see their own data

-- Step 9: Initialize leave balances for existing employees (20 days annual leave)
INSERT INTO leave_balances (employee_id, year, leave_type, total_allocated)
SELECT 
  id,
  EXTRACT(YEAR FROM CURRENT_DATE) as year,
  'annual' as leave_type,
  20 as total_allocated
FROM employees
WHERE employment_type IN ('full-time', 'part-time', 'contract')
ON CONFLICT (employee_id, year, leave_type) DO NOTHING;

-- Complete!
SELECT 'Migration completed successfully! Employee authentication and leave request system ready.' as status;
