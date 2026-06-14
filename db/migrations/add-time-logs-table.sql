-- Migration: Add time_logs table for Clock In/Out feature
-- Date: 2024

-- Create time_logs table
CREATE TABLE IF NOT EXISTS time_logs (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    clock_in_time TIMESTAMPTZ NOT NULL,
    clock_out_time TIMESTAMPTZ,
    total_hours NUMERIC(5, 2),
    status VARCHAR(20) DEFAULT 'active' CHECK(status IN ('active', 'completed')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_time_logs_employee_date ON time_logs(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_time_logs_status ON time_logs(status);
CREATE INDEX IF NOT EXISTS idx_time_logs_date ON time_logs(date);

-- Enable RLS
ALTER TABLE time_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Enable all operations for authenticated users" ON time_logs FOR ALL USING (true);

-- Add comment
COMMENT ON TABLE time_logs IS 'Tracks employee clock in/out times for daily attendance tracking';
