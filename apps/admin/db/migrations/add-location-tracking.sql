-- Migration: Add location tracking for clock in/out and login
-- Date: 2026-06-15

-- Add location columns to time_logs table
ALTER TABLE time_logs 
ADD COLUMN IF NOT EXISTS clock_in_latitude NUMERIC(10, 8),
ADD COLUMN IF NOT EXISTS clock_in_longitude NUMERIC(11, 8),
ADD COLUMN IF NOT EXISTS clock_in_location_accuracy NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS clock_out_latitude NUMERIC(10, 8),
ADD COLUMN IF NOT EXISTS clock_out_longitude NUMERIC(11, 8),
ADD COLUMN IF NOT EXISTS clock_out_location_accuracy NUMERIC(10, 2);

-- Create login_logs table to track all login attempts with location
CREATE TABLE IF NOT EXISTS login_logs (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    login_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    latitude NUMERIC(10, 8),
    longitude NUMERIC(11, 8),
    location_accuracy NUMERIC(10, 2),
    ip_address VARCHAR(50),
    user_agent TEXT,
    status VARCHAR(20) DEFAULT 'success' CHECK(status IN ('success', 'failed')),
    failure_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for login_logs
CREATE INDEX IF NOT EXISTS idx_login_logs_employee ON login_logs(employee_id);
CREATE INDEX IF NOT EXISTS idx_login_logs_login_time ON login_logs(login_time);
CREATE INDEX IF NOT EXISTS idx_login_logs_status ON login_logs(status);

-- Enable RLS on login_logs
ALTER TABLE login_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for login_logs
CREATE POLICY "Enable all operations for authenticated users" ON login_logs FOR ALL USING (true);

-- Add comments
COMMENT ON TABLE login_logs IS 'Tracks all employee login attempts with location and device information';
COMMENT ON COLUMN time_logs.clock_in_latitude IS 'Latitude coordinate where employee clocked in';
COMMENT ON COLUMN time_logs.clock_in_longitude IS 'Longitude coordinate where employee clocked in';
COMMENT ON COLUMN time_logs.clock_in_location_accuracy IS 'GPS accuracy in meters for clock in location';
COMMENT ON COLUMN time_logs.clock_out_latitude IS 'Latitude coordinate where employee clocked out';
COMMENT ON COLUMN time_logs.clock_out_longitude IS 'Longitude coordinate where employee clocked out';
COMMENT ON COLUMN time_logs.clock_out_location_accuracy IS 'GPS accuracy in meters for clock out location';
