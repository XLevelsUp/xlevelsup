-- ============================================================
-- Company Holidays Table
-- Stores public/company holidays that are excluded from:
--   1. Leave day calculations (so employees don't waste leave on a holiday)
--   2. Payroll working-day counts (holidays are paid days, not absent days)
-- ============================================================

-- Create table
CREATE TABLE IF NOT EXISTS company_holidays (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    holiday_type VARCHAR(50) NOT NULL DEFAULT 'public'
        CHECK (holiday_type IN ('public', 'floater', 'optional', 'company')),
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast date lookups
CREATE INDEX IF NOT EXISTS idx_company_holidays_date ON company_holidays(date);
CREATE INDEX IF NOT EXISTS idx_company_holidays_active ON company_holidays(is_active);

-- Enable RLS (consistent with rest of schema)
ALTER TABLE company_holidays ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all operations for authenticated users"
    ON company_holidays FOR ALL USING (true);

-- ============================================================
-- SEED: 2026 Holidays
-- ============================================================

INSERT INTO company_holidays (date, name, holiday_type, description) VALUES
    -- Public / Government Holidays
    ('2026-08-15', 'Independence Day',      'public',  'National holiday — India Independence Day'),
    ('2026-11-08', 'Diwali (Day 1)',         'public',  'Festival of Lights — Diwali holiday'),
    ('2026-11-09', 'Diwali (Day 2)',         'public',  'Festival of Lights — Diwali holiday'),
    ('2026-12-25', 'Christmas Day',          'public',  'National holiday — Christmas'),
    ('2026-10-20', 'Dasara / Navratri Puja', 'public',  'Regional public holiday — Pooja / Dasara'),

    -- Floater Holidays (employees may opt to use these)
    ('2026-09-15', 'Ganesh Chaturthi',       'floater', 'Floater holiday — Ganesh Chaturthi')

ON CONFLICT (date) DO UPDATE
    SET name         = EXCLUDED.name,
        holiday_type = EXCLUDED.holiday_type,
        description  = EXCLUDED.description,
        updated_at   = CURRENT_TIMESTAMP;
