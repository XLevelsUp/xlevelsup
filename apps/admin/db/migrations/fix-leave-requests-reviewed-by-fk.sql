-- Migration: Point leave_requests.reviewed_by at users(id)
--
-- reviewLeaveRequestAction has always stored the reviewing admin's login
-- (users.id, from the verified session) in leave_requests.reviewed_by — the
-- same as attendance_change_requests.reviewed_by, which already references
-- users(id). This column's foreign key was declared against employees(id)
-- instead (migration-employee-auth-leave.sql), so:
--   * the admin screen's "by <name>" showed whichever employee happened to
--     share the admin's user id (fixed in code: lib/erp/leave-requests.ts no
--     longer joins through this key), and
--   * approving leave as an admin whose users.id isn't also some employee's
--     id fails the foreign-key check.
-- Now that any admin can review leave (lib/erp/approver.ts), the second one
-- matters. Existing values are already users ids, so no data changes.
--
-- Run manually in the Supabase SQL Editor. Safe to run more than once.

-- Before running: every stored value must be a real users.id, or step 2
-- fails. This should return no rows:
--   SELECT id, reviewed_by FROM leave_requests
--   WHERE reviewed_by IS NOT NULL AND reviewed_by NOT IN (SELECT id FROM users);

-- 1. Drop whatever foreign key currently sits on reviewed_by — looked up
--    rather than named, since the generated constraint name isn't guaranteed.
DO $$
DECLARE
  fk record;
BEGIN
  FOR fk IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_attribute att
      ON att.attrelid = con.conrelid AND att.attnum = ANY (con.conkey)
    WHERE con.conrelid = 'public.leave_requests'::regclass
      AND con.contype = 'f'
      AND att.attname = 'reviewed_by'
  LOOP
    EXECUTE format('ALTER TABLE public.leave_requests DROP CONSTRAINT %I', fk.conname);
  END LOOP;
END $$;

-- 2. Re-add it against users, matching attendance_change_requests.reviewed_by.
ALTER TABLE public.leave_requests
  ADD CONSTRAINT leave_requests_reviewed_by_fkey
  FOREIGN KEY (reviewed_by) REFERENCES public.users(id) ON DELETE SET NULL;
