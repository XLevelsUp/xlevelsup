-- One-time fix for a duplicate invoice created from Client Income.
--
-- What happened: the Pratyagra Silks income entry (financial_ledger id 50,
-- 10 Aug 2026) already had a real invoice (orders id 14, XLU-2026-0001)
-- created directly through the Billing Terminal, before the "Generate
-- Invoice" button existed on the Client Income tab. That old invoice was
-- never linked back to the ledger row (linked_transaction_id was null), so
-- clicking "Generate Invoice" on it today didn't recognize an invoice
-- already existed and created a second one (orders id 20, XLU-2026-0004).
--
-- The duplicate order (id 20) and its order_items row, plus the correct
-- link from order 14 -> transaction 50, have already been fixed directly
-- in the database. This script only does the part that needs the SQL
-- Editor: adding a safety constraint so this specific failure mode — two
-- invoices ending up linked to the same Client Income transaction — can
-- never happen again, even from a race between two concurrent clicks.
--
-- (Resetting the invoice-number sequence is no longer needed here — it's
-- superseded by change-invoice-number-format.sql, which renumbers every
-- invoice and replaces orders_invoice_number_seq entirely. Run that
-- script too — order between the two doesn't matter.)
--
-- Run this once in the Supabase SQL Editor.

BEGIN;

-- Guarantees at most one order can ever be linked to a given Client Income
-- transaction — a database-level backstop behind the application-level
-- idempotency check in getOrCreateInvoiceForTransactionAction, which is
-- now also updated to catch this constraint and return the existing
-- invoice instead of erroring if it's ever hit concurrently.
CREATE UNIQUE INDEX IF NOT EXISTS orders_linked_transaction_id_unique
  ON orders (linked_transaction_id)
  WHERE linked_transaction_id IS NOT NULL;

COMMIT;

-- Verify afterward:
-- SELECT id, invoice_number, client_name, linked_transaction_id FROM orders ORDER BY id;
