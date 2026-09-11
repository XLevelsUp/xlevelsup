-- Change invoice numbering from "XLU-YYYY-NNNN" (plain year, never resets)
-- to "XLU-NNN/YY-YY+1" (Indian financial year, 1 Apr - 31 Mar, numbering
-- resets to 001 at the start of each financial year).
--
-- Example: an invoice raised in Aug 2026 (FY 2026-27) becomes XLU-001/26-27,
-- XLU-002/26-27, and so on; the first invoice raised after 1 Apr 2027
-- (FY 2027-28) starts over at XLU-001/27-28.
--
-- Run this once in the Supabase SQL Editor.

BEGIN;

-- 1. Per-financial-year invoice counter. Replaces the old plain
--    orders_invoice_number_seq, which only ever counted up.
CREATE TABLE IF NOT EXISTS invoice_fy_sequences (
    fiscal_year VARCHAR(5) PRIMARY KEY,  -- e.g. '26-27'
    last_number INTEGER NOT NULL DEFAULT 0
);

-- 2. Renumber existing invoices into the new format, oldest first within
--    each financial year, and keep financial_ledger.reference_number (set
--    from the old invoice_number, where present) in sync before it's
--    overwritten.
WITH numbered AS (
    SELECT
        id,
        invoice_number AS old_invoice_number,
        LPAD((fy_start_year % 100)::TEXT, 2, '0') || '-' ||
            LPAD(((fy_start_year + 1) % 100)::TEXT, 2, '0') AS fy,
        ROW_NUMBER() OVER (PARTITION BY fy_start_year ORDER BY id) AS seq_num
    FROM (
        SELECT
            id,
            invoice_number,
            CASE WHEN EXTRACT(MONTH FROM created_at) >= 4
                 THEN EXTRACT(YEAR FROM created_at)::INT
                 ELSE EXTRACT(YEAR FROM created_at)::INT - 1
            END AS fy_start_year
        FROM orders
    ) x
)
UPDATE financial_ledger fl
SET reference_number = 'XLU-' || LPAD(n.seq_num::TEXT, 3, '0') || '/' || n.fy
FROM numbered n
WHERE fl.reference_number = n.old_invoice_number;

WITH numbered AS (
    SELECT
        id,
        LPAD((fy_start_year % 100)::TEXT, 2, '0') || '-' ||
            LPAD(((fy_start_year + 1) % 100)::TEXT, 2, '0') AS fy,
        ROW_NUMBER() OVER (PARTITION BY fy_start_year ORDER BY id) AS seq_num
    FROM (
        SELECT
            id,
            CASE WHEN EXTRACT(MONTH FROM created_at) >= 4
                 THEN EXTRACT(YEAR FROM created_at)::INT
                 ELSE EXTRACT(YEAR FROM created_at)::INT - 1
            END AS fy_start_year
        FROM orders
    ) x
)
UPDATE orders o
SET invoice_number = 'XLU-' || LPAD(n.seq_num::TEXT, 3, '0') || '/' || n.fy
FROM numbered n
WHERE o.id = n.id;

-- 3. Seed the counter table so the next new invoice continues correctly
--    from the last one just renumbered above, instead of restarting at 1.
INSERT INTO invoice_fy_sequences (fiscal_year, last_number)
SELECT
    LPAD((fy_start_year % 100)::TEXT, 2, '0') || '-' ||
        LPAD(((fy_start_year + 1) % 100)::TEXT, 2, '0') AS fiscal_year,
    COUNT(*) AS last_number
FROM (
    SELECT
        CASE WHEN EXTRACT(MONTH FROM created_at) >= 4
             THEN EXTRACT(YEAR FROM created_at)::INT
             ELSE EXTRACT(YEAR FROM created_at)::INT - 1
        END AS fy_start_year
    FROM orders
) x
GROUP BY fy_start_year
ON CONFLICT (fiscal_year) DO UPDATE SET last_number = EXCLUDED.last_number;

-- 4. Replace the invoice-number trigger function itself — same trigger
--    (trg_set_order_invoice_number) already calls this function by name,
--    so no need to touch the trigger.
CREATE OR REPLACE FUNCTION set_order_invoice_number()
RETURNS TRIGGER AS $$
DECLARE
    start_year INT;
    fy TEXT;
    seq_num INT;
BEGIN
    IF NEW.invoice_number IS NULL THEN
        IF EXTRACT(MONTH FROM CURRENT_DATE) >= 4 THEN
            start_year := EXTRACT(YEAR FROM CURRENT_DATE)::INT;
        ELSE
            start_year := EXTRACT(YEAR FROM CURRENT_DATE)::INT - 1;
        END IF;
        fy := LPAD((start_year % 100)::TEXT, 2, '0') || '-' ||
            LPAD(((start_year + 1) % 100)::TEXT, 2, '0');

        INSERT INTO invoice_fy_sequences (fiscal_year, last_number)
        VALUES (fy, 1)
        ON CONFLICT (fiscal_year)
            DO UPDATE SET last_number = invoice_fy_sequences.last_number + 1
        RETURNING last_number INTO seq_num;

        NEW.invoice_number := 'XLU-' || LPAD(seq_num::TEXT, 3, '0') || '/' || fy;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. No longer used now that numbering is per-financial-year instead of a
--    single ever-increasing counter.
DROP SEQUENCE IF EXISTS orders_invoice_number_seq;

COMMIT;

-- Verify afterward:
-- SELECT id, invoice_number, client_name, created_at FROM orders ORDER BY id;
-- SELECT * FROM invoice_fy_sequences;
