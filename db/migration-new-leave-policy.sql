-- Migration: New Leave Policy System
-- Changes:
-- 1. Add overtime_hours to attendance table
-- 2. Update leave_type CHECK constraint to include floater, earned and remove annual
-- 3. Migrate existing annual leave to casual leave
-- 4. Initialize new leave types (casual, floater, sick, earned) for all employees

-- ==========================================
-- Step 1: Add overtime_hours to attendance
-- ==========================================

ALTER TABLE attendance 
ADD COLUMN IF NOT EXISTS overtime_hours NUMERIC(4, 2) DEFAULT 0;

COMMENT ON COLUMN attendance.overtime_hours IS 'Overtime hours for earned leave calculation (8 hours = 1 earned leave day)';

-- ==========================================
-- Step 2: Update leave_requests CHECK constraint
-- ==========================================

-- Drop old constraint
ALTER TABLE leave_requests DROP CONSTRAINT IF EXISTS leave_requests_leave_type_check;

-- Add new constraint with updated leave types
ALTER TABLE leave_requests 
ADD CONSTRAINT leave_requests_leave_type_check 
CHECK (leave_type IN ('sick', 'casual', 'floater', 'earned', 'unpaid', 'maternity', 'paternity', 'other'));

-- ==========================================
-- Step 3: Migrate existing annual leave data
-- ==========================================

-- Update existing annual leave requests to casual
UPDATE leave_requests 
SET leave_type = 'casual' 
WHERE leave_type = 'annual';

-- Update existing annual leave balances to casual
UPDATE leave_balances 
SET leave_type = 'casual' 
WHERE leave_type = 'annual';

-- ==========================================
-- Step 4: Initialize new leave balances
-- ==========================================

-- Get current year
DO $$
DECLARE
    current_year INTEGER := EXTRACT(YEAR FROM CURRENT_DATE);
    employee_record RECORD;
BEGIN
    -- Loop through all active employees
    FOR employee_record IN 
        SELECT id FROM employees WHERE status = 'active'
    LOOP
        -- Insert casual leave (18 days) if not exists
        INSERT INTO leave_balances (employee_id, year, leave_type, total_allocated, used_days)
        VALUES (employee_record.id, current_year, 'casual', 18, 0)
        ON CONFLICT (employee_id, year, leave_type) DO NOTHING;
        
        -- Insert floater leave (2 days) if not exists
        INSERT INTO leave_balances (employee_id, year, leave_type, total_allocated, used_days)
        VALUES (employee_record.id, current_year, 'floater', 2, 0)
        ON CONFLICT (employee_id, year, leave_type) DO NOTHING;
        
        -- Insert sick leave (10 days) if not exists
        INSERT INTO leave_balances (employee_id, year, leave_type, total_allocated, used_days)
        VALUES (employee_record.id, current_year, 'sick', 10, 0)
        ON CONFLICT (employee_id, year, leave_type) DO NOTHING;
        
        -- Insert earned leave (0 days initially) if not exists
        INSERT INTO leave_balances (employee_id, year, leave_type, total_allocated, used_days)
        VALUES (employee_record.id, current_year, 'earned', 0, 0)
        ON CONFLICT (employee_id, year, leave_type) DO NOTHING;
    END LOOP;
    
    RAISE NOTICE 'Leave balances initialized for all active employees';
END $$;

-- ==========================================
-- Step 5: Add comments for documentation
-- ==========================================

COMMENT ON COLUMN leave_balances.leave_type IS 'Leave type: sick (10/year), casual (18/year = 1.5/month), floater (2/year), earned (from OT: 8 hours = 1 day), unpaid, maternity, paternity, other';

-- ==========================================
-- Verification Queries
-- ==========================================

-- Check leave balance distribution
SELECT 
    leave_type, 
    COUNT(DISTINCT employee_id) as employees_count,
    AVG(total_allocated) as avg_allocated,
    AVG(used_days) as avg_used,
    AVG(remaining_days) as avg_remaining
FROM leave_balances 
WHERE year = EXTRACT(YEAR FROM CURRENT_DATE)
GROUP BY leave_type
ORDER BY leave_type;

-- Check for any remaining annual leave references
SELECT COUNT(*) as annual_leave_count 
FROM leave_requests 
WHERE leave_type = 'annual';

SELECT COUNT(*) as annual_balance_count 
FROM leave_balances 
WHERE leave_type = 'annual';
