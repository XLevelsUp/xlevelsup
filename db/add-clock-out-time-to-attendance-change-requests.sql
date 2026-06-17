-- Add clock_out_time column to attendance_change_requests table
ALTER TABLE attendance_change_requests ADD COLUMN IF NOT EXISTS clock_out_time TIME;

COMMENT ON COLUMN attendance_change_requests.clock_out_time IS 'Requested clock-out time for missed clock-out regularization';
