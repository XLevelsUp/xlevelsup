-- Migration: Add gst_applicable to financial_ledger
--
-- Whether GST applies to an expense at all (the vendor charged GST on it) —
-- answered with the "Is GST applicable for this expense?" checkbox in the
-- Add Expense form. Distinct from gst_claim (add-gst-claim.sql), which tracks
-- whether that GST has since been claimed as input tax credit.
--
-- Defaults to false, like gst_claim. Rows already marked as claimed must
-- have carried GST, so they're backfilled as applicable.
-- Run this in your Supabase SQL Editor. Safe to run more than once.

ALTER TABLE financial_ledger
    ADD COLUMN IF NOT EXISTS gst_applicable BOOLEAN NOT NULL DEFAULT false;

UPDATE financial_ledger SET gst_applicable = true WHERE gst_claim = true AND gst_applicable = false;
