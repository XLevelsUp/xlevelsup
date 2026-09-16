-- Migration: Add half-day leave support to leave_requests
-- Run this in your Supabase SQL Editor
-- Safe to run multiple times (IF NOT EXISTS everywhere)

ALTER TABLE leave_requests
    ADD COLUMN IF NOT EXISTS is_half_day BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS half_day_period VARCHAR(12)
        CHECK (half_day_period IN ('first_half', 'second_half'));

-- A half-day request must fall on a single day
ALTER TABLE leave_requests
    DROP CONSTRAINT IF EXISTS half_day_single_date;

ALTER TABLE leave_requests
    ADD CONSTRAINT half_day_single_date
        CHECK (NOT is_half_day OR start_date = end_date);

COMMENT ON COLUMN leave_requests.is_half_day IS
    'True when this request is for half a working day (total_days will be 0.5)';

COMMENT ON COLUMN leave_requests.half_day_period IS
    'Which half of the day is being taken: first_half (morning) or second_half (afternoon); null for full-day requests';
