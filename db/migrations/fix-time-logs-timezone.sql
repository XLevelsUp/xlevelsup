-- Migration: Fix timezone handling in time_logs table
-- Date: 2026-06-14
-- Issue: TIMESTAMP columns don't store timezone info, causing incorrect calculations

-- Convert timestamp columns to timestamptz (timestamp with timezone)
ALTER TABLE time_logs 
  ALTER COLUMN clock_in_time TYPE TIMESTAMPTZ USING clock_in_time AT TIME ZONE 'UTC',
  ALTER COLUMN clock_out_time TYPE TIMESTAMPTZ USING clock_out_time AT TIME ZONE 'UTC',
  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC',
  ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC';

-- Verify the changes
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'time_logs' AND column_name LIKE '%time%';
