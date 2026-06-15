# Attendance Change Request - Leave Type Implementation

## Overview

When employees request attendance changes to "paid-leave", they must now specify which leave type to deduct from their leave balance. Upon approval, the system automatically deducts from the appropriate leave balance.

## Database Changes

### Migration Required

Run the following SQL in Supabase SQL Editor if the column doesn't exist:

```sql
-- Add leave_type column to attendance_change_requests table
ALTER TABLE attendance_change_requests
ADD COLUMN IF NOT EXISTS leave_type VARCHAR(50);

-- Add check constraint for valid leave types
ALTER TABLE attendance_change_requests
DROP CONSTRAINT IF EXISTS check_leave_type_for_paid_leave;

ALTER TABLE attendance_change_requests
ADD CONSTRAINT check_leave_type_for_paid_leave
CHECK (
    (requested_status != 'paid-leave') OR
    (requested_status = 'paid-leave' AND leave_type IS NOT NULL AND leave_type IN ('sick', 'casual', 'floater', 'earned', 'unpaid', 'maternity', 'paternity', 'other'))
);

-- Add comment for documentation
COMMENT ON COLUMN attendance_change_requests.leave_type IS 'Type of leave to deduct when paid-leave is approved. Required when requested_status is paid-leave.';
```

### Supabase SQL Editor URL

https://vwgsbstkbjygokydvnia.supabase.co/project/vwgsbstkbjygokydvnia/sql/new

## Code Changes

### 1. TypeScript Types (`types/erp.ts`)

- Added `leave_type?: string | null;` to `AttendanceChangeRequest` interface

### 2. Database Functions (`lib/erp/attendance-change-requests.ts`)

- Updated `createAttendanceChangeRequest()` to accept `leave_type` parameter
- Updated `reviewAttendanceChangeRequest()` to deduct leave balance when approving paid-leave:
  - Extracts year from request date
  - Fetches current leave balance for employee, year, and leave type
  - Increments `used_days` by 1 (full day)
  - Auto-calculates `remaining_days` (total_allocated - used_days)

### 3. Server Actions (`actions/erp/attendance-change-requests.ts`)

- Added `leave_type` validation with `.refine()` to ensure it's required when `requested_status` is 'paid-leave'
- Updated form data extraction to include `leave_type`

### 4. Employee Form (`components/erp/employee/AttendanceChangeRequestForm.tsx`)

- Added `useState` to track selected `requestedStatus`
- Shows leave type dropdown dynamically when "Paid Leave" is selected
- Leave types available:
  - Sick Leave
  - Casual Leave
  - Floater Leave
  - Earned Leave (OT)
  - Maternity Leave
  - Paternity Leave
  - Other
- Form validates that leave type is required for paid-leave requests

### 5. Admin Table (`components/erp/AttendanceChangeRequestsManagementTable.tsx`)

- Displays leave type badge in "Change" column when request is paid-leave
- Shows leave type in modal details view with purple badge
- Example: "PAID LEAVE" + "SICK LEAVE" badge

## User Flow

### Employee Side

1. Employee goes to Attendance page
2. Clicks "Request Change"
3. Selects date
4. Selects "Paid Leave" from status dropdown
5. **NEW**: Leave Type dropdown appears (required)
6. Selects leave type (e.g., "Sick Leave")
7. Enters reason (min 20 characters)
8. Submits request

### Admin Side

1. Admin reviews request in Attendance Change Requests page
2. Can see:
   - Employee details
   - Date
   - Status change (e.g., "ABSENT → PAID LEAVE")
   - **NEW**: Leave type badge (e.g., "SICK")
   - Reason
3. Approves or rejects request
4. **NEW**: On approval, system automatically:
   - Updates/creates attendance record
   - Deducts 1 day from employee's leave balance for that leave type

## Example Scenario

**Employee: Maha**

- Has 10 Sick Leave days available
- Was marked absent on June 12, 2026
- Requests change to Paid Leave (Sick)
- Admin approves

**Result:**

- Attendance for June 12 changed to "paid-leave"
- Sick Leave balance: 10 → 9
- Remaining days auto-calculated: 9
- Employee can see updated balance in Leave page

## Benefits

1. **Accurate Leave Tracking**: No manual adjustment needed
2. **Type-Specific Deduction**: Deducts from correct leave type (sick, casual, etc.)
3. **Automatic Calculation**: Remaining days computed instantly
4. **Audit Trail**: All changes logged with request IDs
5. **Validation**: Can't request paid-leave without specifying type

## Testing Checklist

- [ ] Employee can see leave type dropdown when selecting paid-leave
- [ ] Leave type is required when paid-leave is selected
- [ ] Form validation prevents submission without leave type
- [ ] Admin can see leave type in request list
- [ ] Admin can see leave type in review modal
- [ ] Approval deducts 1 day from correct leave balance
- [ ] Leave balance updates are visible in employee portal
- [ ] Rejection does not deduct from balance

## Files Modified

1. `db/add-leave-type-to-attendance-change-requests.sql` (NEW)
2. `scripts/migrate-add-leave-type.js` (NEW)
3. `types/erp.ts`
4. `lib/erp/attendance-change-requests.ts`
5. `actions/erp/attendance-change-requests.ts`
6. `components/erp/employee/AttendanceChangeRequestForm.tsx`
7. `components/erp/AttendanceChangeRequestsManagementTable.tsx`

## Related Features

- Leave Requests: Also deduct from leave balance on approval
- Leave Balance Display: Shows remaining days for each type
- Attendance Records: Can be changed via requests

## Notes

- Only full days (1 day) are deducted for attendance changes
- Half-day support can be added in future if needed
- Leave balance must exist for the employee, year, and type
- If balance fetch/update fails, approval still proceeds (logged as error)
