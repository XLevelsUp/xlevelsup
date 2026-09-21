-- Migration: Add gst_claim to financial_ledger
--
-- Tracks whether a ledger entry (an expense/vendor payment) has been claimed
-- as GST input tax credit. Toggled per-row from the Finance > Expenses
-- listing rather than through the create/edit form — see
-- toggleGstClaimAction in actions/erp/finance.ts.
--
-- Defaults to false so every existing row is treated as "not yet claimed"
-- rather than leaving the column nullable and having three states to handle
-- in the UI (checked / unchecked / unknown).
-- Run this in your Supabase SQL Editor.

ALTER TABLE financial_ledger
    ADD COLUMN IF NOT EXISTS gst_claim BOOLEAN NOT NULL DEFAULT false;
