-- ============================================================================
-- Initialize Leave Balances for All Active Employees
-- ============================================================================
-- This script initializes leave balances based on the new leave policy:
-- - Casual Leave: 18 days/year (1.5 days per month)
-- - Floater Leave: 2 days/year
-- - Sick Leave: 10 days/year
-- - Earned Leave: 0 days initially (earned based on overtime hours)
--
-- Can be run multiple times safely - will skip existing records
-- ============================================================================

DO $$
DECLARE
    current_year INTEGER := EXTRACT(YEAR FROM CURRENT_DATE);
    employee_record RECORD;
    inserted_count INTEGER := 0;
    skipped_count INTEGER := 0;
    total_employees INTEGER := 0;
BEGIN
    -- Get count of active employees
    SELECT COUNT(*) INTO total_employees 
    FROM employees 
    WHERE status = 'active';
    
    RAISE NOTICE '============================================';
    RAISE NOTICE 'LEAVE BALANCE INITIALIZATION';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Current Year: %', current_year;
    RAISE NOTICE 'Active Employees: %', total_employees;
    RAISE NOTICE '============================================';
    RAISE NOTICE '';
    
    -- Loop through all active employees
    FOR employee_record IN 
        SELECT id, employee_id, name, employment_type 
        FROM employees 
        WHERE status = 'active'
        ORDER BY employee_id
    LOOP
        RAISE NOTICE 'Processing: % (%) - %', 
            employee_record.name, 
            employee_record.employee_id, 
            employee_record.employment_type;
        
        -- Casual Leave: 18 days
        INSERT INTO leave_balances (employee_id, year, leave_type, total_allocated, used_days)
        VALUES (employee_record.id, current_year, 'casual', 18, 0)
        ON CONFLICT (employee_id, year, leave_type) DO NOTHING;
        
        IF FOUND THEN
            RAISE NOTICE '  ✓ Casual Leave: 18 days';
            inserted_count := inserted_count + 1;
        ELSE
            RAISE NOTICE '  ⏭ Casual Leave: Already exists';
            skipped_count := skipped_count + 1;
        END IF;
        
        -- Floater Leave: 2 days
        INSERT INTO leave_balances (employee_id, year, leave_type, total_allocated, used_days)
        VALUES (employee_record.id, current_year, 'floater', 2, 0)
        ON CONFLICT (employee_id, year, leave_type) DO NOTHING;
        
        IF FOUND THEN
            RAISE NOTICE '  ✓ Floater Leave: 2 days';
            inserted_count := inserted_count + 1;
        ELSE
            RAISE NOTICE '  ⏭ Floater Leave: Already exists';
            skipped_count := skipped_count + 1;
        END IF;
        
        -- Sick Leave: 10 days
        INSERT INTO leave_balances (employee_id, year, leave_type, total_allocated, used_days)
        VALUES (employee_record.id, current_year, 'sick', 10, 0)
        ON CONFLICT (employee_id, year, leave_type) DO NOTHING;
        
        IF FOUND THEN
            RAISE NOTICE '  ✓ Sick Leave: 10 days';
            inserted_count := inserted_count + 1;
        ELSE
            RAISE NOTICE '  ⏭ Sick Leave: Already exists';
            skipped_count := skipped_count + 1;
        END IF;
        
        -- Earned Leave: 0 days (earned from OT)
        INSERT INTO leave_balances (employee_id, year, leave_type, total_allocated, used_days)
        VALUES (employee_record.id, current_year, 'earned', 0, 0)
        ON CONFLICT (employee_id, year, leave_type) DO NOTHING;
        
        IF FOUND THEN
            RAISE NOTICE '  ✓ Earned Leave: 0 days (OT-based)';
            inserted_count := inserted_count + 1;
        ELSE
            RAISE NOTICE '  ⏭ Earned Leave: Already exists';
            skipped_count := skipped_count + 1;
        END IF;
        
        RAISE NOTICE '';
    END LOOP;
    
    -- Summary
    RAISE NOTICE '============================================';
    RAISE NOTICE 'SUMMARY';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Employees Processed: %', total_employees;
    RAISE NOTICE 'Records Created: %', inserted_count;
    RAISE NOTICE 'Records Skipped: % (already existed)', skipped_count;
    RAISE NOTICE '============================================';
    
END $$;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check leave balance distribution
SELECT 
    leave_type,
    COUNT(DISTINCT employee_id) as employee_count,
    ROUND(AVG(total_allocated), 1) as avg_allocated,
    ROUND(AVG(used_days), 1) as avg_used,
    ROUND(AVG(remaining_days), 1) as avg_remaining
FROM leave_balances 
WHERE year = EXTRACT(YEAR FROM CURRENT_DATE)
GROUP BY leave_type
ORDER BY leave_type;

-- Check employees without leave balances
SELECT 
    e.id,
    e.employee_id,
    e.name,
    e.employment_type,
    COUNT(lb.id) as leave_balance_count
FROM employees e
LEFT JOIN leave_balances lb ON e.id = lb.employee_id 
    AND lb.year = EXTRACT(YEAR FROM CURRENT_DATE)
WHERE e.status = 'active'
GROUP BY e.id, e.employee_id, e.name, e.employment_type
HAVING COUNT(lb.id) < 4
ORDER BY e.employee_id;

-- Sample: Show leave balances for first 5 employees
SELECT 
    e.employee_id,
    e.name,
    lb.leave_type,
    lb.total_allocated,
    lb.used_days,
    lb.remaining_days
FROM employees e
JOIN leave_balances lb ON e.id = lb.employee_id
WHERE lb.year = EXTRACT(YEAR FROM CURRENT_DATE)
    AND e.status = 'active'
ORDER BY e.employee_id, 
    CASE lb.leave_type 
        WHEN 'casual' THEN 1
        WHEN 'floater' THEN 2
        WHEN 'sick' THEN 3
        WHEN 'earned' THEN 4
        ELSE 5
    END
LIMIT 20;
