# ERP Leave Policy System

## Overview

This document outlines the complete leave policy system for XLEVELSUP ERP, including leave types, allocation rules, and overtime-based earned leave calculation.

## Leave Types & Allocation

### 1. Casual Leave

- **Annual Allocation**: 18 days per year (1.5 days per month)
- **Eligibility**: All employee types
- **Purpose**: Short-term personal needs, planned absences
- **Carry Forward**: As per company policy

### 2. Floater Leave

- **Annual Allocation**: 2 days per year
- **Eligibility**: All employee types
- **Purpose**: Festival holidays, personal choice holidays
- **Carry Forward**: Typically expires at year end

### 3. Sick Leave

- **Annual Allocation**: 10 days per year
- **Eligibility**: All employee types
- **Purpose**: Medical emergencies, illness, health appointments
- **Documentation**: May require medical certificate for extended periods

### 4. Earned Leave (OT-based)

- **Allocation**: Based on overtime hours worked
- **Calculation**: 8 hours of overtime = 1 day of earned leave
- **Eligibility**: All employee types who work overtime
- **Purpose**: Compensatory time off for extra hours worked
- **Tracking**: Automatically calculated from attendance overtime records

### 5. Unpaid Leave

- **Allocation**: Unlimited (subject to approval)
- **Eligibility**: All employee types
- **Purpose**: Extended absences beyond available paid leave

### 6. Maternity Leave

- **Allocation**: As per local labor laws (typically 26 weeks in India)
- **Eligibility**: Female employees
- **Purpose**: Childbirth and post-natal care

### 7. Paternity Leave

- **Allocation**: As per local labor laws (typically 15 days in India)
- **Eligibility**: Male employees
- **Purpose**: Childbirth support and newborn care

### 8. Other Leave

- **Allocation**: Case-by-case basis
- **Eligibility**: All employee types
- **Purpose**: Special circumstances (bereavement, relocation, etc.)

---

## Overtime & Earned Leave System

### How It Works

1. **Recording Overtime**
   - Admin/HR records overtime hours when marking attendance
   - Overtime hours field accepts values from 0 to 24 (in 0.5 hour increments)
   - Overtime can be recorded for any attendance status (typically "Present")

2. **Calculating Earned Leave**

   ```
   Earned Leave Days = Total Overtime Hours ÷ 8
   ```

   Example:
   - 20 hours of OT = 2.5 earned leave days (2 full days available)
   - 40 hours of OT = 5 earned leave days

3. **Auto-Update Process**
   - System automatically calculates total OT hours from attendance records
   - Earned leave balance is updated based on OT accumulation
   - Updates can be triggered manually or via scheduled job

### API Functions

#### For Admins

```typescript
// Update earned leave for a specific employee
await updateEarnedLeaveBalance(employeeId: number, year?: number)

// Batch update for all active employees
await batchUpdateEarnedLeaveBalances(year?: number)
```

#### Calculation

```typescript
// Calculate earned days from OT hours
calculateEarnedLeaveFromOT(overtimeHours: number): number
```

---

## Database Schema

### Attendance Table

```sql
overtime_hours NUMERIC(4, 2) DEFAULT 0
-- Stores overtime hours (e.g., 2.5, 4.0, 8.0)
```

### Leave Requests Table

```sql
leave_type VARCHAR(50) CHECK (
  leave_type IN ('sick', 'casual', 'floater', 'earned', 'unpaid',
                 'maternity', 'paternity', 'other')
)
```

### Leave Balances Table

```sql
employee_id INTEGER
year INTEGER
leave_type VARCHAR(50)
total_allocated NUMERIC(4,1)  -- Total days allocated
used_days NUMERIC(4,1)         -- Days used
remaining_days NUMERIC(4,1)    -- Auto-calculated (total - used)
```

---

## Migration from Old System

### Changes

1. **Removed**: Annual Leave type
2. **Added**: Casual (18 days), Floater (2 days), Sick (10 days), Earned (OT-based)
3. **Migrated**: Existing annual leave data converted to casual leave

### Migration Steps

1. Run `migration-new-leave-policy.sql` in Supabase SQL Editor
2. Script automatically:
   - Adds overtime_hours column to attendance table
   - Updates leave type constraints
   - Migrates annual leave → casual leave
   - Initializes new leave balances for all active employees

### Verification

After migration, verify:

- No annual leave references remain
- All employees have 4 leave balance records (casual, floater, sick, earned)
- Casual leave shows 18 days allocation
- Overtime hours field is accessible in attendance forms

---

## Usage Guide

### For Employees

**Requesting Leave:**

1. Go to Employee Portal → Leave Management
2. Select leave type from dropdown (shows allocation info)
3. Choose start and end dates
4. Provide reason (minimum 10 characters)
5. Submit request

**Viewing Balance:**

- Dashboard shows leave balance for all types
- Green indicates available days
- Red/Yellow indicates low balance

### For Admins/HR

**Recording Attendance with Overtime:**

