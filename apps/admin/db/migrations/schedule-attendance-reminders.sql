-- Migration: Schedule the 10:30 AM and 6 PM attendance reminders
--
-- Supabase calls the app at the exact minute. Vercel Cron isn't used because on
-- the Hobby plan a job can fire up to 59 minutes late. The endpoint decides who
-- is reminded (see lib/erp/notifications.ts), so these run every day and do
-- nothing on weekends and holidays.
--
-- Run manually in the Supabase SQL Editor, after the app is deployed with
-- CRON_SECRET set. Replace PASTE_CRON_SECRET_HERE with the same value first.
-- Never commit the real value.

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Stored in Vault so the secret isn't visible in the schedule. Running this a
-- second time fails with a duplicate-name error: to change the secret, use
-- vault.update_secret instead.
SELECT vault.create_secret('PASTE_CRON_SECRET_HERE', 'attendance_reminders_cron_secret');

-- pg_cron runs in UTC. 05:00 UTC is 10:30 IST.
SELECT cron.schedule(
    'attendance-reminder-clock-in',
    '0 5 * * *',
    $$
    SELECT net.http_post(
        url := 'https://admin.xlevelsup.com/api/cron/attendance-reminders?type=clock-in',
        headers := jsonb_build_object(
            'Authorization',
            'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'attendance_reminders_cron_secret')
        ),
        timeout_milliseconds := 30000
    );
    $$
);

-- 12:30 UTC is 18:00 IST.
SELECT cron.schedule(
    'attendance-reminder-clock-out',
    '30 12 * * *',
    $$
    SELECT net.http_post(
        url := 'https://admin.xlevelsup.com/api/cron/attendance-reminders?type=clock-out',
        headers := jsonb_build_object(
            'Authorization',
            'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'attendance_reminders_cron_secret')
        ),
        timeout_milliseconds := 30000
    );
    $$
);

-- To check it's working, after a scheduled time has passed:
--   SELECT jobname, status, return_message, start_time
--   FROM cron.job_run_details JOIN cron.job USING (jobid)
--   ORDER BY start_time DESC LIMIT 10;
--   SELECT status_code, content, created FROM net._http_response ORDER BY created DESC LIMIT 10;
