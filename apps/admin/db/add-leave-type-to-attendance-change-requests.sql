-- Add leave_type column to attendance_change_requests table
-- This allows tracking which leave type to deduct when paid-leave is approved

ALTER TABLE attendance_change_requests 
ADD COLUMN IF NOT EXISTS leave_type VARCHAR(50);

-- Add check constraint for valid leave types (only when paid-leave is requested)
ALTER TABLE attendance_change_requests
ADD CONSTRAINT check_leave_type_for_paid_leave 
CHECK (
    (requested_status != 'paid-leave') OR 
    (requested_status = 'paid-leave' AND leave_type IS NOT NULL AND leave_type IN ('sick', 'casual', 'floater', 'earned', 'unpaid', 'maternity', 'paternity', 'other'))
);

-- Add comment for documentation
COMMENT ON COLUMN attendance_change_requests.leave_type IS 'Type of leave to deduct when paid-leave is approved. Required when requested_status is paid-leave.';