1. Go to ERP → Attendance
2. Select employee and date
3. Mark status (usually "Present" for OT)
4. Enter overtime hours (e.g., 2.5 for 2.5 hours)
5. Save attendance
6. System automatically tracks OT for earned leave calculation

**Updating Earned Leave:**

```typescript
// Option 1: Update single employee
import { updateEarnedLeaveBalance } from '@/lib/erp/leave-requests';
await updateEarnedLeaveBalance(employeeId);

// Option 2: Update all employees (monthly job)
import { batchUpdateEarnedLeaveBalances } from '@/lib/erp/leave-requests';
await batchUpdateEarnedLeaveBalances();
```

**Reviewing Leave Requests:**

1. Go to ERP → Leave Requests
2. Filter by status (Pending, All, etc.)
3. Click "Review" on any request
4. Approve/Reject with optional comments
5. System auto-updates leave balance on approval

---

## Technical Implementation

### Files Modified

- `types/erp.ts` - Updated LeaveType enum, added overtime_hours to Attendance
- `lib/erp/leave-requests.ts` - New initialization logic, OT calculation functions
- `lib/erp/attendance.ts` - Handle overtime_hours in CRUD operations
- `actions/erp/leave-requests.ts` - Updated validation schema
- `actions/erp/attendance.ts` - Parse and validate overtime_hours
- `components/erp/AttendanceForm.tsx` - Added overtime hours input field
- `components/erp/employee/LeaveRequestForm.tsx` - Updated leave type options
- `components/erp/employee/LeaveRequestList.tsx` - Updated leave type labels
- `components/erp/LeaveManagementTable.tsx` - Updated admin view labels
- `db/schema.sql` - Updated table definitions
- `db/migration-new-leave-policy.sql` - Complete migration script

### Key Functions

**Leave Balance Initialization:**

```typescript
initializeLeaveBalance(employeeId: number, employmentType: string)
// Called automatically when creating new employee
// Initializes: casual (18), floater (2), sick (10), earned (0)
```

**OT Calculation:**

```typescript
calculateEarnedLeaveFromOT(overtimeHours: number): number
// Returns floor(overtimeHours / 8)
// Example: 20 hours → 2 days
```

**Update Earned Leave:**

```typescript
updateEarnedLeaveBalance(employeeId: number, year?: number): Promise<void>
// Queries all attendance records for year
// Sums overtime_hours
// Calculates earned days
// Updates leave_balances table
```

---

## Best Practices

### For Administrators

1. **Record OT Promptly**: Update overtime hours when marking attendance
2. **Run Monthly Updates**: Execute batchUpdateEarnedLeaveBalances() at month-end
3. **Monitor Balances**: Check employee leave balances regularly
4. **Policy Documentation**: Share this document with all employees

### For Employees

1. **Check Balance First**: Review your leave balance before requesting
2. **Plan Ahead**: Submit leave requests in advance when possible
3. **OT Tracking**: Keep personal records of overtime hours for verification
4. **Use Floater Wisely**: Only 2 floater days per year - plan for festivals

### For Developers

1. **Validation**: Always validate overtime_hours (0-24 range)
2. **Null Handling**: overtime_hours can be null (optional field)
3. **Precision**: Use NUMERIC(4,2) for fractional hours (supports 0.5 increments)
4. **Batch Updates**: Schedule batchUpdateEarnedLeaveBalances() as cron job
5. **Testing**: Test with various OT hour scenarios (fractional, edge cases)

---

## Support & Maintenance

### Common Issues

**Issue**: Earned leave not updating

- **Solution**: Run updateEarnedLeaveBalance() for the employee
- **Check**: Verify overtime_hours are recorded in attendance table

**Issue**: Wrong leave type options in form

- **Solution**: Clear browser cache, check validation schema
- **Check**: Ensure migration has been run successfully

**Issue**: Migration failed

- **Solution**: Check for constraint violations, run verification queries
- **Check**: Review Supabase logs for detailed error messages

### Monitoring

- Track average OT hours per employee
- Monitor leave approval rates
- Review leave balance utilization
- Audit earned leave calculations quarterly

---

## Future Enhancements

### Planned Features

1. **Automated OT Approval**: Require manager approval for OT before it counts toward earned leave
2. **Leave Carry Forward**: Implement policy for carrying unused days to next year
3. **Leave Encashment**: Allow employees to encash unused earned leave
4. **Notifications**: Email alerts for low leave balance, pending approvals
5. **Analytics**: Dashboard showing OT trends, leave patterns, team availability
6. **Mobile App**: Access leave management from mobile devices

### Configuration Options

Consider making these configurable:

- OT to earned leave ratio (currently 8:1)
- Leave allocations per employee type
- Maximum earned leave accumulation
- Carry forward rules per leave type

---

## Changelog

### Version 2.0 (Current - 2026-06-12)

- Replaced annual leave with new 4-type system
- Added overtime-based earned leave
- Migrated existing data automatically
- Updated all UI components and validations

### Version 1.0 (Initial)

- Basic leave request system
- Annual leave only (20 days for full-time)
- Manual attendance tracking
- Admin approval workflow
