-- Migration Script: Create financial_ledger table and migrate existing data

CREATE TABLE IF NOT EXISTS financial_ledger (
    id SERIAL PRIMARY KEY,
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('income', 'expense', 'investment', 'payroll', 'reimbursement', 'adjustment', 'refund', 'transfer')),
    direction VARCHAR(10) NOT NULL CHECK (direction IN ('inflow', 'outflow')),
    category VARCHAR(100) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
    transaction_date DATE NOT NULL,
    payment_mode VARCHAR(50),
    payment_status VARCHAR(20) DEFAULT 'completed' CHECK (payment_status IN ('pending', 'completed', 'failed', 'cancelled', 'refunded')),
    
    client_name VARCHAR(255),
    project_name VARCHAR(255),
    employee_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
    payroll_id INTEGER REFERENCES payroll(id) ON DELETE SET NULL,
    expense_id INTEGER REFERENCES expenses(id) ON DELETE SET NULL,
    
    payer_name VARCHAR(255),
    payee_name VARCHAR(255),
    vendor_name VARCHAR(255),
    
    invoice_number VARCHAR(100),
    reference_number VARCHAR(100),
    
    description TEXT,
    notes TEXT,
    
    approval_status VARCHAR(20) DEFAULT 'approved' CHECK (approval_status IN ('pending', 'approved', 'rejected', 'paid')),
    approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP,
    
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_financial_ledger_date ON financial_ledger(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_financial_ledger_type ON financial_ledger(transaction_type);
CREATE INDEX IF NOT EXISTS idx_financial_ledger_direction ON financial_ledger(direction);
CREATE INDEX IF NOT EXISTS idx_financial_ledger_category ON financial_ledger(category);
CREATE INDEX IF NOT EXISTS idx_financial_ledger_status ON financial_ledger(payment_status);

-- Data Ingestion: Migrate Client Transactions to Financial Ledger
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'client_transactions') THEN
        INSERT INTO financial_ledger (
            transaction_type, direction, category, amount, transaction_date, 
            payment_mode, payment_status, client_name, project_name, 
            invoice_number, reference_number, description, notes, 
            created_by, created_at, updated_at, approval_status
        )
        SELECT 
            type::varchar(50) as transaction_type,
            CASE WHEN type = 'income' THEN 'inflow'::varchar(10) ELSE 'outflow'::varchar(10) END as direction,
            category, amount, transaction_date, 
            payment_mode, 
            CASE WHEN payment_status = 'advance' THEN 'completed'::varchar(20) ELSE payment_status::varchar(20) END as payment_status,
            client_name, project_name, 
            invoice_number, reference_number, description, notes, 
            created_by, created_at, updated_at,
            'approved'::varchar(20) as approval_status
        FROM client_transactions
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- Data Ingestion: Migrate General/Employee Expenses to Financial Ledger
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'expenses') THEN
        INSERT INTO financial_ledger (
            transaction_type, direction, category, amount, transaction_date, 
            payment_mode, payment_status, payee_name, description, 
            expense_id, created_by, approved_by, approved_at, 
            approval_status, created_at, updated_at
        )
        SELECT 
            CASE WHEN reimbursed = true OR paid_by <> 'Company' THEN 'reimbursement'::varchar(50) ELSE 'expense'::varchar(50) END as transaction_type,
            'outflow'::varchar(10) as direction,
            category, amount, date as transaction_date, 
            payment_mode, 
            CASE WHEN status = 'paid' THEN 'completed'::varchar(20) ELSE 'pending'::varchar(20) END as payment_status,
            paid_by as payee_name, description, 
            id as expense_id, submitted_by as created_by, approved_by, approved_at, 
            status as approval_status, created_at, updated_at
        FROM expenses
        ON CONFLICT DO NOTHING;
    END IF;
END $$;
