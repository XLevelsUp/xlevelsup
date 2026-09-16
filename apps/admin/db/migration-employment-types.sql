-- Migration: Add employment_type and end_date to employees table
-- Run this in Supabase SQL Editor

-- Add employment_type column
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS employment_type VARCHAR(50) 
CHECK(employment_type IN ('full-time', 'part-time', 'contract', 'temporary', 'freelancer', 'intern', 'consultant'));

-- Add end_date column (optional for any employment type)
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS end_date DATE;

-- Add hourly_rate column for freelancers/hourly workers
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC(10, 2);

-- Set default employment_type for existing employees
UPDATE employees 
SET employment_type = 'full-time' 
WHERE employment_type IS NULL;

-- Make employment_type NOT NULL after setting defaults
ALTER TABLE employees 
ALTER COLUMN employment_type SET NOT NULL;

-- Make monthly_salary nullable for unpaid employees
ALTER TABLE employees 
ALTER COLUMN monthly_salary DROP NOT NULL;

-- Add index for employment_type
CREATE INDEX IF NOT EXISTS idx_employees_employment_type ON employees(employment_type);

-- Add comments for clarity
COMMENT ON COLUMN employees.employee_id IS 'Employee ID: XLU001, XLU002 for regular employees; TEMP-XLU-001, TEMP-XLU-002 for temporary employees';
COMMENT ON COLUMN employees.employment_type IS 'Type of employment: full-time, part-time, contract, temporary, freelancer, intern, consultant';
COMMENT ON COLUMN employees.end_date IS 'Optional end date for employment (for any employment type)';
COMMENT ON COLUMN employees.hourly_rate IS 'Hourly rate for freelancers and hourly workers (alternative to monthly_salary)';
COMMENT ON COLUMN employees.monthly_salary IS 'Monthly salary amount (optional for unpaid employees)';

-- First, run the employment types migration
-- Copy/paste from: db/migration-employment-types.sql

-- Then, run the employee auth & leave migration
-- Copy/paste from: db/migration-employee-auth-leave.sql
