-- Migration: Add 'emergency' as a valid leave_requests.leave_type value
-- Run this in your Supabase SQL Editor.
-- Alongside 'sick', this is one of the two leave types employees are
-- allowed to request for the current day (see actions/erp/leave-requests.ts)
-- — unplanned same-day absences that aren't illness-related.

ALTER TABLE leave_requests DROP CONSTRAINT IF EXISTS leave_requests_leave_type_check;

ALTER TABLE leave_requests
    ADD CONSTRAINT leave_requests_leave_type_check
        CHECK (leave_type IN ('sick', 'casual', 'floater', 'earned', 'unpaid', 'maternity', 'paternity', 'other', 'wfh', 'emergency'));
