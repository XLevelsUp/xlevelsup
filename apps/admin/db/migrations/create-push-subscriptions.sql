-- Migration: Devices that turned on push notifications
--
-- One row per browser/device. A subscription belongs to an employee record, so
-- an admin's devices are reached through the employee record linked to their
-- login. See lib/erp/push.ts.
--
-- Run manually in the Supabase SQL Editor. Safe to run more than once.

CREATE TABLE IF NOT EXISTS push_subscriptions (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_employee
    ON push_subscriptions(employee_id);

-- Only the server touches this table, through the service role, which bypasses
-- RLS. With RLS on and no policies, the public anon key can't read it.
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
