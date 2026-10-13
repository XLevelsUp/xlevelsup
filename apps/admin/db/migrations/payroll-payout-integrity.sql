-- Migration: Payroll payout integrity
-- 1. At most one salary payout ledger entry per payroll row, so a payroll
--    month can never be recorded as paid twice (double submit, two tabs, or
--    a retry after a half-finished attempt). Backs up the claim-first flow in
--    markPayrollPaid (lib/erp/payroll.ts).
-- 2. Net salary can never be negative on any new or edited payroll row.
-- Safe to run multiple times.

-- Refuse to build the index over existing duplicates — they need a person to
-- decide which entry is the real payment. To list them:
--   SELECT payroll_id, array_agg(id ORDER BY id) AS ledger_ids, array_agg(reference_number ORDER BY id) AS references
--   FROM financial_ledger
--   WHERE transaction_type = 'payroll' AND payroll_id IS NOT NULL
--   GROUP BY payroll_id HAVING count(*) > 1;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM financial_ledger
    WHERE transaction_type = 'payroll' AND payroll_id IS NOT NULL
    GROUP BY payroll_id HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'financial_ledger already has more than one payroll payout for some payroll rows. Resolve them first (see the query at the top of this migration), then re-run.';
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_financial_ledger_payroll_payout
  ON financial_ledger (payroll_id)
  WHERE transaction_type = 'payroll' AND payroll_id IS NOT NULL;

-- NOT VALID: enforced for every insert/update from now on without failing on
-- historical rows. Run `ALTER TABLE payroll VALIDATE CONSTRAINT
-- payroll_net_salary_non_negative;` afterwards to check those too.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'payroll_net_salary_non_negative'
  ) THEN
    ALTER TABLE payroll
      ADD CONSTRAINT payroll_net_salary_non_negative CHECK (net_salary >= 0) NOT VALID;
  END IF;
END $$;
