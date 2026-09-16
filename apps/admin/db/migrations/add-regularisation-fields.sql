-- Migration: Add Regularisation Fields to attendance_change_requests
-- Extends the table to support clock-in time regularisation
-- All columns use IF NOT EXISTS so this is safe to run multiple times

-- Add request_type to categorise the regularisation request
ALTER TABLE attendance_change_requests
  ADD COLUMN IF NOT EXISTS request_type TEXT DEFAULT 'status_change'
    CHECK (request_type IN (
      'status_change',
      'missed_clock_in',
      'missed_clock_out',
      'missed_both',
      'clock_in_correction',
      'clock_out_correction'
    ));

-- Add TIMESTAMPTZ columns for full clock-in/clock-out datetime storage
-- These replace the old HH:MM text clock_out_time column for new requests.
-- The old clock_out_time column is kept for backward compatibility.
ALTER TABLE attendance_change_requests
  ADD COLUMN IF NOT EXISTS current_clock_in_time TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS current_clock_out_time TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS requested_clock_in_time TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS requested_clock_out_time TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS employee_note TEXT;

-- Add leave_type to existing table if missing (already exists per schema, safe)
-- ALTER TABLE attendance_change_requests ADD COLUMN IF NOT EXISTS leave_type TEXT;

-- Index for faster lookups by request_type
CREATE INDEX IF NOT EXISTS idx_attendance_change_requests_type
  ON attendance_change_requests(request_type);

-- Backfill existing rows: set request_type based on presence of clock_out_time
-- Rows with clock_out_time set are clock_out regularisations
UPDATE attendance_change_requests
  SET request_type = 'missed_clock_out'
  WHERE clock_out_time IS NOT NULL
    AND request_type = 'status_change';

-- Rows without clock_out_time but with requested_status = 'present' remain 'status_change'
-- All other rows remain 'status_change' (the default)

COMMENT ON COLUMN attendance_change_requests.request_type IS
  'Type of regularisation: status_change | missed_clock_in | missed_clock_out | missed_both | clock_in_correction | clock_out_correction';

COMMENT ON COLUMN attendance_change_requests.requested_clock_in_time IS
  'Full TIMESTAMPTZ for the requested clock-in time (used in new typed requests)';

COMMENT ON COLUMN attendance_change_requests.requested_clock_out_time IS
  'Full TIMESTAMPTZ for the requested clock-out time (replaces old clock_out_time TEXT for new requests)';

COMMENT ON COLUMN attendance_change_requests.current_clock_in_time IS
  'Snapshot of the existing clock-in time at time of request creation, for audit trail';

COMMENT ON COLUMN attendance_change_requests.current_clock_out_time IS
  'Snapshot of the existing clock-out time at time of request creation, for audit trail';

COMMENT ON COLUMN attendance_change_requests.employee_note IS
  'Optional additional note from the employee explaining the regularisation need';
