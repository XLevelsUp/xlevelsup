-- Add reimbursement tracking columns to expenses table

ALTER TABLE expenses
ADD COLUMN IF NOT EXISTS reimbursed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS reimbursed_by INTEGER REFERENCES users(id),
ADD COLUMN IF NOT EXISTS reimbursed_at TIMESTAMP;

-- Create index for reimbursement queries
CREATE INDEX IF NOT EXISTS idx_expenses_reimbursed ON expenses(reimbursed);
CREATE INDEX IF NOT EXISTS idx_expenses_reimbursed_at ON expenses(reimbursed_at);

-- Add comment
COMMENT ON COLUMN expenses.reimbursed IS 'Whether the expense has been reimbursed to the employee';
COMMENT ON COLUMN expenses.reimbursed_by IS 'User ID who marked the expense as reimbursed';
COMMENT ON COLUMN expenses.reimbursed_at IS 'Timestamp when the expense was marked as reimbursed';
