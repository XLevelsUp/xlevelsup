-- Migration: add the 'accountant' ERP role
--
-- schema.sql uses CREATE TABLE IF NOT EXISTS, so editing the CHECK constraint
-- there does nothing to an existing database. This migration alters the live
-- constraint. Run it in the Supabase SQL editor.
--
-- 'accountant' is the narrowest ERP role: invoice history (view + download)
-- only. It must never be treated as equivalent to 'hr'. See types/erp.ts.

BEGIN;

-- Postgres has no ALTER CHECK; the old constraint must be dropped first.
-- The name is Postgres's default for an inline column CHECK on `users.role`.
-- If your database was created by hand under a different name, look it up with:
--   SELECT conname FROM pg_constraint
--   WHERE conrelid = 'users'::regclass AND contype = 'c';
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users
  ADD CONSTRAINT users_role_check
  CHECK (role IN ('admin', 'hr', 'employee', 'accountant'));

COMMIT;

-- Verify the constraint accepts the new value:
--   SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint
--   WHERE conrelid = 'users'::regclass AND contype = 'c';
