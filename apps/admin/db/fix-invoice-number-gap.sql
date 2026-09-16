-- One-time fix: close a gap in invoice numbering.
--
-- Cause: while building/testing the "Generate Invoice from Client Income"
-- feature, one or more orders were created and later deleted, which
-- permanently consumed invoice number XLU-2026-0003 from the sequence
-- (Postgres sequences never roll back on delete) — leaving a real invoice
-- for OHM MURUGHA ELECTRICAL stuck at XLU-2026-0004 instead of 0003.
--
-- This script:
--   1. Renumbers that invoice down to XLU-2026-0003.
--   2. Keeps its linked financial_ledger.reference_number in sync (it was
--      copied from invoice_number at creation time, so it would otherwise
--      go stale and show the old number in Finance).
--   3. Resets the sequence so the NEXT invoice generated continues
--      correctly from XLU-2026-0004 — no further gaps going forward.
--
-- Run this once in the Supabase SQL Editor.

BEGIN;

UPDATE orders
SET invoice_number = 'XLU-2026-0003'
WHERE invoice_number = 'XLU-2026-0004';

UPDATE financial_ledger
SET reference_number = 'XLU-2026-0003'
WHERE reference_number = 'XLU-2026-0004';

-- Next nextval() call will return 4.
SELECT setval('orders_invoice_number_seq', 3, true);

COMMIT;

-- Verify afterward:
-- SELECT id, invoice_number, client_name FROM orders ORDER BY id;
