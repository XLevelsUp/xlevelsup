# New Leave Policy Implementation - Quick Start Guide

## ✅ What's Been Implemented

### Leave Types (New System)

1. **Casual Leave**: 18 days/year (1.5 days/month) - for all employees
2. **Floater Leave**: 2 days/year - for all employees
3. **Sick Leave**: 10 days/year - for all employees
4. **Earned Leave**: Based on overtime (8 OT hours = 1 leave day)

### Technical Changes

- ✅ Updated all TypeScript types and interfaces
- ✅ Updated database schema files
- ✅ Updated all validation schemas
- ✅ Updated all UI forms and labels
- ✅ Added overtime hours tracking to attendance
- ✅ Created automatic earned leave calculation functions
- ✅ Created migration SQL script
- ✅ Updated leave balance initialization for new employees

---

## 🚀 Next Steps (Required)

### Step 1: Run Database Migration

**This is REQUIRED for the system to work!**

1. Go to Supabase SQL Editor:
   https://supabase.com/dashboard/project/vwgsbstkbjygokydvnia/sql/new

2. Open the migration file: `db/migration-new-leave-policy.sql`

3. Copy the entire contents and paste into Supabase SQL Editor

4. Click **"Run"**

5. Verify success - you should see:
   - "Leave balances initialized for all active employees"
   - Statistics showing leave type distribution

### Step 2: Test the System

**Test Attendance with OT:**

1. Go to http://localhost:3000/erp/attendance
2. Mark an employee as Present
3. Enter overtime hours (e.g., 2.5)
4. Save attendance

**Test Leave Request:**

1. Login as employee: http://localhost:3000/employee/login
2. Go to Leave Management
3. Notice new leave type options with allocations shown
4. Submit a casual leave request
5. Check your balance updates

**Test Admin View:**

1. Login as admin: http://localhost:3000/erp/login
2. Go to Leave Requests
3. Review and approve/reject
4. Notice new leave type labels

### Step 3: Update Earned Leave Balances

After recording some overtime hours, update earned leave:

**Option A: Single Employee (in code)**

```typescript
import { updateEmployeeEarnedLeaveAction } from '@/actions/erp/earned-leave';

// Update specific employee's earned leave
await updateEmployeeEarnedLeaveAction(employeeId);
```

**Option B: All Employees (run monthly)**

```typescript
import { batchUpdateEarnedLeaveAction } from '@/actions/erp/earned-leave';

// Update all employees at once (recommended: monthly cron job)
await batchUpdateEarnedLeaveAction();
```

---

## 📋 What Changed

### For Employees

- **Leave Request Form**: Now shows 4 new leave types with allocations
  - Casual Leave (18/year)
  - Floater Leave (2/year)
  - Sick Leave (10/year)
  - Earned Leave (OT-based)
- **Dashboard**: Leave balance now shows all 4 types
- **No more "Annual Leave"**: Migrated to Casual Leave

### For Admins/HR

- **Attendance Form**: New "Overtime Hours" field
  - Enter hours worked beyond regular time (0-24, in 0.5 increments)
  - Helps employees earn leave days
  - 8 OT hours = 1 earned leave day
- **Leave Management**: Updated labels to show new types
- **Batch Update**: Can update all employees' earned leave at once

### Database

- **attendance table**: Added `overtime_hours` column
- **leave_requests**: Updated to use new leave types
- **leave_balances**: Now tracks 4 types per employee
- **Migration**: Converts old annual leave data to new casual leave

---

## 📖 Documentation

Full documentation available in: [`docs/LEAVE_POLICY.md`](./LEAVE_POLICY.md)

Includes:

- Complete leave policy details
- API function reference
- Database schema documentation
- Migration guide
- Usage examples
- Best practices
- Troubleshooting guide

---

## 🔧 Files Modified

### Core Logic

- `types/erp.ts` - Type definitions
- `lib/erp/leave-requests.ts` - Leave management logic
- `lib/erp/attendance.ts` - Attendance with OT tracking
- `db/schema.sql` - Database schema

### Actions (Server-side)

- `actions/erp/leave-requests.ts` - Leave request validation
- `actions/erp/attendance.ts` - Attendance with OT validation
- `actions/erp/earned-leave.ts` - **NEW**: Earned leave update actions

### UI Components

- `components/erp/AttendanceForm.tsx` - Added OT hours input
- `components/erp/employee/LeaveRequestForm.tsx` - Updated leave types
- `components/erp/employee/LeaveRequestList.tsx` - Updated labels
- `components/erp/LeaveManagementTable.tsx` - Updated admin view

### Database

- `db/migration-new-leave-policy.sql` - **NEW**: Migration script
- `docs/LEAVE_POLICY.md` - **NEW**: Complete documentation

---

## ⚠️ Important Notes

1. **Migration is Required**: System won't work properly until you run the migration
2. **Data Safety**: Migration preserves existing data (annual → casual)
3. **OT Calculation**: Automatically runs when you call update functions
4. **Batch Updates**: Recommended to run monthly for all employees
5. **Backwards Compatible**: Old "annual" leave references are handled gracefully

---

## 🎯 Quick Verification

After running migration, check:

```sql
-- Check leave balance distribution
SELECT
    leave_type,
    COUNT(DISTINCT employee_id) as employee_count,
    AVG(total_allocated) as avg_allocated
FROM leave_balances
WHERE year = EXTRACT(YEAR FROM CURRENT_DATE)
GROUP BY leave_type;

-- Expected results:
-- casual:  X employees, 18 days
-- floater: X employees, 2 days
-- sick:    X employees, 10 days
-- earned:  X employees, 0-N days (depends on OT)
```

---

## 🆘 Need Help?

### System Not Working?

1. Check if migration was run successfully
2. Clear browser cache
3. Restart dev server: `npm run dev`
4. Check Supabase logs for errors

### Questions?

- Review [`docs/LEAVE_POLICY.md`](./LEAVE_POLICY.md) for detailed information
- Check migration file for SQL details
- Verify environment variables are set correctly

---

## 🎉 You're All Set!

Once migration is run, the new leave policy system is ready to use. All employees will have:

- 18 casual leave days
- 2 floater leave days
- 10 sick leave days
- 0 earned leave days (increases with overtime work)

Happy leave management! 🌴
