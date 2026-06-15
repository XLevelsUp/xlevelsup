-- Client Finance Tracking for XLU
-- Track income from clients and expenses related to clients

CREATE TABLE IF NOT EXISTS client_transactions (
  id SERIAL PRIMARY KEY,
  
  -- Transaction basics
  transaction_date DATE NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  
  -- Client information
  client_name VARCHAR(255) NOT NULL,
  project_name VARCHAR(255),
  
  -- Categorization
  category VARCHAR(100) NOT NULL,
  subcategory VARCHAR(100),
  
  -- Payment details
  payment_mode VARCHAR(50),
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'cancelled')),
  
  -- Invoice/Receipt tracking
  invoice_number VARCHAR(100),
  receipt_url TEXT,
  
  -- Details
  description TEXT NOT NULL,
  notes TEXT,
  
  -- Metadata
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_client_transactions_date ON client_transactions(transaction_date DESC);
CREATE INDEX idx_client_transactions_type ON client_transactions(type);
CREATE INDEX idx_client_transactions_client ON client_transactions(client_name);
CREATE INDEX idx_client_transactions_category ON client_transactions(category);
CREATE INDEX idx_client_transactions_status ON client_transactions(payment_status);

-- Comments
COMMENT ON TABLE client_transactions IS 'Track client-related income and expenses for XLU';
COMMENT ON COLUMN client_transactions.type IS 'Transaction type: income (revenue) or expense (cost)';
COMMENT ON COLUMN client_transactions.client_name IS 'Name of the client';
COMMENT ON COLUMN client_transactions.project_name IS 'Associated project name if applicable';
COMMENT ON COLUMN client_transactions.category IS 'Main category (e.g., Service Fee, Marketing, Development)';
COMMENT ON COLUMN client_transactions.payment_status IS 'Status of the payment';
